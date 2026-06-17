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
import AIOverlay from './components/AIOverlay'

import useWebSocket from './useWebSocket'
import useKeyboardControls from './useKeyboardControls'
import useTelemetryStore from './store/useTelemetryStore'

function TopStatusBar() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const activeDroneId = useTelemetryStore((state) => state.activeDroneId)
  const setActiveDroneId = useTelemetryStore((state) => state.setActiveDroneId)
  
  const isConnected = telemetry.is_connected
  const battery = telemetry.drone_state.battery_percentage
  const lat = telemetry.drone_state.gps.latitude
  const lon = telemetry.drone_state.gps.longitude

  return (
    <header className="h-8 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 z-50 relative shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-green-500" />
          <span className="text-[10px] font-black text-white tracking-widest uppercase font-mono">UAV_STATION_CORE</span>
        </div>
        
        <div className="h-3 w-[1px] bg-slate-700" />

        {/* FLEET SELECTOR - MADE MORE PROMINENT */}
        <div className="flex items-center gap-1 bg-black/40 border border-slate-700 p-0.5 rounded-sm">
           {['UAV_01', 'UAV_02', 'UAV_03'].map(id => (
             <button 
               key={id}
               onClick={() => setActiveDroneId(id)}
               className={`px-2 py-0.5 text-[9px] font-bold transition-all ${activeDroneId === id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
             >
               {id}
             </button>
           ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <Satellite size={12} className={isConnected ? "text-green-500" : "text-red-500"} />
          <span className="text-[9px] font-mono font-bold text-slate-400">GNSS_FIX</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-1.5 bg-black border border-slate-700 overflow-hidden">
            <div className={`h-full ${battery > 20 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} style={{ width: `${battery}%` }} />
          </div>
          <span className="text-[9px] font-mono font-bold text-white">{battery}%</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-400 font-bold border-l border-slate-700 pl-4">
           {lat.toFixed(5)}, {lon.toFixed(5)}
        </div>
      </div>
    </header>
  )
}

function AIMonitor() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const aiAnalysis = telemetry.ai_analysis || {
    weed_count: 0,
    pest_stressed_count: 0,
    collision_warning: false,
    wind_speed_mps: 0.0,
    wind_dir_deg: 0.0,
    is_storming: false
  }

  const systems = [
    { name: 'V-LIDAR', status: 'OK', color: 'text-green-500' },
    { name: 'OPTICAL_SENSE', status: 'OK', color: 'text-green-500' },
    { name: 'B-POINT_NAV', status: aiAnalysis.collision_warning ? 'ALERT' : 'OK', color: aiAnalysis.collision_warning ? 'text-red-500 animate-pulse' : 'text-green-500' },
    { name: 'WTHR_MOD', status: aiAnalysis.is_storming ? 'STORM' : 'CLEAR', color: aiAnalysis.is_storming ? 'text-amber-500 animate-pulse' : 'text-blue-400' }
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between border-b border-slate-700 pb-1">
         <h3 className="text-[9px] text-slate-400 uppercase tracking-widest font-black flex items-center gap-1.5">
            <Target size={12} /> EICAS_DIAG
         </h3>
      </div>
      
      <div className="grid grid-cols-1 gap-0.5">
        {systems.map(s => (
          <div key={s.name} className="flex justify-between items-center py-1 px-2 bg-black/20 border border-white/5">
            <span className="text-[8px] text-gray-500 font-bold uppercase font-mono tracking-tighter">{s.name}</span>
            <span className={`text-[8px] font-black font-mono ${s.color}`}>{s.status}</span>
          </div>
        ))}
      </div>

      <div className="bg-black/40 border border-slate-700 p-2 relative overflow-hidden">
        <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1 font-mono tracking-widest">METEO_DATA</span>
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-baseline gap-1">
             <span className="text-lg font-black text-white font-mono leading-none">{aiAnalysis.wind_speed_mps.toFixed(1)}</span>
             <span className="text-[7px] text-slate-600 font-black uppercase">M/S</span>
          </div>
          <div className="text-[9px] font-black text-slate-400 font-mono">{aiAnalysis.wind_dir_deg.toFixed(0)}°</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-1">
        <div className="bg-black/40 border border-white/5 p-1.5 flex flex-col items-center">
           <span className="text-[7px] text-gray-500 uppercase font-black">AI_TRGT</span>
           <span className="text-sm font-black text-green-500 font-mono">{aiAnalysis.weed_count}</span>
        </div>
        <div className="bg-black/40 border border-white/5 p-1.5 flex flex-col items-center">
           <span className="text-[7px] text-gray-500 uppercase font-black">AI_PEST</span>
           <span className={`text-sm font-black font-mono ${aiAnalysis.pest_stressed_count > 0 ? 'text-red-500' : 'text-slate-500'}`}>{aiAnalysis.pest_stressed_count}</span>
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
    <div ref={container} className="fixed inset-0 bg-slate-950 text-slate-200 overflow-hidden font-sans flex flex-col selection:bg-blue-600">
      
      <TopStatusBar />

      <div className="flex-1 relative overflow-hidden flex p-1 gap-1">
        
        {/* LAYER 0: VIDEO */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <VideoContainer />
        </div>

        {/* LAYER 1: FIXED BACKGROUND PANELS (Behind Canvas) */}
        <div className="fixed top-9 bottom-1 left-1 w-64 bg-slate-900 border border-slate-700 pointer-events-none" style={{ zIndex: 5 }} />
        <div className="fixed top-9 bottom-1 right-1 w-72 bg-slate-900 border border-slate-700 pointer-events-none" style={{ zIndex: 5 }} />
        <div className="fixed bottom-1 left-[262px] right-[294px] h-52 bg-slate-900 border border-slate-700 pointer-events-none" style={{ zIndex: 5 }} />

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
        <div className="relative z-20 flex h-full w-full pointer-events-none gap-1">
           
           {/* LEFT PANEL */}
           <aside className="w-64 h-full flex-none flex flex-col pointer-events-auto">
              <div className="p-1.5 bg-slate-800 border-b border-slate-700 font-bold text-[8px] tracking-widest uppercase">
                 Systems_Diag
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-3 bg-transparent">
                 <DroneViews />
                 <AIMonitor />
              </div>
           </aside>

           {/* CENTER PANEL */}
           <main className="flex-1 h-full flex flex-col gap-1 relative pointer-events-none">
              <section className="flex-1 relative overflow-hidden bg-black/10 border border-slate-700 pointer-events-auto">
                 <div className="absolute inset-0 pointer-events-none">
                    <Scene />
                 </div>
                 <div className="absolute inset-0 pointer-events-none">
                    <HUD />
                 </div>
                 <AIOverlay />
              </section>
              
              <footer className="h-52 flex-none pointer-events-auto relative">
                 <StatsConsole />
              </footer>
           </main>

           {/* RIGHT PANEL */}
           <aside className="w-72 h-full flex-none flex flex-col pointer-events-auto">
               <Sidebar />
           </aside>

        </div>

        {/* MODAL OVERLAYS */}
        {showMap && (
          <div className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center bg-slate-950/90 p-12">
             <MapView onClose={() => setShowMap(false)} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App