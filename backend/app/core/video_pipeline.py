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
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        noise = np.random.randint(0, 15, (480, 640, 3), dtype=np.uint8)
        frame = cv2.add(frame, noise)
        
        cv2.putText(frame, "SIGNAL LOST - MOCK STREAM", (120, 240), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        t = time.time()
        center = (int(320 + 150 * np.cos(t)), int(240 + 100 * np.sin(t)))
        cv2.circle(frame, center, 15, (39, 255, 20), -1)
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
