# Enhanced OpenCV video processing pipeline
import cv2
import numpy as np
import time
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
        
        if not self.cap.isOpened():
            print(f"⚠️ Could not open video source {source}. Using mock stream.")
            self.cap = None

    def _generate_mock_frame(self) -> np.ndarray:
        """Generates a synthetic frame with some noise and text."""
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        # Add some random noise
        noise = np.random.randint(0, 20, (480, 640, 3), dtype=np.uint8)
        frame = cv2.add(frame, noise)
        
        # Add "MOCK STREAM" text
        cv2.putText(frame, "MOCK STREAM - NO CAMERA FOUND", (50, 240), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # Add a moving circle to simulate some activity
        t = time.time()
        center = (int(320 + 100 * np.cos(t)), int(240 + 100 * np.sin(t)))
        cv2.circle(frame, center, 20, (39, 255, 20), -1) # Agri-neon color
        
        return frame

    def calculate_vari(self, frame: np.ndarray) -> np.ndarray:
        """Calculates Visible Atmospherically Resistant Index (VARI) for vegetation health."""
        # Convert to float for calculation
        b, g, r = cv2.split(frame.astype(np.float32))
        
        # VARI formula: (Green - Red) / (Green + Red - Blue)
        # Adding a small epsilon to avoid division by zero
        vari = (g - r) / (g + r - b + 1e-6)
        
        # Normalize the result to 0-255 range
        vari_norm = cv2.normalize(vari, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        
        # Apply a colormap to make it look like a thermal/health map
        return cv2.applyColorMap(vari_norm, cv2.COLORMAP_JET)

    def process_frame(self, frame: np.ndarray, mode: str = "normal") -> np.ndarray:
        if mode == "vari":
            return self.calculate_vari(frame)
        return frame

    def read_frame(self) -> tuple[bool, np.ndarray]:
        if self.cap and self.cap.isOpened():
            return self.cap.read()
        else:
            return True, self._generate_mock_frame()

    def release(self):
        if self.cap:
            self.cap.release()
            self.cap = None
