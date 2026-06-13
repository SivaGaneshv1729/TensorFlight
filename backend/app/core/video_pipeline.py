import cv2
import numpy as np
import time
import threading
from typing import Optional

class VideoManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(VideoManager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.source = "0"
        self.cap: Optional[cv2.VideoCapture] = None
        self.last_frame: Optional[np.ndarray] = None
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        self.clients_count = 0
        self._initialized = True

    def start(self, source: str = "0"):
        with self._lock:
            self.source = source
            if not self.is_running:
                self.is_running = True
                self.thread = threading.Thread(target=self._capture_loop, daemon=True)
                self.thread.start()
                print(f"📹 Video Capture Thread Started for source {source}")

    def stop(self):
        with self._lock:
            self.is_running = False
            if self.cap:
                self.cap.release()
                self.cap = None
            print("📹 Video Capture Thread Stopped")

    def _capture_loop(self):
        source = self.source
        if isinstance(source, str) and source.isdigit():
            source = int(source)
        
        self.cap = cv2.VideoCapture(source)
        
        while self.is_running:
            if self.cap and self.cap.isOpened():
                success, frame = self.cap.read()
                if success:
                    self.last_frame = frame
                else:
                    self.last_frame = self._generate_mock_frame()
                    time.sleep(0.03) # Cap mock frame rate
            else:
                self.last_frame = self._generate_mock_frame()
                time.sleep(0.03)
            
            # Small sleep to prevent pegged CPU if camera fails
            if not self.cap or not self.cap.isOpened():
                time.sleep(0.1)

    def _generate_mock_frame(self) -> np.ndarray:
        # Create a lush green base representing crops
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        frame[:] = (20, 50, 20) # Deep green grass tone
        
        t = time.time()
        
        # Draw parallel crop rows scrolling horizontally to simulate flight movement
        offset = int((t * 60) % 80)
        for x in range(-80, 640 + 80, 80):
            cv2.line(frame, (x + offset, 0), (x + offset, 480), (30, 80, 30), 12)
            
        # Draw some brown soil patches between the rows
        for y in range(0, 480, 120):
            py = int(y + (t * 20) % 120)
            cv2.circle(frame, (200, py), 15, (40, 60, 50), -1)
            cv2.circle(frame, (440, (py + 60) % 480), 20, (35, 55, 45), -1)

        # Draw AI simulated weed bounding boxes (Red)
        w_x1 = int(120 + 80 * np.sin(t * 0.4))
        w_y1 = int(150 + 60 * np.cos(t * 0.3))
        cv2.rectangle(frame, (w_x1, w_y1), (w_x1 + 60, w_y1 + 40), (0, 0, 255), 2)
        cv2.putText(frame, "AI TARGET: WEED (89%)", (w_x1, w_y1 - 6), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)

        w_x2 = int(450 + 70 * np.cos(t * 0.2))
        w_y2 = int(280 + 50 * np.sin(t * 0.4))
        cv2.rectangle(frame, (w_x2, w_y2), (w_x2 + 70, w_y2 + 50), (0, 0, 255), 2)
        cv2.putText(frame, "AI TARGET: WEED (94%)", (w_x2, w_y2 - 6), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)

        # Draw AI simulated crop stress / pest patches (Yellow)
        s_x = int(280 + 100 * np.cos(t * 0.3))
        s_y = int(80 + 40 * np.sin(t * 0.5))
        cv2.rectangle(frame, (s_x, s_y), (s_x + 90, s_y + 70), (0, 255, 255), 2)
        cv2.putText(frame, "AI DETECT: CROP STRESS (78%)", (s_x, s_y - 6), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)

        # Overlay crosshairs and telemetry UI text on the camera feed
        cv2.drawMarker(frame, (320, 240), (204, 255, 0), cv2.MARKER_CROSS, 25, 2)
        cv2.putText(frame, "AI SCANNING ACTIVE - 30 FPS", (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (204, 255, 0), 1)
        
        return frame

    def get_frame(self, mode: str = "normal") -> np.ndarray:
        frame = self.last_frame
        if frame is None:
            frame = self._generate_mock_frame()
        
        if mode == "vari":
            return self.calculate_vari(frame)
        return frame

    def calculate_vari(self, frame: np.ndarray) -> np.ndarray:
        """Calculates Visible Atmospherically Resistant Index (VARI)."""
        b, g, r = cv2.split(frame.astype(np.float32))
        
        # VARI = (Green - Red) / (Green + Red - Blue)
        vari = (g - r) / (g + r - b + 1e-6)
        
        # VARI typically ranges from -1 to 1. 
        # We'll map -0.2 to 0.4 to 0-255 for better contrast on vegetation
        # Healthy plants are usually > 0.1
        vari_clipped = np.clip(vari, -0.2, 0.4)
        vari_norm = ((vari_clipped + 0.2) / 0.6 * 255).astype(np.uint8)
        
        return cv2.applyColorMap(vari_norm, cv2.COLORMAP_JET)

video_manager = VideoManager()
