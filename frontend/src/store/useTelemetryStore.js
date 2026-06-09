import { create } from 'zustand'

const useTelemetryStore = create((set) => ({
  telemetry: {
    timestamp: Date.now(),
    is_connected: false,
    is_active: false,
    drone_state: {
      gps: { latitude: 0, longitude: 0, altitude_relative_m: 0 },
      orientation_deg: { pitch: 0, roll: 0, yaw_heading: 0 },
      battery_percentage: 100
    },
    navigation_target: {
      next_waypoint_gps: { latitude: 12.9720, longitude: 77.5950 },
      distance_to_wp_m: 50,
      coverage_efficiency_score: 0.95
    }
  },
  setTelemetry: (data) => set({ telemetry: data }),
  settings: {
    forwardSpeed: 100, // Range 0-500 for MAVLink consistency
    climbSpeed: 200,   // Range 0-500
  },
  setSettings: (newSettings) => set((state) => ({ 
    settings: { ...state.settings, ...newSettings } 
  })),
}))

export default useTelemetryStore
