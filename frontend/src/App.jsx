import React, { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { View } from '@react-three/drei'
import { Target, ShieldAlert, Wind, Wifi, Battery, Satellite, Clock } from 'lucide-react'
import HUD, { StatsConsole } from './components/HUD'
import VideoContainer from './components/VideoContainer'
import Sidebar from './components/Sidebar'
import Scene from './canvas/Scene'
import DroneViews from './components/DroneViews'
import MapView from './components/MapView'

import useWebSocket from './useWebSocket'
import useKeyboardControls from './useKeyboardControls'
import useTelemetryStore from './store/useTelemetryStore'

function TopStatusBar() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const isConnected = telemetry.is_connected
  const battery = telemetry.drone_state.battery_percentage
  const lat = telemetry.drone_state.gps.latitude
  const lon = telemetry.drone_state.gps.longitude

  return (
    <header className="h-10 bg-[#0B0E14] border-b border-agri-neon/20 flex items-center justify-between px-6 z-50 shadow-lg relative overflow-hidden shrink-0">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(0,229,255,0.02)_40px,rgba(0,229,255,0.02)_41px)] pointer-events-none" />
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-agri-neon rounded-full shadow-[0_0_8px_#39ff14]" />
          <span className="text-xs font-black text-white tracking-[0.3em] uppercase italic font-mono">AgriHUD_UAV_Station</span>
        </div>
        <div className="h-4 w-[1px] bg-white/10" />
        <div className="flex items-center gap-3 text-[10px] font-mono text-agri-neon/80 uppercase tracking-widest font-bold">
           <Clock size={12} /> {new Date().toLocaleTimeString([], { hour12: false })}
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2 group">
          <Satellite size={14} className={isConnected ? "text-agri-neon" : "text-red-500"} />
          <span className="text-[10px] font-mono font-black text-white">SATS: 12 [FIX-3D]</span>
        </div>
        <div className="flex items-center gap-2 group">
          <Wifi size={14} className={isConnected ? "text-agri-neon" : "text-red-500"} />
          <span className="text-[10px] font-mono font-black text-white">RSSI: -42dBm</span>
        </div>
        <div className="flex items-center gap-3">
          <Battery size={14} className={battery > 20 ? "text-agri-neon" : "text-red-500 animate-pulse"} />
          <div className="w-16 h-2 bg-white/5 border border-white/10 p-[1px] rounded-sm">
            <div className={`h-full ${battery > 20 ? 'bg-agri-neon' : 'bg-red-500'}`} style={{ width: `${battery}%` }} />
          </div>
          <span className="text-[10px] font-mono font-black text-white">{battery}%</span>
        </div>
      </div>

      <div className="flex items-center gap-4 pl-4 border-l border-white/10">
         <span className="text-[9px] font-mono text-gray-500 uppercase">POS_REF:</span>
         <span className="text-[10px] font-mono font-bold text-agri-neon/80">{lat.toFixed(6)} N, {lon.toFixed(6)} W</span>
      </div>
    </header>
  )
}

function AIMonitor() {
  const aiAnalysis = useTelemetryStore((state) => state.telemetry.ai_analysis) || {
    weed_count: 0,
    pest_stressed_count: 0,
    collision_warning: false,
    wind_speed_mps: 0.0,
    wind_dir_deg: 0.0
  }

  const systems = [
    { name: 'V-LIDAR', status: 'OK', color: 'text-green-500' },
    { name: 'OPTICAL_SENSE', status: 'OK', color: 'text-green-500' },
    { name: 'B-POINT_NAV', status: aiAnalysis.collision_warning ? 'ALERT' : 'OK', color: aiAnalysis.collision_warning ? 'text-red-500 animate-pulse' : 'text-green-500' },
    { name: 'ATMOS_COMP', status: 'AUTO', color: 'text-agri-neon' }
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-agri-neon/20 pb-2">
         <h3 className="text-[10px] text-agri-neon uppercase tracking-widest font-black flex items-center gap-2">
            <Target size={14} /> EICAS_DIAGNOSTIC
         </h3>
         <span className="text-[8px] text-cyan-900 bg-agri-neon/10 px-1 rounded uppercase font-bold">AI_Core_Active</span>
      </div>
      
      <div className="space-y-1">
        {systems.map(s => (
          <div key={s.name} className="flex justify-between items-center py-1.5 px-3 bg-black border border-white/5 shadow-inner">
            <span className="text-[9px] text-gray-400 font-bold uppercase font-mono tracking-tighter">{s.name}</span>
            <span className={`text-[9px] font-black font-mono ${s.color}`}>{s.status}</span>
          </div>
        ))}
      </div>

      <div className="bg-black border border-agri-neon/30 p-3 rounded-sm shadow-[0_0_10px_rgba(0,229,255,0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-1 opacity-20"><Wind size={32} className="text-agri-neon" /></div>
        <span className="text-[9px] text-agri-neon uppercase font-bold block mb-2 font-mono">Atmospheric_Data</span>
        <div className="flex justify-between items-end relative z-10">
          <div className="flex flex-col">
             <span className="text-2xl font-black text-white font-mono leading-none tracking-tighter">{aiAnalysis.wind_speed_mps.toFixed(1)}</span>
             <span className="text-[8px] text-agri-neon/60 font-black uppercase">METERS / SEC</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-sm font-black text-white font-mono leading-none">{aiAnalysis.wind_dir_deg.toFixed(0)}°</span>
             <span className="text-[8px] text-agri-neon/60 font-black uppercase">BEARING_REF</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-black border border-white/10 p-2 flex flex-col items-center">
           <span className="text-[8px] text-gray-500 uppercase font-black mb-1">Target_Link</span>
           <span className="text-lg font-black text-agri-neon font-mono leading-none">{aiAnalysis.weed_count}</span>
        </div>
        <div className="bg-black border border-white/10 p-2 flex flex-col items-center">
           <span className="text-[8px] text-gray-500 uppercase font-black mb-1">Biomass_Lvl</span>
           <span className={`text-lg font-black font-mono leading-none ${aiAnalysis.pest_stressed_count > 0 ? 'text-amber-500' : 'text-green-500'}`}>98%</span>
        </div>
      </div>
    </div>
  )
}

