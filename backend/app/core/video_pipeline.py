# Enhanced OpenCV video processing pipeline
import cv2
import numpy as np
from typing import Optional

class VideoPipeline:
    def __init__(self, source: str = "0"):
        self.source = source
        self.cap: Optional[cv2.VideoCapture] = None

    def __enter__(self):
        self.start_stream(self.source)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()

    def start_stream(self, source: str = "0"):
        if isinstance(source, str) and source.isdigit():
            source = int(source)
        self.cap = cv2.VideoCapture(source)

    def calculate_vari(self, frame: np.ndarray) -> np.ndarray:
        """
        Calculates Visible Atmospherically Resistant Index (VARI)
        Formula: (Green - Red) / (Green + Red - Blue)
        """
        # Split channels
        b, g, r = cv2.split(frame.astype(np.float32))
        
        # Avoid division by zero
        denominator = g + r - b
        denominator[denominator == 0] = 0.001
        
        vari = (g - r) / denominator
        
        # Normalize to 0-255 for visualization
        vari_norm = cv2.normalize(vari, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        
        # Apply a colormap (Magma or Jet) to highlight stress
        return cv2.applyColorMap(vari_norm, cv2.COLORMAP_JET)

    def process_frame(self, frame: np.ndarray, mode: str = "normal") -> np.ndarray:
        if mode == "vari":
            return self.calculate_vari(frame)
        return frame

    def release(self):
        if self.cap:
            self.cap.release()
            self.cap = None
