import React, { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { View } from '@react-three/drei'
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
  const container = useRef()
  useWebSocket()
  useKeyboardControls()
  
  return (
    <div ref={container} className="relative w-screen h-screen bg-black text-white overflow-hidden font-sans">
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

      {/* Main Global Canvas for all Views */}
      <Canvas 
        eventSource={container} 
        className="fixed inset-0 pointer-events-none" 
        style={{ zIndex: 15 }}
        shadows 
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          logarithmicDepthBuffer: true,
          powerPreference: "high-performance"
        }}
      >
        <View.Port />
      </Canvas>
    </div>
  )
}

export default App
