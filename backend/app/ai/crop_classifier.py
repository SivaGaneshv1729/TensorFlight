"""
crop_classifier.py
ML-based weed/pest/health classifier for detected vegetation zones.

Uses a scikit-learn RandomForest trained on spectral + shape features
derived from the VegetationAnalyzer zones.

Feature vector per zone (9 features):
  [vari_mean, exg_mean, ngrdi_mean, hue_mean, texture_variance,
   area_normalized, vari_std_proxy, exg_hue_ratio, ngrdi_exg_ratio]

Classes:
  0 = HEALTHY_CROP
  1 = WEED
  2 = PEST_STRESS
  3 = DROUGHT_STRESS

If no trained model file exists, the classifier falls back to
a physics-informed rule set derived from agronomic literature.
"""

import os
import pickle
import logging
import numpy as np
from dataclasses import dataclass
from typing import List, Optional
from pathlib import Path

from app.ai.vegetation_analysis import VegetationZone

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent / "models" / "crop_classifier.pkl"

LABELS = {
    0: "HEALTHY_CROP",
    1: "WEED",
    2: "PEST_STRESS",
    3: "DROUGHT_STRESS",
}

LABEL_COLORS = {
    "HEALTHY_CROP":    (0, 200, 60),    # Green
    "WEED":            (0, 0, 255),     # Red  (BGR)
    "PEST_STRESS":     (0, 255, 255),   # Yellow
    "DROUGHT_STRESS":  (0, 140, 255),   # Orange
    "LIVESTOCK":       (255, 0, 255),   # Magenta
    "MACHINERY":       (255, 100, 100), # Light Blue
    "FARM_WORKER":     (255, 255, 0),   # Cyan
}


@dataclass
class DetectionResult:
    label: str
    confidence: float
    bbox: tuple           # (x, y, w, h) pixels
    area_px: int
    vari_mean: float
    exg_mean: float
    ngrdi_mean: float
    spray_recommended: bool


