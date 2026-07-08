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
        if source and str(source).isdigit():
            source = int(source)
        
        # If in pure digital simulator mode, don't even try to open the webcam
        if self.simulator_mode or not source:
            self.cap = None
        else:
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
        """
        Pure Digital AI Demo Mode (High Fidelity):
        Generates realistic BGR pixel values representing soil, healthy crops, and weeds,
        then applies a 3D perspective warp to simulate a downward-facing drone camera.
        """
        # Create a larger 2D texture (800x800) to warp
        texture = np.zeros((800, 800, 3), dtype=np.uint8)
        texture[:] = (35, 60, 90)  # BGR for rich brown soil
        
        t = time.time()
        # Fast scrolling offset to simulate flight speed
        offset = int((t * 150) % 200)
        
        # 2. Draw Healthy Crop Rows (Lush Green)
        for x in range(-200, 1000, 100):
            row_x = x
            for y in range(0, 800, 20):
                # Organic jitter
                jx = row_x + int(8 * np.sin(y * 0.05 + t))
                jy = (y + offset) % 800
                cv2.circle(texture, (jx, jy), 18, (20, 200, 40), -1)  # Bright Green (BGR)
                
        # 3. Draw Weeds / Pest Stress patches
        # Patch 1: Weed Cluster
        w_x1 = int(300 + 100 * np.sin(t * 0.3))
        w_y1 = int(400 + 150 * np.cos(t * 0.2))
        pts = np.array([
            [w_x1, w_y1-25], [w_x1+30, w_y1], [w_x1+25, w_y1+30],
            [w_x1-25, w_y1+30], [w_x1-30, w_y1]
        ], np.int32)
        cv2.fillPoly(texture, [pts], (20, 180, 160)) # Yellow-green weed
        
        # Patch 2: Drought / Dead Crop
        d_x = int(600)
        d_y = int(200 + 80 * np.cos(t * 0.5))
        cv2.circle(texture, (d_x, d_y), 40, (30, 70, 110), -1) # Brown

        # --- 3D Perspective Warp ---
        # We want to warp this 800x800 texture into a 640x480 frame with perspective.
        # Define source points (the 4 corners of our texture)
        pts1 = np.float32([[0, 0], [800, 0], [0, 800], [800, 800]])
        
        # Define destination points (trapezoid on the 640x480 frame)
        # Top corners are closer together to create vanishing point depth
        pts2 = np.float32([
            [120, 100],   # Top-left
            [520, 100],   # Top-right
            [-200, 480],  # Bottom-left (spread out)
            [840, 480]    # Bottom-right
        ])
        
        # Generate perspective transform matrix
        matrix = cv2.getPerspectiveTransform(pts1, pts2)
        
        # Warp the texture onto a 640x480 canvas
        frame = cv2.warpPerspective(texture, matrix, (640, 480), borderMode=cv2.BORDER_CONSTANT, borderValue=(20, 20, 20))
        
        # Add horizon/sky
        cv2.rectangle(frame, (0, 0), (640, 100), (180, 120, 60), -1) # Sky blue (BGR)

        # Overlay a subtle digital watermark to indicate Simulator mode
        cv2.putText(frame, "PURE DIGITAL DEMO - HIGH FIDELITY SIM", (10, 20), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
        
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
