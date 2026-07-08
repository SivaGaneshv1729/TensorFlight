import React, { memo } from 'react'
import useTelemetryStore from '../store/useTelemetryStore'
import { VIEW_CONFIGS } from './ViewComponents'

function ViewportBox({ config }) {
  const isConnected = useTelemetryStore((s) => s.telemetry.is_connected)
  const setMainViewId = useTelemetryStore((s) => s.setMainViewId)

  return (
    <div 
      onClick={() => setMainViewId(config.id)}
      className="flex-1 bg-black/40 border border-gray-700/50 rounded-md relative overflow-hidden flex flex-col min-h-0 group cursor-pointer hover:border-agri-primary/50 transition-colors"
    >
      <div className="absolute top-1.5 left-1.5 z-40 bg-black/60 border border-gray-600/40 px-2 py-0.5 rounded-sm pointer-events-none transition-transform group-hover:scale-105 group-hover:bg-agri-primary/20 group-hover:border-agri-primary/40">
        <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest group-hover:text-agri-primary transition-colors">{config.title}</span>
      </div>

      <div className="flex-1 min-h-0 relative pointer-events-none">
        <config.Component />
      </div>

      <div className="h-5 bg-[#2a2c31] border-t border-gray-700/50 flex items-center justify-between px-2 shrink-0 pointer-events-none group-hover:bg-[#34373a] transition-colors">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isConnected ? 'bg-agri-secondary group-hover:shadow-[0_0_8px_#39ff14]' : 'bg-red-500'}`} />
          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Live</span>
        </div>
        <span className="text-[8px] font-mono text-gray-600 font-bold">24fps</span>
      </div>
    </div>
  )
}

export default memo(function DroneViews() {
  const mainViewId = useTelemetryStore(s => s.mainViewId)
  
  // Filter out the main view and render the rest in the side panel
  const sideViews = Object.values(VIEW_CONFIGS).filter(config => config.id !== mainViewId)

  return (
    <div className="flex-1 flex flex-col gap-2 pointer-events-auto min-h-0">
      {sideViews.map(config => (
        <ViewportBox key={config.id} config={config} />
      ))}
    </div>
  )
})
