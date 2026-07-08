"""
vegetation_analysis.py
Real vegetation index computation from RGB camera frames.

Computes:
  - VARI  (Visible Atmospherically Resistant Index) — works with regular RGB cameras
  - ExG   (Excess Green Index)                       — good for separating green plants from soil
  - NGRDI (Normalized Green-Red Difference Index)    — proxy for chlorophyll content

These are the standard indices used in precision agriculture when only an RGB camera
is available (no NIR channel). All computations are vectorized with NumPy for speed.
"""

import cv2
import numpy as np
from dataclasses import dataclass, field
from typing import List, Tuple


@dataclass
class VegetationZone:
    """A contiguous region of vegetation identified in the frame."""
    bbox: Tuple[int, int, int, int]   # (x, y, w, h) in pixels
    area_px: int
    vari_mean: float          # -1..1,  higher = healthier green vegetation
    exg_mean: float           # 0..2,   higher = more excess green
    ngrdi_mean: float         # -1..1,  higher = more chlorophyll proxy
    hue_mean: float           # 0..180 (OpenCV hue)
    texture_variance: float   # Laplacian variance — rough proxy for leaf texture
    mask: np.ndarray = field(repr=False, default=None)


class VegetationAnalyzer:
    """
    Analyzes a BGR frame (from OpenCV) and returns segmented vegetation zones
    with per-zone spectral/shape features suitable for ML classification.
    """

    def __init__(
        self,
        vari_healthy_threshold: float = 0.05,   # VARI > this = likely healthy vegetation
        exg_vegetation_threshold: float = 0.10, # ExG > this = vegetation (not bare soil)
        min_zone_area_px: int = 400,             # Ignore tiny blobs < this many pixels
    ):
        self.vari_healthy_threshold = vari_healthy_threshold
        self.exg_vegetation_threshold = exg_vegetation_threshold
        self.min_zone_area_px = min_zone_area_px

    # ------------------------------------------------------------------ #
    #  Index computations (all operate on float32 BGR frame 0..255)        #
    # ------------------------------------------------------------------ #

    def compute_vari(self, bgr_float: np.ndarray) -> np.ndarray:
        """VARI = (G - R) / (G + R - B)  clamped to [-1, 1]."""
        b, g, r = bgr_float[:, :, 0], bgr_float[:, :, 1], bgr_float[:, :, 2]
        denom = g + r - b
        denom = np.where(np.abs(denom) < 1e-6, 1e-6, denom)
        return np.clip((g - r) / denom, -1.0, 1.0)

    def compute_exg(self, bgr_float: np.ndarray) -> np.ndarray:
        """ExG = 2G - R - B  (normalized by total intensity)."""
        b, g, r = bgr_float[:, :, 0], bgr_float[:, :, 1], bgr_float[:, :, 2]
        total = r + g + b
        total = np.where(total < 1e-6, 1e-6, total)
        r_n, g_n, b_n = r / total, g / total, b / total
        return np.clip(2.0 * g_n - r_n - b_n, -1.0, 1.0)

    def compute_ngrdi(self, bgr_float: np.ndarray) -> np.ndarray:
        """NGRDI = (G - R) / (G + R)."""
        b, g, r = bgr_float[:, :, 0], bgr_float[:, :, 1], bgr_float[:, :, 2]
        denom = g + r
        denom = np.where(denom < 1e-6, 1e-6, denom)
        return np.clip((g - r) / denom, -1.0, 1.0)

    # ------------------------------------------------------------------ #
    #  Segmentation                                                        #
    # ------------------------------------------------------------------ #

    def _vegetation_mask(self, bgr: np.ndarray, exg: np.ndarray) -> np.ndarray:
        """
        Binary mask of pixels likely to be vegetation.
        Strategy: ExG > threshold AND hue in green range (35–85° in OpenCV space).
        """
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
        hue = hsv[:, :, 0]

        # Green hue band: 35-85 in OpenCV (0-180 scale)
        hue_mask = ((hue >= 25) & (hue <= 95)).astype(np.uint8) * 255

        exg_mask = (exg > self.exg_vegetation_threshold).astype(np.uint8) * 255

        combined = cv2.bitwise_and(hue_mask, exg_mask)

        # Morphological cleanup
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        combined = cv2.morphologyEx(combined, cv2.MORPH_OPEN, kernel, iterations=1)
        combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel, iterations=2)
        return combined

    def _stress_mask(self, bgr: np.ndarray, vari: np.ndarray, exg: np.ndarray) -> np.ndarray:
        """
        Binary mask of pixels likely to show plant stress or soil.
        These are areas that ARE green-ish in hue but have low VARI (stressed/yellowing).
        """
        exg_low = ((exg > 0.03) & (exg < self.exg_vegetation_threshold + 0.08)).astype(np.uint8) * 255
        vari_low = (vari < self.vari_healthy_threshold).astype(np.uint8) * 255
        combined = cv2.bitwise_and(exg_low, vari_low)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        combined = cv2.morphologyEx(combined, cv2.MORPH_OPEN, kernel)
        combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)
        return combined

    # ------------------------------------------------------------------ #
    #  Main entry point                                                    #
    # ------------------------------------------------------------------ #

    def analyze(self, bgr_frame: np.ndarray) -> dict:
        """
        Full analysis of one frame.

        Returns a dict with:
          - vari_index: np.ndarray (H×W)
          - exg_index:  np.ndarray (H×W)
          - ngrdi_index: np.ndarray (H×W)
          - vegetation_mask: np.ndarray uint8 (H×W)
          - stress_mask: np.ndarray uint8 (H×W)
          - healthy_zones: List[VegetationZone]
          - stress_zones:  List[VegetationZone]
          - frame_stats: dict with scalar statistics
        """
        if bgr_frame is None or bgr_frame.size == 0:
            return self._empty_result()

        bgr_f = bgr_frame.astype(np.float32)

        # 1. Compute indices
        vari  = self.compute_vari(bgr_f)
        exg   = self.compute_exg(bgr_f)
        ngrdi = self.compute_ngrdi(bgr_f)

        # 2. Segmentation masks
        veg_mask    = self._vegetation_mask(bgr_frame, exg)
        stress_mask = self._stress_mask(bgr_frame, vari, exg)

        # 3. Extract zones from masks
        healthy_zones = self._extract_zones(bgr_frame, veg_mask, vari, exg, ngrdi)
        stress_zones  = self._extract_zones(bgr_frame, stress_mask, vari, exg, ngrdi)

        # 4. Frame-level statistics
        veg_pixels = veg_mask > 0
        total_px = bgr_frame.shape[0] * bgr_frame.shape[1]
        vari_values = vari[veg_pixels] if veg_pixels.any() else np.array([0.0])

        frame_stats = {
            "vari_mean":    float(np.mean(vari_values)),
            "vari_std":     float(np.std(vari_values)),
            "exg_mean":     float(np.mean(exg[veg_pixels])) if veg_pixels.any() else 0.0,
            "ngrdi_mean":   float(np.mean(ngrdi[veg_pixels])) if veg_pixels.any() else 0.0,
            "coverage_pct": float(veg_pixels.sum() / total_px * 100),
            "stress_pct":   float((stress_mask > 0).sum() / total_px * 100),
        }

        return {
            "vari_index":      vari,
            "exg_index":       exg,
            "ngrdi_index":     ngrdi,
            "vegetation_mask": veg_mask,
            "stress_mask":     stress_mask,
            "healthy_zones":   healthy_zones,
            "stress_zones":    stress_zones,
            "frame_stats":     frame_stats,
        }

    def _extract_zones(
        self,
        bgr: np.ndarray,
        mask: np.ndarray,
        vari: np.ndarray,
        exg: np.ndarray,
        ngrdi: np.ndarray,
    ) -> List[VegetationZone]:
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        zones = []
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < self.min_zone_area_px:
                continue

            x, y, w, h = cv2.boundingRect(cnt)

            # Per-zone mask
            zone_mask = np.zeros(mask.shape[:2], dtype=np.uint8)
            cv2.drawContours(zone_mask, [cnt], -1, 255, -1)

            zone_px = zone_mask > 0
            if zone_px.sum() == 0:
                continue

            zones.append(VegetationZone(
                bbox=(x, y, w, h),
                area_px=int(area),
                vari_mean=float(np.mean(vari[zone_px])),
                exg_mean=float(np.mean(exg[zone_px])),
                ngrdi_mean=float(np.mean(ngrdi[zone_px])),
                hue_mean=float(np.mean(hsv[:, :, 0][zone_px])),
                texture_variance=float(cv2.Laplacian(gray[y:y+h, x:x+w], cv2.CV_64F).var()),
                mask=zone_mask,
            ))
        return zones

    def _empty_result(self) -> dict:
        return {
            "vari_index": np.zeros((480, 640), dtype=np.float32),
            "exg_index": np.zeros((480, 640), dtype=np.float32),
            "ngrdi_index": np.zeros((480, 640), dtype=np.float32),
            "vegetation_mask": np.zeros((480, 640), dtype=np.uint8),
            "stress_mask": np.zeros((480, 640), dtype=np.uint8),
            "healthy_zones": [],
            "stress_zones": [],
            "frame_stats": {"vari_mean": 0.0, "vari_std": 0.0, "exg_mean": 0.0, "ngrdi_mean": 0.0, "coverage_pct": 0.0, "stress_pct": 0.0},
        }


# Module-level singleton
vegetation_analyzer = VegetationAnalyzer()
