import React from 'react'
import useTelemetryStore from '../store/useTelemetryStore'

export default function HUD() {
  const altitude = useTelemetryStore((state) => state.telemetry.drone_state.gps.altitude_relative_m)
  const battery = useTelemetryStore((state) => state.telemetry.drone_state.battery_percentage)
  const lat = useTelemetryStore((state) => state.telemetry.drone_state.gps.latitude)
  const lon = useTelemetryStore((state) => state.telemetry.drone_state.gps.longitude)
  const isLive = useTelemetryStore((state) => state.telemetry.is_active)

  return (
    <div className="p-8 flex flex-col justify-between h-full">
      {/* Top HUD Stats */}
      <div className="flex justify-between items-start">
        <div className="bg-black/40 border-l-4 border-agri-neon p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
             <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-agri-neon animate-pulse' : 'bg-red-500'}`} />
             <h2 className="text-agri-neon text-xs font-bold uppercase tracking-widest">Telemetry {isLive ? 'LIVE' : 'OFFLINE'}</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-gray-400">ALT:</span>
            <span className="font-mono">{altitude.toFixed(1)}m</span>
            <span className="text-gray-400">BAT:</span>
            <span className="font-mono text-agri-neon">{battery}%</span>
          </div>
        </div>
        
        <div className="bg-black/40 border-r-4 border-agri-gold p-4 backdrop-blur-sm text-right">
          <h2 className="text-agri-gold text-xs font-bold uppercase tracking-widest mb-1">Navigation</h2>
          <div className="text-sm font-mono">
            {lat.toFixed(6)}, {lon.toFixed(6)}
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
