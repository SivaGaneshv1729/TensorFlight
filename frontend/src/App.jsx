import React, { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Satellite, Battery, Square, Play } from 'lucide-react'
import HUD, { StatsConsole } from './components/HUD'
import VideoContainer from './components/VideoContainer'
import Sidebar from './components/Sidebar'
import Scene from './canvas/Scene'
import DroneViews from './components/DroneViews'
import MapView from './components/MapView'
import AIOverlay from './components/AIOverlay'

import axios from 'axios'
import useWebSocket from './useWebSocket'
import useKeyboardControls from './useKeyboardControls'
import useTelemetryStore from './store/useTelemetryStore'

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
    { name: 'V-LIDAR', status: 'OK', color: 'text-emerald-400' },
    { name: 'OPTICAL_SENSE', status: 'OK', color: 'text-emerald-400' },
    { name: 'B-POINT_NAV', status: aiAnalysis.collision_warning ? 'ALERT' : 'OK', color: aiAnalysis.collision_warning ? 'text-rose-500 animate-pulse' : 'text-emerald-400' },
    { name: 'WTHR_MOD', status: aiAnalysis.is_storming ? 'STORM' : 'CLEAR', color: aiAnalysis.is_storming ? 'text-amber-400 animate-pulse' : 'text-cyan-400' }
  ]

  return (
    <div className="flex flex-col gap-0 border-t border-emerald-500/30">
      <div className="flex items-center justify-between border-b border-emerald-500/30 p-2 bg-emerald-950/50">
         <h3 className="text-[10px] text-emerald-300/80 uppercase tracking-widest font-black flex items-center gap-1.5">
            EICAS DIAGNOSTICS
         </h3>
      </div>
      
      <div className="grid grid-cols-1 divide-y divide-emerald-500/10">
        {systems.map(s => (
          <div key={s.name} className="flex justify-between items-center py-2 px-3 bg-black/20">
            <span className="text-[9px] text-emerald-100 font-bold uppercase font-mono tracking-wide">{s.name}</span>
            <span className={`text-[9px] font-black font-mono tracking-wide ${s.color}`}>{s.status}</span>
          </div>
        ))}
      </div>

      <div className="bg-black/40 border-y border-emerald-500/30 p-3 relative overflow-hidden">
        <span className="text-[8px] text-emerald-400/60 uppercase font-bold block mb-1 font-mono tracking-widest">METEO DATA</span>
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-baseline gap-1">
             <span className="text-2xl font-black text-white font-mono tracking-wide leading-none">{aiAnalysis.wind_speed_mps.toFixed(1)}</span>
             <span className="text-[8px] text-emerald-400/60 font-black uppercase">M/S</span>
          </div>
          <div className="text-[10px] font-black text-emerald-200/80 font-mono tracking-wide">{aiAnalysis.wind_dir_deg.toFixed(0)}°</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 divide-x divide-emerald-500/30">
        <div className="bg-black/20 p-3 flex flex-col items-center">
           <span className="text-[8px] text-emerald-400/60 uppercase font-black mb-1">AI TRGT</span>
           <span className="text-xl font-black text-emerald-400 font-mono tracking-wide leading-none">{aiAnalysis.weed_count}</span>
        </div>
        <div className="bg-black/20 p-3 flex flex-col items-center">
           <span className="text-[8px] text-emerald-400/60 uppercase font-black mb-1">AI PEST</span>
           <span className={`text-xl font-black font-mono tracking-wide leading-none ${aiAnalysis.pest_stressed_count > 0 ? 'text-rose-500' : 'text-emerald-400/60'}`}>{aiAnalysis.pest_stressed_count}</span>
        </div>
      </div>
    </div>
  )
}

function TopHeader() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const activeDroneId = useTelemetryStore((state) => state.activeDroneId)
  const setActiveDroneId = useTelemetryStore((state) => state.setActiveDroneId)
  
  const isConnected = telemetry.is_connected
  const battery = telemetry.drone_state.battery_percentage
  const lat = telemetry.drone_state.gps.latitude
  const lon = telemetry.drone_state.gps.longitude

  return (
    <header className="h-8 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-2 z-50 shrink-0 select-none">
      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-2 h-full pr-4 border-r border-neutral-800">
          <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
          <span className="text-[10px] font-bold text-neutral-300 tracking-tighter uppercase">AgriHUD Dashboard</span>
        </div>

        <div className="flex gap-px h-full items-center ml-2 bg-neutral-800 p-0.5 rounded-sm">
           {['UAV_01', 'UAV_02', 'UAV_03'].map(id => (
             <button 
               key={id}
               onClick={() => setActiveDroneId(id)}
               className={`px-3 py-0.5 text-[9px] font-bold transition-all ${activeDroneId === id ? 'bg-neutral-600 text-white shadow-inner' : 'bg-transparent text-neutral-500 hover:text-neutral-300'}`}
             >
               {id}
             </button>
           ))}
        </div>
      </div>

      <div className="flex items-center h-full gap-4">
        <div className="flex items-center gap-2 px-2 h-full text-[10px] font-mono text-emerald-500/80">
           {lat.toFixed(6)}, {lon.toFixed(6)}
        </div>
        
        <div className="flex items-center gap-3 px-3 h-full border-l border-neutral-800">
          <Satellite size={12} className={isConnected ? "text-emerald-500" : "text-rose-500"} />
          <div className="flex flex-col leading-none">
            <span className="text-[8px] font-bold text-neutral-500 uppercase">Signal</span>
            <span className="text-[9px] font-black text-neutral-200">{isConnected ? "100%" : "LOST"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 h-full border-l border-neutral-800">
          <Battery size={12} className={battery > 20 ? "text-emerald-500" : "text-rose-500"} />
          <div className="flex flex-col leading-none">
            <span className="text-[8px] font-bold text-neutral-500 uppercase">Battery</span>
            <span className="text-[9px] font-black text-neutral-200">{battery}%</span>
          </div>
        </div>

        <div className="h-full px-4 flex items-center bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-emerald-500 transition-colors">
          Export Logs
        </div>
      </div>
    </header>
  )
}

