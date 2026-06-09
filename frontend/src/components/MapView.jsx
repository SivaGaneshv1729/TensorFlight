import React from 'react'
import { Navigation } from 'lucide-react'
import useTelemetryStore from '../store/useTelemetryStore'

export default function MapView() {
  const { latitude, longitude } = useTelemetryStore((state) => state.telemetry.drone_state.gps)
  const heading = useTelemetryStore((state) => state.telemetry.drone_state.orientation_deg.yaw_heading)

  return (
    <div className="w-48 h-48 bg-black/60 border border-white/10 rounded-lg overflow-hidden relative flex flex-col pointer-events-auto">
      <div className="absolute top-2 left-2 z-10 text-[10px] font-bold text-agri-gold uppercase tracking-widest opacity-80">
        Tactical Map
      </div>
      
      {/* Stylized Grid Map Placeholder */}
      <div className="flex-1 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] relative flex items-center justify-center overflow-hidden">
        {/* Dynamic Scan Line */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-agri-gold/5 to-transparent h-1/2 w-full animate-pulse pointer-events-none" />
        
        {/* Drone Marker */}
        <div 
          className="relative transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${heading}deg)` }}
        >
          <Navigation className="text-agri-neon drop-shadow-[0_0_8px_rgba(0,255,204,0.6)]" size={24} fill="currentColor" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-agri-neon/30 rounded-full animate-ping" />
        </div>

        {/* Home Marker (Fixed Center) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white] opacity-50" />
      </div>

      {/* Coordinate Bar */}
      <div className="bg-black/80 p-2 border-t border-white/5 font-mono text-[9px] flex justify-between text-gray-400">
        <span>LAT: {latitude.toFixed(5)}</span>
        <span>LON: {longitude.toFixed(5)}</span>
      </div>
    </div>
  )
}
