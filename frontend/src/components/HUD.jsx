import React from 'react'
import useTelemetryStore from '../store/useTelemetryStore'

export default function HUD() {
  const altitude = useTelemetryStore((state) => state.telemetry.drone_state.gps.altitude_relative_m)
  const battery = useTelemetryStore((state) => state.telemetry.drone_state.battery_percentage)
  const lat = useTelemetryStore((state) => state.telemetry.drone_state.gps.latitude)
  const lon = useTelemetryStore((state) => state.telemetry.drone_state.gps.longitude)
  const isConnected = useTelemetryStore((state) => state.telemetry.is_connected)
  const isArmed = useTelemetryStore((state) => state.telemetry.is_active)

  return (
    <div className="p-8 flex flex-col justify-between h-full">
      {/* Top HUD Stats */}
      <div className="flex justify-between items-start">
        {/* Empty space for Left Monitoring Panel */}
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
          </div>
        </div>
        
        <div className="bg-black/40 border-r-4 border-agri-gold p-4 backdrop-blur-sm text-right">
          <h2 className="text-agri-gold text-xs font-bold uppercase tracking-widest mb-1">Navigation</h2>
          <div className="text-sm font-mono text-white/90">
            {lat.toFixed(6)}<br />
            {lon.toFixed(6)}
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
