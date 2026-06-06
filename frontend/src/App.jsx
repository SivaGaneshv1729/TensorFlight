import React from 'react'
import HUD from './components/HUD'
import VideoContainer from './components/VideoContainer'
import Sidebar from './components/Sidebar'
import Scene from './canvas/Scene'

import useWebSocket from './useWebSocket'

import useTelemetryStore from './store/useTelemetryStore'

function App() {
  useWebSocket()
  
  // Use shallow selectors to prevent App from re-rendering on every telemetry update
  const latitude = useTelemetryStore((state) => state.telemetry.drone_state.gps.latitude)
  const altitude = useTelemetryStore((state) => state.telemetry.drone_state.gps.altitude_relative_m)

  return (
    <div className="relative w-screen h-screen bg-black text-white overflow-hidden font-sans">
      {/* DEBUG READOUT - REMOVE LATER */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-[100] bg-red-600/80 text-[10px] p-1 font-mono">
        LAT: {latitude.toFixed(4)} | ALT: {altitude.toFixed(1)}
      </div>
      {/* 3D Holographic Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Scene />
      </div>

      {/* Background Video Stream */}
      <div className="absolute inset-0 z-0">
        <VideoContainer />
      </div>

      {/* Augmented Reality HUD Elements */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <HUD />
      </div>

      {/* Control Sidebar */}
      <div className="absolute top-0 right-0 h-full z-30">
        <Sidebar />
      </div>
    </div>
  )
}

export default App
