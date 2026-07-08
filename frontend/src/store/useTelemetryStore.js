import { create } from 'zustand'

const DEFAULT_TELEMETRY = {
  timestamp: Date.now(),
  is_connected: false,
  is_active: false,
  drone_state: {
    gps: { latitude: 41.7315, longitude: -93.8587, altitude_relative_m: 0 },
    orientation_deg: { pitch: 0, roll: 0, yaw_heading: 0 },
    battery_percentage: 100
  },
  navigation_target: {
    next_waypoint_gps: { latitude: 41.7315, longitude: -93.8587 },
    distance_to_wp_m: 0,
    mission_waypoints: [],
    coverage_efficiency_score: 1.0
  },
  ai_analysis: {
    // Detection counts
    weed_count: 0,
    pest_stressed_count: 0,
    drought_stressed_count: 0,
    healthy_zone_count: 0,
    // Vegetation health indices
    coverage_pct: 0.0,
    stress_pct: 0.0,
    vari_mean: 0.0,
    exg_mean: 0.0,
    ngrdi_mean: 0.0,
    // Spray decisions
    spray_recommended: false,
    spray_zone_count: 0,
    // Safety
    collision_warning: false,
    // Weather (real or model)
    wind_speed_mps: 0.0,
    wind_dir_deg: 0.0,
    temperature_c: 20.0,
    humidity_pct: 50.0,
    is_storming: false,
    is_safe_to_fly: true,
    weather_source: 'model',
    // Raw detections list
    detections: [],
  }
}

const useTelemetryStore = create((set) => ({
  // Phase 3: Multi-Drone Fleet
  activeDroneId: 'UAV_01',
  fleet: {
    'UAV_01': DEFAULT_TELEMETRY,
    'UAV_02': { ...DEFAULT_TELEMETRY, drone_state: { ...DEFAULT_TELEMETRY.drone_state, gps: { ...DEFAULT_TELEMETRY.drone_state.gps, longitude: -93.8590 } } },
    'UAV_03': { ...DEFAULT_TELEMETRY, drone_state: { ...DEFAULT_TELEMETRY.drone_state, gps: { ...DEFAULT_TELEMETRY.drone_state.gps, longitude: -93.8580 } } }
  },
  
  // Backwards compatibility for single-drone components
  telemetry: DEFAULT_TELEMETRY,

  // Phase 2: Live Analytics History
  history: [], // [{ t: Date.now(), battery: 100, alt: 0, wind: 0 }]
  
  setTelemetry: (data) => set((state) => {
    let newFleet = { ...state.fleet };
    let currentTelemetry = state.telemetry;
    
    if (data.type === 'FLEET_UPDATE') {
      newFleet = data.drones;
      currentTelemetry = newFleet[state.activeDroneId] || state.telemetry;
    } else {
      // Legacy single-drone update
      const id = data.id || state.activeDroneId;
      newFleet[id] = data;
      if (id === state.activeDroneId) {
        currentTelemetry = data;
      }
    }

    // Maintain history for active drone
    const newEntry = {
      t: Date.now(),
      battery: currentTelemetry.drone_state.battery_percentage,
      alt: currentTelemetry.drone_state.gps.altitude_relative_m,
      wind: currentTelemetry.ai_analysis.wind_speed_mps
    };
    const newHistory = [...state.history, newEntry].slice(-150); // PERF: capped at 150
    
    return { 
      fleet: newFleet, 
      telemetry: currentTelemetry,
      history: newHistory
    };
  }),

  setActiveDroneId: (id) => set((state) => ({ 
    activeDroneId: id,
    telemetry: state.fleet[id] || DEFAULT_TELEMETRY,
    history: [] // Clear history on swap to avoid confusing graphs
  })),

  settings: {
    forwardSpeed: 100,
    climbSpeed: 200,
  },
  setSettings: (newSettings) => set((state) => ({ 
    settings: { ...state.settings, ...newSettings } 
  })),

  showMap: false,
  setShowMap: (showMap) => set({ showMap }),
  
  showAnalytics: false,
  setShowAnalytics: (showAnalytics) => set({ showAnalytics }),

  cameraMode: 'normal',
  setCameraMode: (cameraMode) => set({ cameraMode }),
  
  activeCommands: [],
  setActiveCommands: (activeCommands) => set({ activeCommands }),

  mainViewId: '3d', // '3d', 'front', 'back', 'nadir'
  setMainViewId: (mainViewId) => set({ mainViewId })
}))

export default useTelemetryStore
