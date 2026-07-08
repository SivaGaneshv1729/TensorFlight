import cv2
import numpy as np
import time
import threading
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

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
        
        self.simulator_mode = os.getenv("SIMULATOR_MODE", "True").lower() == "true"
        self.source = os.getenv("VIDEO_SOURCE", "0") if not self.simulator_mode else None
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
        
        # In simulator mode, use the photorealistic flight video
        if self.simulator_mode:
            source = "assets/drone_flight.mp4"
            print(f"🎬 SIMULATOR MODE: Loading real drone flight video from {source}")
        elif source and str(source).isdigit():
            source = int(source)
        
        if not source:
            self.cap = None
        else:
            self.cap = cv2.VideoCapture(source)
            # Grab initial frame so we don't start black
            if self.cap.isOpened():
                success, frame = self.cap.read()
                if success:
                    if self.simulator_mode:
                        cv2.putText(frame, "REAL ML PIPELINE - SIMULATOR MODE", (10, 20), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
                    self.last_frame = frame
        
        while self.is_running:
            # Check drone status to freeze video when disarmed
            try:
                from app.core.mavlink import mav_bridge
                is_armed = mav_bridge.latest_data.is_active
            except ImportError:
                is_armed = True
                
            if self.cap and self.cap.isOpened():
                if self.simulator_mode and not is_armed:
                    # If in simulator and drone is disarmed, freeze the frame!
                    time.sleep(0.1)
                    continue
                
                success, frame = self.cap.read()
                if success:
                    # In simulator mode, overlay a subtle watermark
                    if self.simulator_mode:
                        cv2.putText(frame, "REAL ML PIPELINE - SIMULATOR MODE", (10, 20), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
                    self.last_frame = frame
                    # Sleep to match video FPS (assume ~24 fps)
                    if self.simulator_mode:
                        time.sleep(1.0 / 24.0)
                else:
                    # If we ran out of frames in the video, loop it!
                    if self.simulator_mode:
                        self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    else:
                        time.sleep(0.1)
            else:
                # Fallback if video is completely broken
                self.last_frame = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(self.last_frame, "NO VIDEO SIGNAL", (200, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                time.sleep(0.1)

    def get_frame(self, mode: str = "normal") -> np.ndarray:
        frame = self.last_frame
        if frame is None:
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
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