class CropClassifier:
    """
    Classifies vegetation zones as Healthy / Weed / Pest / Drought.
    """

    def __init__(self):
        self.model = None
        self._try_load_model()

    def _try_load_model(self):
        """Load sklearn model from disk if it exists."""
        if MODEL_PATH.exists():
            try:
                with open(MODEL_PATH, "rb") as f:
                    self.model = pickle.load(f)
                logger.info(f"✅ Crop classifier model loaded from {MODEL_PATH}")
            except Exception as e:
                logger.warning(f"Could not load classifier model: {e}. Using rule-based fallback.")
                self.model = None
        else:
            logger.info(f"No trained model at {MODEL_PATH} — using rule-based agronomic classifier.")

    def extract_features(self, zone: VegetationZone) -> np.ndarray:
        """
        Build the 9-feature vector from a VegetationZone.
        All features are bounded to avoid NaN/Inf.
        """
        # Normalize area to 0..1 relative to a 640×480 frame
        area_norm = min(zone.area_px / (640 * 480), 1.0)

        # Cross-index ratios capture relationships between spectral signals
        exg_hue_ratio  = zone.exg_mean / max(zone.hue_mean / 180.0, 1e-4)
        ngrdi_exg_ratio = zone.ngrdi_mean / max(zone.exg_mean + 0.5, 1e-4)
        vari_std_proxy = abs(zone.vari_mean - zone.exg_mean)  # Proxy for variability

        feat = np.array([
            np.clip(zone.vari_mean,      -1.0, 1.0),
            np.clip(zone.exg_mean,       -1.0, 1.0),
            np.clip(zone.ngrdi_mean,     -1.0, 1.0),
            np.clip(zone.hue_mean / 180, 0.0,  1.0),   # normalised hue
            np.clip(zone.texture_variance / 5000, 0.0, 1.0),  # normalised texture
            area_norm,
            np.clip(vari_std_proxy, 0.0, 2.0),
            np.clip(exg_hue_ratio, -5.0, 5.0),
            np.clip(ngrdi_exg_ratio, -5.0, 5.0),
        ], dtype=np.float32)

        return feat

    def _rule_based_classify(self, zone: VegetationZone) -> tuple[str, float]:
        """
        Agronomically-grounded rule set based on published spectral thresholds.

        Key references:
        - VARI > 0.15: Strong healthy vegetation (Gitelson et al., 2002)
        - VARI < -0.05: Stressed / dead vegetation
        - ExG > 0.15 but VARI < 0.05: Weed candidate (high greenness, low health)
        - hue 35-55 + low VARI: Yellowing/pest stress
        - Very high texture_variance: Possibly dense weed cluster
        """
        vari = zone.vari_mean
        exg = zone.exg_mean
        ngrdi = zone.ngrdi_mean
        hue = zone.hue_mean  # 0-180 OpenCV

        # Rule 1: Strong healthy crop
        if vari > 0.15 and exg > 0.12 and ngrdi > 0.08:
            confidence = min(0.60 + vari * 0.8, 0.97)
            return "HEALTHY_CROP", round(confidence, 2)

        # Rule 2: Weed — high excess green but unhealthy VARI (different spectral signature)
        # Weeds tend to be bright green but have different chlorophyll ratios
        if exg > 0.10 and vari < 0.08 and ngrdi < 0.05:
            confidence = min(0.55 + abs(ngrdi) * 1.5, 0.93)
            return "WEED", round(confidence, 2)

        # Rule 3: Pest stress — yellowish hue (hue 20-50 in OpenCV) with low VARI
        if 20 <= hue <= 55 and vari < 0.05 and exg > 0.03:
            confidence = min(0.50 + (55 - hue) / 55 * 0.4, 0.91)
            return "PEST_STRESS", round(confidence, 2)

        # Rule 4: Drought stress — reddish-brown, very low VARI
        if vari < -0.02 and exg < 0.05:
            confidence = min(0.50 + abs(vari) * 1.2, 0.90)
            return "DROUGHT_STRESS", round(confidence, 2)

        # Rule 5: Moderately healthy
        if vari > 0.05:
            return "HEALTHY_CROP", round(min(0.50 + vari, 0.80), 2)

        # Default: treat as weed candidate with low confidence
        return "WEED", 0.45

    def classify_zones(self, zones: List[VegetationZone]) -> List[DetectionResult]:
        """
        Classify a list of VegetationZones and return DetectionResults.
        """
        results = []
        for zone in zones:
            if self.model is not None:
                # ML path
                features = self.extract_features(zone).reshape(1, -1)
                try:
                    pred_class = int(self.model.predict(features)[0])
                    proba = self.model.predict_proba(features)[0]
                    label = LABELS.get(pred_class, "WEED")
                    confidence = float(proba[pred_class])
                except Exception:
                    label, confidence = self._rule_based_classify(zone)
            else:
                # Rule-based fallback
                label, confidence = self._rule_based_classify(zone)

            spray_recommended = label in ("WEED", "PEST_STRESS") and confidence > 0.60

            results.append(DetectionResult(
                label=label,
                confidence=confidence,
                bbox=zone.bbox,
                area_px=zone.area_px,
                vari_mean=zone.vari_mean,
                exg_mean=zone.exg_mean,
                ngrdi_mean=zone.ngrdi_mean,
                spray_recommended=spray_recommended,
            ))

        # Sort: most confident first
        results.sort(key=lambda r: r.confidence, reverse=True)
        return results

    def save_model(self, sklearn_model):
        """Persist a trained sklearn model to disk."""
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(sklearn_model, f)
        self.model = sklearn_model
        logger.info(f"✅ Model saved to {MODEL_PATH}")

    def train_from_synthetic_data(self):
        """
        Train a RandomForest on synthetic but agronomically accurate feature data.
        This bootstraps a working model without requiring labelled imagery.

        Feature distributions are derived from published precision-agriculture datasets:
        - Healthy crop: VARI 0.15–0.45, ExG 0.12–0.35, hue 40–75°
        - Weed:         VARI 0.02–0.12, ExG 0.10–0.25, hue 50–90° (often different from crop)
        - Pest stress:  VARI -0.05–0.08, ExG 0.03–0.15, hue 20–55°
        - Drought:      VARI -0.15–0.02, ExG -0.05–0.06, hue 15–40°
        """
        try:
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.preprocessing import StandardScaler
            from sklearn.pipeline import Pipeline
        except ImportError:
            logger.warning("scikit-learn not installed, skipping model training.")
            return

        rng = np.random.default_rng(42)
        n = 800  # samples per class

        def make_samples(vari_range, exg_range, ngrdi_range, hue_range, n=n):
            vari  = rng.uniform(*vari_range,  size=n)
            exg   = rng.uniform(*exg_range,   size=n)
            ngrdi = rng.uniform(*ngrdi_range, size=n)
            hue   = rng.uniform(*hue_range,   size=n)
            tx    = rng.exponential(300, size=n)   # texture variance
            area  = rng.uniform(0.001, 0.15, size=n)
            vari_std = np.abs(vari - exg)
            exg_hue_ratio   = exg / np.maximum(hue / 180, 1e-4)
            ngrdi_exg_ratio = ngrdi / np.maximum(exg + 0.5, 1e-4)
            return np.stack([vari, exg, ngrdi, hue/180, np.clip(tx/5000, 0, 1),
                             area, np.clip(vari_std, 0, 2),
                             np.clip(exg_hue_ratio, -5, 5),
                             np.clip(ngrdi_exg_ratio, -5, 5)], axis=1)

        X = np.vstack([
            make_samples((0.15, 0.45),  (0.12, 0.35),  (0.08, 0.40),  (40,  75)),  # 0 healthy
            make_samples((0.02, 0.12),  (0.10, 0.25),  (-0.03, 0.08), (50,  90)),  # 1 weed
            make_samples((-0.05, 0.08), (0.03, 0.15),  (-0.05, 0.05), (20,  55)),  # 2 pest
            make_samples((-0.15, 0.02), (-0.05, 0.06), (-0.10, 0.02), (15,  40)),  # 3 drought
        ])
        y = np.array([0]*n + [1]*n + [2]*n + [3]*n)

        # Add Gaussian noise for robustness
        X += rng.normal(0, 0.02, X.shape)

        model = Pipeline([
            ("scaler", StandardScaler()),
            ("clf", RandomForestClassifier(
                n_estimators=120,
                max_depth=10,
                min_samples_leaf=5,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1,
            ))
        ])
        model.fit(X, y)
        self.save_model(model)
        logger.info("✅ Synthetic RandomForest trained and saved.")


# Module-level singleton — trains on first import if no model exists
crop_classifier = CropClassifier()
if crop_classifier.model is None:
    logger.info("Training synthetic bootstrapped model...")
    crop_classifier.train_from_synthetic_data()
