import React from 'react'
import { AlertTriangle, ShieldAlert, ShieldCheck, Eye, Target, Wind, Orbit } from 'lucide-react'
import useTelemetryStore from '../store/useTelemetryStore'

export function StatsConsole() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const altitude = telemetry?.drone_state?.gps?.altitude_relative_m ?? 0
  const battery = telemetry?.drone_state?.battery_percentage ?? 0
  const orientation = telemetry?.drone_state?.orientation_deg ?? { pitch: 0, roll: 0, yaw_heading: 0 }
  const activeCommands = useTelemetryStore((state) => state.activeCommands) || []
  const isArmed = telemetry?.is_active ?? false

  const pitch = orientation.pitch
  const roll = orientation.roll
  const heading = orientation.yaw_heading

  return (
    <div className="flex h-full w-full items-stretch p-0 gap-0 select-none bg-[#0B0E14] font-mono">
      
      {/* 1. AIRSPEED TAPE (Left) */}
      <div className="w-28 flex flex-col items-center bg-[#07090D] border-r border-agri-neon/20">
        <span className="py-2 text-[9px] text-agri-neon font-black uppercase tracking-widest border-b border-agri-neon/10 w-full text-center">Velocity</span>
        <div className="flex-1 w-full relative overflow-hidden">
           <div className="absolute right-2 top-0 bottom-0 w-8 flex flex-col justify-around py-4 opacity-30">
              {[30, 25, 20, 15, 10, 5, 0].map(v => (
                <div key={v} className="flex items-center justify-end gap-2">
                  <span className="text-[9px] font-black">{v}</span>
                  <div className="w-2 h-[1px] bg-agri-neon" />
                </div>
              ))}
           </div>
           <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 flex items-center z-10">
              <div className="w-full h-full bg-agri-neon/20 border-y border-agri-neon flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                 <span className="text-2xl font-black text-white italic tracking-tighter">{(Math.abs(pitch) * 0.8).toFixed(1)}</span>
              </div>
           </div>
        </div>
        <div className="p-2 bg-cyan-950/20 w-full text-center border-t border-agri-neon/10">
          <span className="text-[10px] text-agri-neon font-black">M/S_AIR</span>
        </div>
      </div>

      {/* 2. MAIN ATTITUDE INDICATOR (Center) */}
      <div className="flex-1 flex flex-col relative border-r border-agri-neon/20">
        
        {/* Top Compass Tape */}
        <div className="h-10 bg-black/40 border-b border-agri-neon/20 relative overflow-hidden">
           <div 
             className="absolute top-0 h-full flex items-center gap-12 transition-transform duration-200"
             style={{ transform: `translateX(${-(heading % 360) * 2}px)`, left: '50%' }}
           >
              {[...Array(37)].map((_, i) => (
                <div key={i*10} className="flex flex-col items-center min-w-[20px]">
                   <span className="text-[10px] font-black text-white/80">{(i*10) % 360}</span>
                   <div className="h-2 w-[1px] bg-agri-neon" />
                </div>
              ))}
           </div>
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full border-x border-agri-neon z-10 flex flex-col justify-end pb-1">
              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-agri-neon mx-auto" />
           </div>
        </div>

        {/* AI Display */}
        <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
          <div 
            className="absolute w-[400%] h-[400%] transition-transform duration-100 ease-out flex flex-col"
            style={{
              transform: `translateY(${pitch * 4}px) rotate(${-roll}deg)`,
              transformOrigin: 'center'
            }}
          >
            <div className="flex-1 bg-gradient-to-b from-sky-600/30 to-blue-500/20" />
            <div className="h-[2px] bg-white shadow-[0_0_20px_white]" />
            <div className="flex-1 bg-gradient-to-b from-amber-900/30 to-[#1a110a]" />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-12 pointer-events-none opacity-60">
             {[20, 10, 0, -10, -20].map(p => (
               <div key={p} className="flex items-center gap-24">
                  <div className="flex items-center">
                    <span className="text-[10px] font-black text-white/60 mr-2">{Math.abs(p)}</span>
                    <div className="w-16 h-[1px] bg-white/40" />
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 h-[1px] bg-white/40" />
                    <span className="text-[10px] font-black text-white/60 ml-2">{Math.abs(p)}</span>
                  </div>
               </div>
             ))}
          </div>

          <div className="relative z-10 flex items-center justify-center">
             <div className="w-48 h-1 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)] flex items-center justify-between px-20">
                <div className="w-6 h-6 border-b-4 border-r-4 border-yellow-500 -rotate-45" />
                <div className="w-6 h-6 border-b-4 border-l-4 border-yellow-500 rotate-45" />
             </div>
             <div className="absolute w-4 h-4 bg-yellow-500 rotate-45 border-2 border-black" />
          </div>
        </div>
      </div>

      {/* 3. ALTITUDE TAPE (Right) */}
      <div className="w-28 flex flex-col items-center bg-[#07090D] border-r border-agri-neon/20">
        <span className="py-2 text-[9px] text-agri-neon font-black uppercase tracking-widest border-b border-agri-neon/10 w-full text-center">Altitude</span>
        <div className="flex-1 w-full relative overflow-hidden">
           <div className="absolute left-2 top-0 bottom-0 w-8 flex flex-col justify-around py-4 opacity-30">
              {[100, 80, 60, 40, 20, 0].map(v => (
                <div key={v} className="flex items-center justify-start gap-2">
                  <div className="w-2 h-[1px] bg-agri-neon" />
                  <span className="text-[9px] font-black">{v}</span>
                </div>
              ))}
           </div>
           <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-16 flex items-center z-10">
              <div className="w-full h-full bg-agri-neon/20 border-y border-agri-neon flex flex-col items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                 <span className="text-2xl font-black text-white italic leading-none">{altitude.toFixed(1)}</span>
                 <span className="text-[8px] font-black text-agri-neon mt-1 uppercase">Meters_MSL</span>
              </div>
           </div>
        </div>
      </div>

      {/* 4. SYSTEMS INTEGRATION (Far Right) */}
      <div className="w-64 flex flex-col gap-0">
         <div className="p-4 bg-agri-neon/5 border-b border-agri-neon/20">
            <span className="text-[9px] text-agri-neon uppercase font-black tracking-widest block mb-2">Energy_Management</span>
            <div className="flex justify-between items-end mb-1">
               <span className="text-[14px] font-black text-white italic">{battery}%</span>
               <span className="text-[8px] text-gray-500 font-bold uppercase">Main_Lithium_Pack</span>
            </div>
            <div className="w-full h-2 bg-black border border-white/10 rounded-sm overflow-hidden">
               <div className={`h-full transition-all duration-700 ${battery > 20 ? 'bg-agri-neon' : 'bg-red-600 animate-pulse'}`} style={{ width: `${battery}%` }} />
            </div>
         </div>

         <div className="grid grid-cols-2 flex-1">
            <div className="p-4 border-r border-b border-agri-neon/10 flex flex-col justify-center">
               <span className="text-[8px] text-gray-500 uppercase font-black mb-1">Eng_Status</span>
               <span className={`text-[11px] font-black tracking-tighter ${isArmed ? 'text-amber-500 underline' : 'text-agri-neon/40'}`}>{isArmed ? 'PROP_ENGAGED' : 'SAFE_PASSIVE'}</span>
            </div>
            <div className="p-4 border-b border-agri-neon/10 flex flex-col justify-center bg-black/20">
               <span className="text-[8px] text-gray-500 uppercase font-black mb-1">Nav_System</span>
               <span className={`text-[11px] font-black tracking-tighter text-agri-neon`}>GPS_3D_LOCK</span>
            </div>
            <div className="p-4 border-r border-agri-neon/10 flex flex-col justify-center bg-black/20">
               <span className="text-[8px] text-gray-500 uppercase font-black mb-1">Data_Link</span>
               <span className="text-[11px] font-black tracking-tighter text-agri-neon">ENCRYPTED_OK</span>
            </div>
            <div className="p-4 border-agri-neon/10 flex flex-col justify-center">
               <span className="text-[8px] text-gray-500 uppercase font-black mb-1">Processor</span>
               <span className="text-[11px] font-black tracking-tighter text-agri-neon italic">SYSTEM_READY</span>
            </div>
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
    <div className="p-0 flex flex-col justify-between h-full relative font-mono text-white pointer-events-none">
      
      {/* Center Sight */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-40 h-40 flex items-center justify-center opacity-40">
          <div className="absolute w-20 h-[1px] bg-agri-neon left-0" />
          <div className="absolute w-20 h-[1px] bg-agri-neon right-0" />
          <div className="absolute h-20 w-[1px] bg-agri-neon top-0" />
          <div className="absolute h-20 w-[1px] bg-agri-neon bottom-0" />
          <div className="w-4 h-4 border border-agri-neon rotate-45" />
        </div>
      </div>

      {/* AR Status Blocks */}
      <div className="flex justify-center pt-12">
         <div className="flex border border-agri-neon/40 bg-black/60 backdrop-blur-md p-1">
            <div className={`px-4 py-1.5 border-r border-agri-neon/20 flex items-center gap-3 ${isConnected ? 'text-agri-neon' : 'text-red-500'}`}>
               <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-agri-neon animate-pulse shadow-[0_0_8px_#39ff14]' : 'bg-red-500'}`} />
               <span className="text-[10px] font-black uppercase tracking-widest">Uplink_{isConnected ? 'Ready' : 'Lost'}</span>
            </div>
            <div className={`px-4 py-1.5 border-r border-agri-neon/20 flex items-center gap-3 ${isArmed ? 'text-amber-500' : 'text-gray-500'}`}>
               <div className={`w-2 h-2 rounded-full ${isArmed ? 'bg-amber-500 animate-pulse' : 'bg-gray-600'}`} />
               <span className="text-[10px] font-black uppercase tracking-widest">Engines_{isArmed ? 'Active' : 'Standby'}</span>
            </div>
            <div className="px-4 py-1.5 flex items-center gap-3 text-white/80">
               <span className="text-[9px] font-black text-gray-500">COORD_REF:</span>
               <span className="text-[10px] font-bold tracking-tighter italic">{lat.toFixed(6)} | {lon.toFixed(6)}</span>
            </div>
         </div>
      </div>
    </div>
  )
}