function TransportControls() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const activeDroneId = useTelemetryStore((state) => state.activeDroneId)
  const isArmed = telemetry.is_active

  const sendCommand = async (action) => {
    try {
      await axios.post('/api/command', { target_id: activeDroneId, action, params: {} })
    } catch (err) {
      console.error('Failed to send command:', err)
    }
  }
  
  return (
    <div className="h-10 bg-neutral-900 border-t border-neutral-800 flex items-center justify-center gap-6 px-4 select-none shrink-0">
       <div className="flex items-center gap-2">
         <button onClick={() => sendCommand('DISARM')} className="text-neutral-500 hover:text-white transition-colors" title="Disarm Drone"><Square size={14} fill="currentColor" /></button>
         <button onClick={() => sendCommand('ARM')} className={`p-1.5 rounded-full ${isArmed ? 'bg-rose-600 text-white animate-pulse' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`} title="Arm Drone">
           <Play size={16} fill="currentColor" />
         </button>
       </div>

       <div className="h-4 w-px bg-neutral-800" />

       <div className="flex gap-4">
         <div className="flex flex-col items-center">
            <span className="text-[7px] text-neutral-500 font-bold uppercase">Mode</span>
            <span className="text-[9px] text-neutral-200 font-black uppercase">Guided</span>
         </div>
         <div className="flex flex-col items-center">
            <span className="text-[7px] text-neutral-500 font-bold uppercase">Latency</span>
            <span className="text-[9px] text-neutral-200 font-black uppercase">12ms</span>
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
    <div ref={container} className="h-screen w-screen bg-neutral-950 text-neutral-200 overflow-hidden font-sans selection:bg-emerald-500/50 flex flex-col">
      
      {/* 1. TOP HEADER */}
      <TopHeader />

      {/* 2. MAIN LAYOUT (Left, Center+Bottom, Right) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL (Camera Sources) */}
        <aside className="w-72 bg-neutral-900 border-r border-neutral-800 flex flex-col z-20 shrink-0 overflow-hidden">
           <div className="h-7 bg-neutral-800/50 border-b border-neutral-800 flex items-center px-2 shrink-0">
             <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Camera Sources</span>
           </div>
           <DroneViews />
           <div className="flex-1 overflow-y-auto no-scrollbar">
             <div className="h-6 bg-neutral-800/30 border-y border-neutral-800 flex items-center px-2 shrink-0">
               <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">Metadata Inspector</span>
             </div>
             <AIMonitor />
           </div>
        </aside>

        {/* CENTER COLUMN (Program Monitor + Timeline) */}
        <div className="flex-1 flex flex-col min-w-0 bg-black z-0">
          <main className="flex-1 relative overflow-hidden flex flex-col">
            <div className="h-7 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-3 shrink-0">
               <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Main Display [LIVE]</span>
               <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider italic">Fit: 100%</span>
            </div>
            <div className="flex-1 relative overflow-hidden bg-neutral-900/50">
              <div className="absolute inset-0 z-0 scale-[0.98] origin-center border border-neutral-800 shadow-2xl">
                <VideoContainer />
              </div>
              <div className="absolute inset-0 z-10 pointer-events-none scale-[0.98] origin-center">
                <Canvas 
                  shadows 
                  dpr={[1, 2]}
                  gl={{ antialias: true, logarithmicDepthBuffer: true, alpha: true }}
                >
                  <Scene />
                </Canvas>
              </div>
              <div className="absolute inset-0 z-20 pointer-events-none scale-[0.98] origin-center">
                <AIOverlay />
                <HUD />
              </div>
              </div>
              <TransportControls />
              </main>

              {/* BOTTOM DASHBOARD (Event Timeline) */}
              <footer className="h-40 bg-neutral-900 border-t border-neutral-800 z-20 shrink-0 overflow-hidden flex flex-col">
              <div className="h-7 bg-neutral-800/50 border-b border-neutral-800 flex items-center justify-between px-3 shrink-0">
               <div className="flex gap-4">
                 <span className="text-[9px] font-bold text-neutral-200 uppercase tracking-wider border-b-2 border-emerald-500 h-7 flex items-center px-1">Log: Events</span>
               </div>
               <div className="flex gap-4 items-center">
                  <div className="w-32 h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-emerald-500" />
                  </div>
                  <span className="text-[9px] font-mono text-neutral-500 tracking-tighter">48.0 GB / 256 GB</span>
               </div>
              </div>
              <div className="flex-1 overflow-hidden">
               <StatsConsole />
              </div>
              </footer>
              </div>

              {/* RIGHT PANEL (Inspector) */}
              <aside className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col z-20 shrink-0 overflow-hidden">
              <div className="h-7 bg-neutral-800/50 border-b border-neutral-800 flex items-center px-2 shrink-0">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Flight Properties</span>
              </div>
              <Sidebar />
              </aside>
              </div>

              {/* MODAL OVERLAYS */}
              {showMap && (
                <div className="fixed inset-0 z-[100] pointer-events-auto flex items-center justify-center bg-black/90 backdrop-blur-sm p-12 transition-all">
                   <MapView onClose={() => setShowMap(false)} />
                </div>
              )}
              </div>
              )
              }

              export default App