"""
analysis_engine.py
Central AI orchestrator — ties together:
  - VegetationAnalyzer (spectral indices)
  - CropClassifier     (ML-based zone labelling)
  - WeatherModel       (real/simulated weather)

Runs in a background thread to avoid blocking the FastAPI event loop.
Exposes thread-safe `get_latest_report()` for the WebSocket broadcaster.
"""

import cv2
import time
import threading
import logging
from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any

from app.ai.vegetation_analysis import vegetation_analyzer, VegetationZone
from app.ai.crop_classifier import crop_classifier, DetectionResult, LABEL_COLORS
from app.ai.weather_model import weather_model, WeatherReport
from app.core.video_pipeline import video_manager

logger = logging.getLogger(__name__)


@dataclass
class AIReport:
    """Complete AI analysis for one video frame."""
    timestamp: float = 0.0

    # Detection counts
    weed_count: int = 0
    pest_stressed_count: int = 0
    drought_stressed_count: int = 0
    healthy_zone_count: int = 0

    # Vegetation health
    coverage_pct: float = 0.0          # % of frame covered by vegetation
    stress_pct: float = 0.0            # % of vegetation showing stress
    vari_mean: float = 0.0
    exg_mean: float = 0.0
    ngrdi_mean: float = 0.0

    # Spray decision
    spray_recommended: bool = False
    spray_zone_count: int = 0

    # Collision / safety
    collision_warning: bool = False

    # Weather
    wind_speed_mps: float = 0.0
    wind_dir_deg: float = 0.0
    temperature_c: float = 20.0
    humidity_pct: float = 50.0
    is_storming: bool = False
    is_safe_to_fly: bool = True
    weather_source: str = "model"

    # Detailed detections list (serialisable)
    detections: List[Dict[str, Any]] = field(default_factory=list)

    def to_ai_analysis_dict(self) -> dict:
        """Returns the subset expected by the frontend telemetry schema."""
        return {
            "weed_count":          self.weed_count,
            "pest_stressed_count": self.pest_stressed_count,
            "drought_stressed_count": self.drought_stressed_count,
            "healthy_zone_count":  self.healthy_zone_count,
            "coverage_pct":        round(self.coverage_pct, 1),
            "stress_pct":          round(self.stress_pct, 1),
            "vari_mean":           round(self.vari_mean, 3),
            "exg_mean":            round(self.exg_mean, 3),
            "ngrdi_mean":          round(self.ngrdi_mean, 3),
            "spray_recommended":   self.spray_recommended,
            "spray_zone_count":    self.spray_zone_count,
            "collision_warning":   self.collision_warning,
            "wind_speed_mps":      round(self.wind_speed_mps, 2),
            "wind_dir_deg":        round(self.wind_dir_deg, 1),
            "temperature_c":       round(self.temperature_c, 1),
            "humidity_pct":        round(self.humidity_pct, 1),
            "is_storming":         self.is_storming,
            "is_safe_to_fly":      self.is_safe_to_fly,
            "weather_source":      self.weather_source,
            "detections":          self.detections,
        }


