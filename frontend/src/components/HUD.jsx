import React from 'react'
import { AlertTriangle, ShieldAlert, ShieldCheck, Eye, Target, Wind, Orbit } from 'lucide-react'
import useTelemetryStore from '../store/useTelemetryStore'

export function StatsConsole() {
  const altitude = useTelemetryStore((state) => state.telemetry.drone_state.gps.altitude_relative_m) || 0
  const battery = useTelemetryStore((state) => state.telemetry.drone_state.battery_percentage) || 0
  const orientation = useTelemetryStore((state) => state.telemetry.drone_state.orientation_deg) || { pitch: 0, roll: 0, yaw_heading: 0 }
  const activeCommands = useTelemetryStore((state) => state.activeCommands) || []

  return (
    <div className="flex gap-12 items-center h-full px-12 justify-center">
      {/* Section 1: Telemetry Monitoring */}
      <div className="flex flex-col gap-1 w-56 font-mono text-[10px] text-gray-400">
        <div className="text-agri-gold font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-agri-gold animate-pulse shadow-[0_0_5px_#fbbf24]" /> Flight Log
        </div>
        <div className="flex justify-between border-b border-white/5 pb-1">
          <span>ALTITUDE</span>
          <span className="text-white font-bold">{altitude.toFixed(1)}m</span>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-1">
          <span>AIR SPEED</span>
          <span className="text-white font-bold">
            {(Math.sqrt(Math.pow(orientation.pitch, 2) + Math.pow(orientation.roll, 2)) * 0.8).toFixed(1)} m/s
          </span>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-1">
          <span>CLIMB RATE</span>
          <span className={`font-bold ${activeCommands.includes('ALT_UP') ? 'text-agri-neon' : activeCommands.includes('ALT_DOWN') ? 'text-red-400' : 'text-white'}`}>
            {activeCommands.includes('ALT_UP') ? '+2.4' : activeCommands.includes('ALT_DOWN') ? '-2.4' : '0.0'} m/s
          </span>
        </div>
        <div className="flex justify-between">
          <span>SIGNAL</span>
          <span className="text-agri-neon font-bold">100% / 8ms</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-[1px] h-32 bg-white/10" />

      {/* Section 2: Artificial Horizon & Battery */}
      <div className="flex flex-col items-center w-80">
        {/* Miniature Attitude Indicator */}
        <div className="relative w-64 h-24 border border-white/20 rounded-lg bg-zinc-950/80 overflow-hidden flex items-center justify-center shadow-inner">
          <div 
            className="absolute inset-0 bg-blue-950/35 border-t border-agri-neon/50 transition-transform duration-150"
            style={{
              transform: `translateY(${orientation.pitch * 1.2}px) rotate(${orientation.roll}deg)`,
              transformOrigin: 'center'
            }}
          />
          {/* Static reference lines */}
          <div className="w-12 h-[1px] bg-red-500/80 z-10 absolute -translate-x-12" />
          <div className="w-12 h-[1px] bg-red-500/80 z-10 absolute translate-x-12" />
          <div className="w-2 h-2 border border-red-500 rounded-full z-10 absolute" />
          
          <span className="absolute bottom-2 left-3 text-[8px] font-mono text-gray-500 uppercase tracking-widest">Horizon</span>
          <div className="absolute top-2 right-3 text-[10px] font-bold text-white/40 flex flex-col items-end">
             <span>P: {orientation.pitch.toFixed(1)}°</span>
             <span>R: {orientation.roll.toFixed(1)}°</span>
          </div>
        </div>
        {/* Battery status bar */}
        <div className="w-full mt-4 px-2">
          <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-1.5 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Orbit size={10} /> Core Power Grid</span>
            <span className={battery <= 20 ? 'text-red-500 animate-pulse font-bold' : 'text-agri-neon font-bold'}>{battery}%</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div 
              className={`h-full transition-all duration-500 ${battery <= 20 ? 'bg-red-500' : 'bg-gradient-to-r from-agri-gold to-agri-neon'}`}
              style={{ width: `${battery}%` }}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-[1px] h-32 bg-white/10" />

      {/* Section 3: Keyboard Visualizer */}
      <div className="flex flex-col gap-2 w-56 font-mono text-[10px] text-gray-400">
        <div className="text-agri-neon font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
          <Orbit className="animate-spin" style={{ animationDuration: '8s' }} size={12} /> Input Feedback
        </div>
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {['W','A','S','D'].map((k, i) => {
            const cmd = ['PITCH_FORWARD', 'ROLL_LEFT', 'PITCH_BACK', 'ROLL_RIGHT'][i];
            const active = activeCommands.includes(cmd);
            return (
              <div key={k} className={`aspect-square flex items-center justify-center rounded-lg border text-[10px] font-bold transition-all duration-150 ${active ? 'bg-agri-neon text-black border-agri-neon shadow-[0_0_15px_rgba(57,255,20,0.4)] scale-105' : 'bg-white/5 border-white/10 text-white/20'}`}>
                {k}
              </div>
            )
          })}
        </div>
        <div className="flex gap-2">
          <div className={`flex-1 py-1.5 rounded-lg border text-[8px] font-bold text-center transition-all ${activeCommands.includes('ALT_UP') ? 'bg-agri-neon text-black border-agri-neon shadow-[0_0_10px_rgba(57,255,20,0.3)]' : 'bg-white/5 border-white/10 text-white/20'}`}>SPACE / ▲</div>
          <div className={`flex-1 py-1.5 rounded-lg border text-[8px] font-bold text-center transition-all ${activeCommands.includes('ALT_DOWN') ? 'bg-agri-neon text-black border-agri-neon shadow-[0_0_10px_rgba(57,255,20,0.3)]' : 'bg-white/5 border-white/10 text-white/20'}`}>SHIFT / ▼</div>
        </div>
        <div className="flex gap-2">
          <div className={`flex-1 py-1.5 rounded-lg border text-[8px] font-bold text-center transition-all ${activeCommands.includes('YAW_LEFT') ? 'bg-agri-neon text-black border-agri-neon' : 'bg-white/5 border-white/10 text-white/20'}`}>Q / ◄</div>
          <div className={`flex-1 py-1.5 rounded-lg border text-[8px] font-bold text-center transition-all ${activeCommands.includes('YAW_RIGHT') ? 'bg-agri-neon text-black border-agri-neon' : 'bg-white/5 border-white/10 text-white/20'}`}>E / ►</div>
        </div>
      </div>
    </div>
  )
}

