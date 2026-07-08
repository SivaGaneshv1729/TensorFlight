# Integrating AgriHUD-AI with a Real Drone

To transition AgriHUD-AI from the `mock_telemetry.py` simulator to controlling a real, physical drone, you need to bridge the gap between our Python backend and the drone's flight controller (e.g., Pixhawk running ArduPilot or PX4).

Here is the step-by-step roadmap on what hardware you need and the exact configurations required.

---

## 1. Establish the MAVLink Hardware Connection

The drone communicates using the MAVLink protocol. To get this data into your laptop (the Ground Control Station), you need a telemetry link.

**Hardware Required:**
- A **SiK Telemetry Radio Set** (915 MHz for US/Aus, 433 MHz for Europe).
- Plug the receiver radio into your laptop via USB.
- Plug the transmitter radio into the `TELEM1` or `TELEM2` port of the drone's Pixhawk flight controller.

**Configuration Change (`backend/.env`):**
When the USB radio is plugged in, it acts as a Serial COM port. You must change the PyMAVLink connection string from UDP to Serial, and set SIMULATOR_MODE to False.

```env
SIMULATOR_MODE=False

# Windows:
MAVLINK_URL=COM3

# Linux/Mac:
# MAVLINK_URL=/dev/ttyUSB0
```
> [!IMPORTANT]
> PyMAVLink uses `57600` baud by default for Serial. Telemetry radios almost always use `57600`. Ensure this matches your ArduPilot `SERIALx_BAUD` parameter.

---

## 2. Connect the Real Video Stream

Currently, the AI engine uses a digital simulator feed when `SIMULATOR_MODE=True`. For a real drone, the video needs to be streamed wirelessly from the drone to the GCS.

**Hardware Required:**
- A Companion Computer on the drone (e.g., Raspberry Pi 4, Jetson Nano, or Orange Pi).
- A Camera (USB or CSI) connected to the companion computer.
- A wireless network (Long-range Wi-Fi bridge like Ubiquiti, or a 4G/LTE cellular modem).

**Software on the Drone:**
Run a streaming server (like GStreamer or Mediamtx) on the drone's Raspberry Pi to broadcast the camera feed as an RTSP stream.

**Configuration Change (`backend/.env`):**
Point OpenCV to the drone's wireless video stream.

```env
VIDEO_SOURCE=rtsp://<DRONE_IP_ADDRESS>:8554/stream
```

---

## 3. Calibrate the AI / Computer Vision

Real-world lighting (sunlight, shadows, reflections) is drastically different from lab conditions.

**Code Change in `backend/app/ai/vegetation_analysis.py`:**
You will need to fly the drone over a test field, record the footage, and tune the threshold variables:
- `vari_healthy_threshold`
- `exg_vegetation_threshold`
- The Hue extraction masks (e.g., adjusting the 35–85° OpenCV green range based on your specific camera's color balance).

---

## 4. Safety and Failsafes (CRITICAL)

When moving from a simulator to a 5kg flying blender, safety code is paramount.

> [!WARNING]
> Do NOT immediately test the `MANUAL_CONTROL` dual-sticks in the UI on a real drone. Web-based joystick control over Wi-Fi can lag, causing the drone to fly away.

**Required Action:**
1. **Always keep a physical RC Controller (e.g., RadioMaster TX16S) bound to the drone.**
2. Configure ArduPilot's RC Override priorities so that if you move the physical sticks, it instantly overrides AgriHUD's commands.
3. In `mavlink.py`, ensure your backend is continuously sending `HEARTBEAT` messages. ArduPilot relies on this. If the laptop crashes, the drone must detect the missing heartbeat and trigger an **RTL (Return to Launch)** failsafe automatically.

---

## 5. Network Architecture Checklist

For a production setup, your architecture will look like this:

1. **The Drone:**
   - Pixhawk (Flight Controller) -> 915MHz Radio
   - Raspberry Pi (Video/AI processing) -> 4G/LTE or Long-range Wi-Fi
2. **The Ground Station (Your Laptop):**
   - 915MHz Radio USB -> Python Backend (`mavlink.py`)
   - Wi-Fi connection -> Python Backend (`video_pipeline.py` pulling RTSP)
   - React Frontend -> Browser (displaying the unified dashboard)
