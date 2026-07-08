import cv2
import numpy as np
import os

def generate_video():
    img_path = "../frontend/public/field_texture.png"
    out_dir = "assets"
    out_path = os.path.join(out_dir, "drone_flight.mp4")
    
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)

    print(f"Loading base field texture from {img_path}...")
    base_img = cv2.imread(img_path)
    if base_img is None:
        print(f"Error: Could not load {img_path}")
        return

    # Add some anomalies (weeds, pest stress) for the AI to detect!
    # BGR format. 
    # Weed (bright yellow-green):
    cv2.circle(base_img, (300, 400), 25, (50, 200, 150), -1)
    cv2.circle(base_img, (320, 390), 15, (40, 190, 140), -1)
    
    # Drought/Pest (brownish/yellow):
    cv2.circle(base_img, (700, 600), 35, (50, 100, 150), -1)
    cv2.circle(base_img, (750, 620), 20, (60, 110, 160), -1)

    print(f"Base image loaded. Shape: {base_img.shape}")
    
    # Video setup
    fps = 24
    num_frames = fps * 15 # 15 seconds
    w, h = 640, 480
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(out_path, fourcc, fps, (w, h))

    print(f"Generating {num_frames} frames for {out_path}...")
    
    # Simulate a drone flying diagonally over the field
    max_x = base_img.shape[1] - w
    max_y = base_img.shape[0] - h
    
    for i in range(num_frames):
        # Progress 0.0 to 1.0, then back to 0.0 (ping-pong)
        progress = (np.sin(i / num_frames * np.pi * 2) + 1) / 2
        
        x = int(progress * max_x)
        y = int(progress * max_y)
        
        # Crop to simulate drone FOV
        frame = base_img[y:y+h, x:x+w]
        
        out.write(frame)

    out.release()
    print(f"✅ Video successfully generated at {out_path}")

if __name__ == "__main__":
    generate_video()