export default function HUD() {
  const altitude = useTelemetryStore((state) => state.telemetry.drone_state.gps.altitude_relative_m) || 0
  const battery = useTelemetryStore((state) => state.telemetry.drone_state.battery_percentage) || 0
  const lat = useTelemetryStore((state) => state.telemetry.drone_state.gps.latitude) || 0
  const lon = useTelemetryStore((state) => state.telemetry.drone_state.gps.longitude) || 0
  const isConnected = useTelemetryStore((state) => state.telemetry.is_connected)
  const isArmed = useTelemetryStore((state) => state.telemetry.is_active)
  
  const cameraMode = useTelemetryStore((state) => state.cameraMode)
  const setCameraMode = useTelemetryStore((state) => state.setCameraMode)

  const aiAnalysis = useTelemetryStore((state) => state.telemetry.ai_analysis) || {
    weed_count: 0,
    pest_stressed_count: 0,
    collision_warning: false,
    safe_flight_radius_m: 300.0,
    wind_speed_mps: 0.0,
    wind_dir_deg: 0.0
  }

  return (
    <div className="p-8 flex flex-col justify-between h-full relative">
      {/* Collision Warning Banner */}
      {aiAnalysis.collision_warning && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-red-600/90 text-white border border-red-500 px-8 py-3 rounded-lg backdrop-blur-md flex items-center gap-3 animate-bounce shadow-[0_0_20px_rgba(239,68,68,0.5)] z-40 pointer-events-auto">
          <AlertTriangle size={20} className="animate-pulse" />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-[0.15em] uppercase">Collision Imminent</span>
            <span className="text-[10px] font-mono text-red-200">Auto-braking engaged against physical obstacles</span>
          </div>
        </div>
      )}

      {/* RTL Low Battery Alert Banner */}
      {battery <= 20 && isArmed && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-amber-600/90 text-white border border-amber-500 px-8 py-3 rounded-lg backdrop-blur-md flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.5)] z-40 pointer-events-auto">
          <AlertTriangle size={20} className="animate-pulse" />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-[0.15em] uppercase">Low Battery / RTL Threshold</span>
            <span className="text-[10px] font-mono text-amber-200">RTL Envelope crossed. Opposing wind vector compensation active.</span>
          </div>
        </div>
      )}

      {/* Center Reticle / Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-agri-neon/80 rounded-full animate-ping" />
          <div className="absolute w-1 h-1 bg-agri-neon rounded-full" />
          <div className="absolute w-12 h-12 border border-agri-neon/30 rounded-full" />
          <div className="absolute w-16 h-16 border border-dashed border-agri-neon/20 rounded-full" />
        </div>
      </div>

      {/* Top HUD Status - Center only, as sides are sidebars now */}
      <div className="flex justify-center items-start w-full">
        <div className="flex flex-col items-center gap-2">
          <div className="bg-black/40 px-6 py-2 backdrop-blur-sm border-b-2 border-agri-neon rounded-b-xl flex gap-6">
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-agri-neon animate-pulse shadow-[0_0_5px_#39FF14]' : 'bg-red-500 shadow-[0_0_5px_#ef4444]'}`} />
               <h2 className="text-agri-neon text-[10px] font-bold uppercase tracking-[0.2em]">
                 LINK: {isConnected ? 'CONNECTED' : 'OFFLINE'}
               </h2>
            </div>
            <div className="w-[1px] h-4 bg-white/10" />
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isArmed ? 'bg-orange-500 animate-pulse shadow-[0_0_5px_#f97316]' : 'bg-gray-500'}`} />
               <h2 className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isArmed ? 'text-orange-500' : 'text-gray-500'}`}>
                 MOTORS: {isArmed ? 'ARMED' : 'SAFE'}
               </h2>
            </div>
          </div>
          
          <div className="flex gap-4 mt-2">
            <div className="bg-black/40 px-4 py-1 rounded-full border border-white/5 backdrop-blur-sm flex gap-3 text-[10px] font-mono">
              <span className="text-gray-400 uppercase tracking-tighter">GPS COORDS:</span>
              <span className="text-agri-gold font-bold">{lat.toFixed(6)}, {lon.toFixed(6)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Diagnostics Side Panel */}
      <div className="absolute top-4 left-4 w-52 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col gap-4 pointer-events-auto text-xs select-none shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 font-bold uppercase text-[10px] text-agri-neon tracking-widest">
          <Orbit className="animate-spin" style={{ animationDuration: '6s' }} size={14} />
          <span>AI Insight</span>
        </div>

        {/* AI Targets/Counts */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
            <span className="text-gray-400 font-mono text-[9px] uppercase tracking-tighter">Weeds Identified</span>
            <span className="font-mono text-agri-neon font-bold flex items-center gap-1.5">
              <Target size={12} className="animate-pulse" />
              {aiAnalysis.weed_count}
            </span>
          </div>
          <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
            <span className="text-gray-400 font-mono text-[9px] uppercase tracking-tighter">Biomass Stress</span>
            <span className={`font-mono font-bold flex items-center gap-1.5 ${aiAnalysis.pest_stressed_count > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
              <ShieldAlert size={12} />
              {aiAnalysis.pest_stressed_count}
            </span>
          </div>
        </div>

        {/* Collision Avoidance Status */}
        <div className="flex flex-col gap-1.5">
          <div className="text-gray-500 font-mono text-[8px] uppercase tracking-[0.2em] px-1">Collision Shield</div>
          <div className={`p-2 rounded-lg border font-mono text-[10px] font-bold flex items-center justify-between transition-colors ${aiAnalysis.collision_warning ? 'bg-red-950/40 border-red-500/50 text-red-500 animate-pulse' : 'bg-green-950/20 border-green-500/20 text-agri-neon'}`}>
            <span className="text-[8px] uppercase">Active Sensor</span>
            <span className="flex items-center gap-1.5">
              {aiAnalysis.collision_warning ? 'BRAKING' : 'SAFE'}
            </span>
          </div>
        </div>

        {/* Wind Vector */}
        <div className="flex flex-col gap-1.5">
          <div className="text-gray-500 font-mono text-[8px] uppercase tracking-[0.2em] px-1">Atmospheric</div>
          <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-mono text-[11px] text-white font-bold">{aiAnalysis.wind_speed_mps.toFixed(1)} <span className="text-[8px] text-gray-500">m/s</span></span>
              <span className="font-mono text-[8px] text-gray-500">{aiAnalysis.wind_dir_deg.toFixed(0)}° Bearing</span>
            </div>
            <div className="relative w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-black/40">
              <Wind size={12} className="text-blue-400 animate-pulse" />
              <div 
                className="absolute w-0.5 h-3.5 bg-agri-gold origin-bottom bottom-1/2 transition-transform duration-500 rounded-full shadow-[0_0_5px_#fbbf24]"
                style={{ transform: `rotate(${aiAnalysis.wind_dir_deg}deg)` }}
              />
            </div>
          </div>
        </div>

        {/* Camera mode toggle */}
        <div className="flex flex-col gap-2 mt-2 border-t border-white/10 pt-4">
          <div className="text-gray-500 font-mono text-[8px] uppercase tracking-[0.2em] flex items-center justify-between px-1">
            <span>Spectral Filter</span>
            <Eye size={11} className={cameraMode === 'vari' ? 'text-agri-neon animate-pulse' : 'text-gray-400'} />
          </div>
          <div className="flex gap-2 bg-black/60 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setCameraMode('normal')}
              className={`flex-1 text-[9px] font-bold uppercase py-2 rounded-lg transition-all text-center ${cameraMode === 'normal' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/40 hover:text-white/80'}`}
            >
              RGB
            </button>
            <button
              onClick={() => setCameraMode('vari')}
              className={`flex-1 text-[9px] font-bold uppercase py-2 rounded-lg transition-all text-center ${cameraMode === 'vari' ? 'bg-agri-neon text-black shadow-[0_0_12px_rgba(57,255,20,0.5)] scale-105' : 'text-agri-neon/40 hover:text-agri-neon/80'}`}
            >
              VARI
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