function App() {
  const container = useRef()
  useWebSocket()
  useKeyboardControls()
  const showMap = useTelemetryStore((state) => state.showMap)
  const setShowMap = useTelemetryStore((state) => state.setShowMap)
  
  return (
    <div ref={container} className="fixed inset-0 bg-[#07090D] text-white overflow-hidden font-sans selection:bg-agri-neon selection:text-white flex flex-col uppercase">
      
      <TopStatusBar />

      <div className="flex-1 relative overflow-hidden flex">
        
        {/* LAYER 0: VIDEO */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <VideoContainer />
        </div>

        {/* LAYER 1: FIXED BACKGROUND PANELS (Behind Canvas) */}
        <div className="fixed inset-y-10 left-0 w-80 bg-[#0B0E14] border-r border-agri-neon/20 shadow-2xl pointer-events-none" style={{ zIndex: 5 }} />
        <div className="fixed inset-y-10 right-0 w-96 bg-[#0B0E14] border-l border-agri-neon/20 shadow-2xl pointer-events-none" style={{ zIndex: 5 }} />
        <div className="fixed bottom-0 left-80 right-96 h-72 bg-[#0B0E14] border-t border-agri-neon/20 shadow-2xl pointer-events-none" style={{ zIndex: 5 }} />

        {/* LAYER 2: 3D CANVAS */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          <Canvas 
            eventSource={container} 
            shadows 
            dpr={[1, 2]}
            gl={{ 
              antialias: true, 
              logarithmicDepthBuffer: true,
              powerPreference: "high-performance",
              alpha: true
            }}
          >
            <View.Port />
          </Canvas>
        </div>

        {/* LAYER 3: UI CONTENT */}
        <div className="relative z-20 flex h-full w-full pointer-events-none">
           
           {/* LEFT: MONITORING */}
           <aside className="w-80 h-full flex-none flex flex-col pointer-events-auto relative">
              <div className="p-0 border-b border-agri-neon/10">
                 <DroneViews />
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-5">
                 <AIMonitor />
              </div>
           </aside>

           {/* CENTER: FLIGHT DATA */}
           <main className="flex-1 h-full flex flex-col min-w-[500px] relative pointer-events-none">
              <section className="flex-1 relative overflow-hidden pointer-events-auto">
                 <div className="absolute inset-0 pointer-events-none">
                    <Scene />
                 </div>
                 <div className="absolute inset-0 pointer-events-none">
                    <HUD />
                 </div>
              </section>

              <footer className="h-72 flex-none pointer-events-auto relative overflow-hidden">
                 <div className="w-full h-full">
                    <StatsConsole />
                 </div>
              </footer>
           </main>

           {/* RIGHT: COMMAND */}
           <aside className="w-96 h-full flex-none flex flex-col pointer-events-auto relative">
              <Sidebar />
           </aside>

        </div>

        {/* MODAL OVERLAYS */}
        {showMap && (
          <div className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center bg-black/80 backdrop-blur-lg p-12">
             <MapView onClose={() => setShowMap(false)} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App