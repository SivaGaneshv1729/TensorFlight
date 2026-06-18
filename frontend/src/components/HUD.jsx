import React from 'react'
import { AlertTriangle, ShieldAlert, ShieldCheck, Eye, Target, Wind, Orbit } from 'lucide-react'
import useTelemetryStore from '../store/useTelemetryStore'

export function StatsConsole() {
  const history = useTelemetryStore((state) => state.history)
  const activeCommands = useTelemetryStore((state) => state.activeCommands)
  
  // Create a pseudo-timeline from history
  return (
    <div className="flex h-full w-full flex-col bg-neutral-900 font-sans select-none overflow-hidden border-t border-neutral-800">
      
      {/* Timeline Ruler */}
      <div className="h-6 bg-neutral-800/50 border-b border-neutral-700 flex relative overflow-hidden">
        <div className="w-24 shrink-0 border-r border-neutral-700 flex items-center justify-center bg-neutral-800">
           <Orbit size={12} className="text-neutral-500" />
        </div>
        <div className="flex-1 relative flex items-center">
           {[...Array(20)].map((_, i) => (
             <div key={i} className="absolute flex flex-col items-center" style={{ right: `${i * 100}px` }}>
                <div className="h-2 w-px bg-neutral-600" />
                <span className="text-[7px] font-mono text-neutral-500 mt-0.5">00:0{9-i}:00</span>
             </div>
           ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers */}
        <div className="w-24 shrink-0 bg-neutral-800/80 border-r border-neutral-700 flex flex-col text-[8px] font-black uppercase tracking-widest text-neutral-500 divide-y divide-neutral-700">
           <div className="h-10 flex items-center px-2 gap-2"><Eye size={10} /> V1: CMD</div>
           <div className="h-12 flex items-center px-2 gap-2"><Wind size={10} /> A1: ALT</div>
           <div className="h-12 flex items-center px-2 gap-2"><Orbit size={10} /> A2: BATT</div>
        </div>

        {/* Track Contents */}
        <div className="flex-1 relative bg-neutral-900 overflow-hidden divide-y divide-neutral-800/50">
           
           {/* V1: Command Blocks */}
           <div className="h-10 relative flex items-center px-4 overflow-hidden">
              {activeCommands.length > 0 && (
                <div className="absolute right-4 h-6 bg-emerald-600/30 border border-emerald-500/50 px-2 flex items-center gap-2 rounded-sm">
                   <Target size={10} className="text-emerald-400" />
                   <span className="text-[7px] font-black text-emerald-100 uppercase tracking-widest">{activeCommands.join(' + ')}</span>
                </div>
              )}
           </div>

           {/* A1: Altitude Waveform (Simplified SVG path) */}
           <div className="h-12 relative overflow-hidden bg-neutral-950/30">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                {history.length > 1 && (
                  <>
                    <path 
                      d={`M ${history.map((h, i) => `${(100 - (history.length - i)) * 10},${50 - h.alt}`).join(' L ')}`} 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="1.5"
                      className="transition-all duration-300"
                    />
                    <path 
                      d={`M ${history.map((h, i) => `${(100 - (history.length - i)) * 10},${50 - h.alt}`).join(' L ')} L 1000,50 L 0,50 Z`} 
                      fill="url(#altGradient)" 
                      className="opacity-20"
                    />
                  </>
                )}
                <defs>
                  <linearGradient id="altGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
           </div>

           {/* A2: Battery / Speed Waveform */}
           <div className="h-12 relative overflow-hidden bg-neutral-950/30">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                {history.length > 1 && (
                  <path 
                    d={`M ${history.map((h, i) => `${(100 - (history.length - i)) * 10},${50 - h.battery * 0.4}`).join(' L ')}`} 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="1"
                  />
                )}
              </svg>
           </div>

           {/* Playhead */}
           <div className="absolute top-0 bottom-0 right-4 w-px bg-rose-500 z-50 shadow-[0_0_8px_#f43f5e]">
              <div className="absolute top-0 -translate-x-1/2 w-3 h-3 bg-rose-500 rotate-45 border border-white/20" />
           </div>
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="h-6 bg-neutral-800 border-t border-neutral-700 flex items-center px-4 gap-6">
         <div className="flex gap-2">
            <button className="text-neutral-500 hover:text-white transition-colors"><ShieldCheck size={10} /></button>
            <button className="text-neutral-500 hover:text-white transition-colors"><AlertTriangle size={10} /></button>
         </div>
         <div className="h-3 w-px bg-neutral-700" />
         <div className="flex items-center gap-2">
            <span className="text-[7px] font-bold text-neutral-500 uppercase">Datalink:</span>
            <span className="text-[7px] font-mono text-emerald-500">ENCRYPTED / MJPEG VISUAL [LOCKED]</span>
         </div>
      </div>
    </div>
  )
}

export default function HUD() {
  const isConnected = useTelemetryStore((state) => state.telemetry.is_connected)
  const isArmed = useTelemetryStore((state) => state.telemetry.is_active)
  const lat = useTelemetryStore((state) => state.telemetry.drone_state.gps.latitude) || 0
  const lon = useTelemetryStore((state) => state.telemetry.drone_state.gps.longitude) || 0
  
  return (
    <div className="p-0 flex flex-col justify-between h-full relative font-sans tracking-wide text-white pointer-events-none">
      
      {/* Center Sight - Structured industrial crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-64 h-64 flex items-center justify-center opacity-50">
          {/* Tick marks on axes */}
          <div className="absolute w-full h-[1px] bg-emerald-400/30" />
          <div className="absolute h-full w-[1px] bg-emerald-400/30" />
          
          <div className="absolute w-12 h-[2px] bg-emerald-400 left-[20%]" />
          <div className="absolute w-12 h-[2px] bg-emerald-400 right-[20%]" />
          <div className="absolute h-12 w-[2px] bg-emerald-400 top-[20%]" />
          <div className="absolute h-12 w-[2px] bg-emerald-400 bottom-[20%]" />
          
          <div className="w-16 h-16 border border-emerald-400/50" />
          <div className="w-4 h-4 border-2 border-emerald-400 bg-emerald-900/50" />
        </div>
      </div>

      {/* AR Status Blocks - Reverted to integrated top-down look instead of floating badge */}
      {/* Handled by App.jsx TopHeader, so we can keep HUD clean. */}
    </div>
  )
}
