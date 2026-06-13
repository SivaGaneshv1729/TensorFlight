import React from 'react'
import { AlertTriangle, ShieldAlert, ShieldCheck, Eye, Target, Wind, Orbit } from 'lucide-react'
import useTelemetryStore from '../store/useTelemetryStore'

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
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-600/90 text-white border border-red-500 px-8 py-3 rounded-lg backdrop-blur-md flex items-center gap-3 animate-bounce shadow-[0_0_20px_rgba(239,68,68,0.5)] z-40 pointer-events-auto">
          <AlertTriangle size={20} className="animate-pulse" />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-[0.15em] uppercase">Collision Imminent</span>
            <span className="text-[10px] font-mono text-red-200">Auto-braking engaged against physical obstacles</span>
          </div>
        </div>
      )}

      {/* RTL Low Battery Alert Banner */}
      {battery <= 20 && isArmed && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 bg-amber-600/90 text-white border border-amber-500 px-8 py-3 rounded-lg backdrop-blur-md flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.5)] z-40 pointer-events-auto">
          <AlertTriangle size={20} className="animate-pulse" />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-[0.15em] uppercase">Low Battery / RTL Threshold</span>
            <span className="text-[10px] font-mono text-amber-200">RTL Envelope crossed. Opposing wind vector compensation active.</span>
          </div>
        </div>
      )}

      {/* Top HUD Stats */}
      <div className="flex justify-between items-start">
        {/* Empty space for Left Monitoring Panel (DroneViews) */}
        <div className="w-64" />

        {/* Center Status Indicators */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-black/40 px-6 py-2 backdrop-blur-sm border-b-2 border-agri-neon rounded-b-xl flex gap-6">
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-agri-neon animate-pulse' : 'bg-red-500'}`} />
               <h2 className="text-agri-neon text-[10px] font-bold uppercase tracking-[0.2em]">
                 LINK: {isConnected ? 'OK' : 'LOST'}
               </h2>
            </div>
            <div className="w-[1px] h-4 bg-white/10" />
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isArmed ? 'bg-orange-500 animate-pulse' : 'bg-gray-500'}`} />
               <h2 className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isArmed ? 'text-orange-500' : 'text-gray-500'}`}>
                 MOTORS: {isArmed ? 'ARMED' : 'SAFE'}
               </h2>
            </div>
          </div>
          
          <div className="flex gap-4 mt-2">
            <div className="bg-black/40 px-4 py-1 rounded-full border border-white/5 backdrop-blur-sm flex gap-3 text-[10px] font-mono">
              <span className="text-gray-400 uppercase">Alt:</span>
              <span className="text-white">{altitude.toFixed(1)}m</span>
            </div>
            <div className="bg-black/40 px-4 py-1 rounded-full border border-white/5 backdrop-blur-sm flex gap-3 text-[10px] font-mono">
              <span className="text-gray-400 uppercase">Bat:</span>
              <span className="text-agri-neon">{battery}%</span>
            </div>
            <div className="bg-black/40 px-4 py-1 rounded-full border border-white/5 backdrop-blur-sm flex gap-3 text-[10px] font-mono">
              <span className="text-gray-400 uppercase">GPS:</span>
              <span className="text-agri-gold">{lat.toFixed(6)}, {lon.toFixed(6)}</span>
            </div>
          </div>
        </div>
        
        <div className="w-64" /> {/* Spacer to align status content */}
      </div>

      {/* AI Diagnostics Side Panel (Positioned below Left Drone Views) */}
      <div className="absolute top-[435px] left-8 w-48 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-3 flex flex-col gap-3 pointer-events-auto text-xs select-none">
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 font-bold uppercase text-[10px] text-agri-neon tracking-wider">
          <Orbit className="animate-spin" style={{ animationDuration: '6s' }} size={12} />
          <span>AI Diagnostics</span>
        </div>

        {/* AI Targets/Counts */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center bg-black/20 p-1.5 rounded border border-white/5">
            <span className="text-gray-400 font-mono text-[9px] uppercase">Weeds Found:</span>
            <span className="font-mono text-agri-neon font-bold flex items-center gap-1">
              <Target size={11} className="animate-pulse" />
              {aiAnalysis.weed_count}
            </span>
          </div>
          <div className="flex justify-between items-center bg-black/20 p-1.5 rounded border border-white/5">
            <span className="text-gray-400 font-mono text-[9px] uppercase">Stress/Pests:</span>
            <span className={`font-mono font-bold flex items-center gap-1 ${aiAnalysis.pest_stressed_count > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
              <ShieldAlert size={11} />
              {aiAnalysis.pest_stressed_count}
            </span>
          </div>
        </div>

        {/* Collision Avoidance Status */}
        <div className="flex flex-col gap-1">
          <div className="text-gray-400 font-mono text-[8px] uppercase tracking-wider">Collision Shield</div>
          <div className={`p-1.5 rounded border font-mono text-[9px] font-bold flex items-center justify-between ${aiAnalysis.collision_warning ? 'bg-red-950/40 border-red-500/50 text-red-500 animate-pulse' : 'bg-green-950/20 border-green-500/20 text-agri-neon'}`}>
            <span>SHIELD STATUS</span>
            <span className="flex items-center gap-1">
              {aiAnalysis.collision_warning ? (
                <>
                  <ShieldAlert size={10} />
                  BRAKING
                </>
              ) : (
                <>
                  <ShieldCheck size={10} />
                  SAFE
                </>
              )}
            </span>
          </div>
        </div>

        {/* Wind Vector */}
        <div className="flex flex-col gap-1">
          <div className="text-gray-400 font-mono text-[8px] uppercase tracking-wider">Wind Vector</div>
          <div className="bg-black/20 p-1.5 rounded border border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-white">{aiAnalysis.wind_speed_mps.toFixed(1)} m/s</span>
              <span className="font-mono text-[8px] text-gray-500">{aiAnalysis.wind_dir_deg.toFixed(0)}° Dir</span>
            </div>
            <div className="relative w-7 h-7 rounded-full border border-white/10 flex items-center justify-center">
              <Wind size={10} className="text-blue-400 animate-pulse" />
              <div 
                className="absolute w-0.5 h-3 bg-agri-gold origin-bottom bottom-1/2 transition-transform duration-300"
                style={{ transform: `rotate(${aiAnalysis.wind_dir_deg}deg)` }}
              />
            </div>
          </div>
        </div>

        {/* Safe Flight Radius */}
        <div className="flex flex-col gap-1 bg-black/20 p-1.5 rounded border border-white/5">
          <div className="text-gray-400 font-mono text-[8px] uppercase tracking-wider">Flight Envelope</div>
          <div className="flex justify-between font-mono text-[9px]">
            <span className="text-gray-400">Safe Radius:</span>
            <span className="text-agri-gold font-bold">{aiAnalysis.safe_flight_radius_m.toFixed(0)}m</span>
          </div>
        </div>

        {/* Camera mode toggle */}
        <div className="flex flex-col gap-1.5 mt-0.5 border-t border-white/10 pt-2">
          <div className="text-gray-400 font-mono text-[8px] uppercase tracking-wider flex items-center justify-between">
            <span>Camera Filter</span>
            <Eye size={10} className={cameraMode === 'vari' ? 'text-agri-neon animate-pulse' : 'text-gray-400'} />
          </div>
          <div className="flex gap-1.5 bg-black/45 p-0.5 rounded border border-white/5">
            <button
              onClick={() => setCameraMode('normal')}
              className={`flex-1 text-[8px] font-bold uppercase py-0.5 rounded transition-all text-center ${cameraMode === 'normal' ? 'bg-white text-black' : 'text-white/40 hover:text-white/80'}`}
            >
              Normal
            </button>
            <button
              onClick={() => setCameraMode('vari')}
              className={`flex-1 text-[8px] font-bold uppercase py-0.5 rounded transition-all text-center ${cameraMode === 'vari' ? 'bg-agri-neon text-black shadow-[0_0_5px_#39FF14]' : 'text-agri-neon/40 hover:text-agri-neon/80'}`}
            >
              VARI
            </button>
          </div>
        </div>
      </div>

      {/* Bottom HUD Elements (e.g. Artificial Horizon) */}
      <div className="flex justify-center">
        <div className="w-64 h-2 border-x-2 border-b-2 border-white/20 relative">
          <div 
            className="absolute top-0 h-full bg-agri-neon/50 transition-all duration-100" 
            style={{ width: `${battery}%` }}
          />
        </div>
      </div>
    </div>
  )
}
