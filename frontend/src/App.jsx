import React, { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { View } from '@react-three/drei'
import HUD, { StatsConsole } from './components/HUD'
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
  const showMap = useTelemetryStore((state) => state.showMap)
  const setShowMap = useTelemetryStore((state) => state.setShowMap)
  
  return (
    <div ref={container} className="relative w-screen h-screen bg-[#050505] text-white overflow-hidden font-sans flex flex-row">
      
      {/* 1. Left Sidebar - Monitoring */}
      {/* Set to z-10 so the 3D Canvas (z-15) renders the DroneViews ON TOP of this background */}
      <div className="w-64 h-full bg-black/60 backdrop-blur-xl border-r border-white/10 z-10 flex flex-col p-4 gap-4 pointer-events-auto shadow-2xl relative">
        <div className="flex flex-col mb-2">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-mono">Sensory Link</span>
          <span className="text-xs font-bold text-agri-neon uppercase tracking-wider">Multi-CAM Sync</span>
        </div>
        <DroneViews />
        <div className="flex-1" />
      </div>

      {/* 2. Main Center Content */}
      <div className="flex-1 h-full relative flex flex-col z-10 min-w-0">
        {/* Main Monitor (Top section) */}
        <div className="flex-1 relative overflow-hidden bg-zinc-900 border-b border-white/5">
          {/* Background Video Stream (z-0) */}
          <div className="absolute inset-0 z-0">
            <VideoContainer />
          </div>

          {/* 3D Holographic Overlay Placeholder (z-10) */}
          {/* The Canvas will render the Scene here at z-15 */}
          <div className="absolute inset-0 z-10 pointer-events-none block w-full h-full">
            <Scene />
          </div>

          {/* Augmented Reality HUD Elements (z-20) */}
          {/* Renders OVER the Canvas (z-15) */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <HUD />
          </div>
        </div>

        {/* 3. Bottom Stats Bar (z-30) */}
        {/* Renders OVER the Canvas */}
        <div className="h-44 bg-zinc-950/95 border-t border-white/10 z-30 pointer-events-auto relative overflow-hidden flex items-center justify-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <StatsConsole />
        </div>
      </div>

      {/* 4. Right Sidebar - Controls (z-30) */}
      {/* Renders OVER the Canvas */}
      <div className="w-96 h-full z-30 pointer-events-auto relative shadow-2xl">
        <Sidebar />
      </div>

      {/* Map Modal/Overlay (z-50) */}
      {showMap && <MapView onClose={() => setShowMap(false)} />}

      {/* Main Global Canvas (z-15) */}
      {/* Fits exactly between the backgrounds (z-0/z-10) and the UI text/overlays (z-20/z-30) */}
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