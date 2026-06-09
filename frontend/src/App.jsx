import React from 'react'
import HUD from './components/HUD'
import VideoContainer from './components/VideoContainer'
import Sidebar from './components/Sidebar'
import Scene from './canvas/Scene'
import DroneViews from './components/DroneViews'
import MapView from './components/MapView'

import useWebSocket from './useWebSocket'
import useKeyboardControls from './useKeyboardControls'

import useTelemetryStore from './store/useTelemetryStore'

function App() {
  useWebSocket()
  useKeyboardControls()
  
  return (
    <div className="relative w-screen h-screen bg-black text-white overflow-hidden font-sans">
      {/* 3D Holographic Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Scene />
      </div>

      {/* Background Video Stream */}
      <div className="absolute inset-0 z-0">
        <VideoContainer />
      </div>

      {/* Left Monitoring Panel */}
      <div className="absolute top-8 left-8 z-30 flex flex-col gap-6 pointer-events-none">
        <DroneViews />
        <MapView />
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