class AnalysisEngine:
    """
    Background AI engine. Runs vegetation + crop analysis at ~4fps
    and weather refresh every 10 minutes. Thread-safe.
    """
    ANALYSIS_INTERVAL_S = 0.25   # 4 fps AI analysis
    ANNOTATE_FRAME = True        # Draw bboxes onto the video feed

    def __init__(self):
        self._lock = threading.Lock()
        self._latest_report: AIReport = AIReport(timestamp=time.time())
        self._running = False
        self._thread: Optional[threading.Thread] = None
        # History for trend analysis
        self._history: List[Dict] = []
        self._MAX_HISTORY = 500

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True, name="ai-engine")
        self._thread.start()
        logger.info("🤖 AI Analysis Engine started.")

    def stop(self):
        self._running = False

    def get_latest_report(self) -> AIReport:
        with self._lock:
            return self._latest_report

    def get_history(self) -> List[Dict]:
        with self._lock:
            return list(self._history)

    # ------------------------------------------------------------------ #
    #  Background loop                                                     #
    # ------------------------------------------------------------------ #

    def _run_loop(self):
        while self._running:
            try:
                start = time.time()
                report = self._analyze()
                with self._lock:
                    self._latest_report = report
                    hist_entry = {
                        "t": report.timestamp,
                        "weed_count": report.weed_count,
                        "pest_count": report.pest_stressed_count,
                        "vari": report.vari_mean,
                        "stress_pct": report.stress_pct,
                        "wind": report.wind_speed_mps,
                    }
                    self._history.append(hist_entry)
                    if len(self._history) > self._MAX_HISTORY:
                        self._history = self._history[-self._MAX_HISTORY:]

                elapsed = time.time() - start
                sleep_time = max(0.0, self.ANALYSIS_INTERVAL_S - elapsed)
                time.sleep(sleep_time)

            except Exception as e:
                logger.error(f"AI Engine error: {e}", exc_info=True)
                time.sleep(1.0)  # Back off on error

    def _analyze(self) -> AIReport:
        report = AIReport(timestamp=time.time())

        # ---------- 1. Video / Vegetation analysis ----------
        frame = video_manager.last_frame
        if frame is not None and frame.size > 0:
            analysis = vegetation_analyzer.analyze(frame)
            stats = analysis["frame_stats"]

            report.vari_mean    = stats["vari_mean"]
            report.exg_mean     = stats["exg_mean"]
            report.ngrdi_mean   = stats["ngrdi_mean"]
            report.coverage_pct = stats["coverage_pct"]
            report.stress_pct   = stats["stress_pct"]

            # Classify stress zones (most likely weeds/pests)
            stress_zones  = analysis["stress_zones"]
            healthy_zones = analysis["healthy_zones"]
            all_zones     = stress_zones + healthy_zones

            detections: List[DetectionResult] = crop_classifier.classify_zones(all_zones)

            weed_count     = sum(1 for d in detections if d.label == "WEED")
            pest_count     = sum(1 for d in detections if d.label == "PEST_STRESS")
            drought_count  = sum(1 for d in detections if d.label == "DROUGHT_STRESS")
            healthy_count  = sum(1 for d in detections if d.label == "HEALTHY_CROP")
            spray_zones    = [d for d in detections if d.spray_recommended]

            report.weed_count            = weed_count
            report.pest_stressed_count   = pest_count
            report.drought_stressed_count = drought_count
            report.healthy_zone_count    = healthy_count
            report.spray_recommended     = len(spray_zones) > 0
            report.spray_zone_count      = len(spray_zones)

            # Annotate frame with bboxes
            if self.ANNOTATE_FRAME and detections:
                annotated = frame.copy()
                for det in detections:
                    if det.label == "HEALTHY_CROP":
                        continue  # Don't clutter with healthy boxes
                    x, y, w, h = det.bbox
                    color = LABEL_COLORS.get(det.label, (255, 255, 255))
                    cv2.rectangle(annotated, (x, y), (x+w, y+h), color, 2)
                    label_txt = f"{det.label} {det.confidence:.0%}"
                    (tw, th), _ = cv2.getTextSize(label_txt, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
                    cv2.rectangle(annotated, (x, y - th - 6), (x + tw + 4, y), color, -1)
                    cv2.putText(annotated, label_txt, (x+2, y-4),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1, cv2.LINE_AA)
                # Write annotated frame back so video stream shows real detections
                video_manager.last_frame = annotated

            # Serialisable detections for WS payload
            report.detections = [
                {
                    "label":      d.label,
                    "confidence": round(d.confidence, 2),
                    "bbox":       list(d.bbox),
                    "area_px":    d.area_px,
                    "vari_mean":  round(d.vari_mean, 3),
                }
                for d in detections
                if d.label != "HEALTHY_CROP"   # Only anomalies in payload
            ]

        # ---------- 2. Weather ----------
        weather: WeatherReport = weather_model.get_weather()
        report.wind_speed_mps  = weather.wind_speed_mps
        report.wind_dir_deg    = weather.wind_dir_deg
        report.temperature_c   = weather.temperature_c
        report.humidity_pct    = weather.humidity_pct
        report.is_storming     = weather.is_storming
        report.is_safe_to_fly  = weather.is_safe_to_fly
        report.weather_source  = weather.source

        # ---------- 3. Collision warning heuristic ----------
        # Triggered if wind is high AND drone is moving (stress as proxy for activity)
        report.collision_warning = weather.wind_speed_mps > 8.0 and not weather.is_safe_to_fly

        return report


# Module-level singleton — started in main.py lifespan
analysis_engine = AnalysisEngine()
