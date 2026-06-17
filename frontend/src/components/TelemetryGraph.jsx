import React from 'react'
import useTelemetryStore from '../store/useTelemetryStore'

export default function TelemetryGraph() {
  const history = useTelemetryStore((state) => state.history)
  const activeDroneId = useTelemetryStore((state) => state.activeDroneId)

  if (history.length < 2) {
    return (
      <div className="flex-1 flex items-center justify-center text-[10px] text-slate-500 italic">
        Gathering Telemetry Data...
      </div>
    )
  }

  const width = 300
  const height = 120
  const padding = 20

  // Normalize points for Battery (0-100) and Alt (0-30m)
  const batteryPoints = history.map((p, i) => {
    const x = (i / (history.length - 1)) * (width - 2 * padding) + padding
    const y = height - ((p.battery / 100) * (height - 2 * padding) + padding)
    return `${x},${y}`
  }).join(' ')

  const altPoints = history.map((p, i) => {
    const x = (i / (history.length - 1)) * (width - 2 * padding) + padding
    const y = height - ((Math.min(p.alt, 30) / 30) * (height - 2 * padding) + padding)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="flex flex-col gap-4 p-4 bg-black/40 border border-slate-700 rounded-sm">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeDroneId} Performance Logs</span>
        <div className="flex gap-4">
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full" /><span className="text-[8px] text-slate-500">BATTERY</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-[8px] text-slate-500">ALTITUDE</span></div>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width-padding} y2={padding} stroke="#334155" strokeDasharray="2,2" />
          <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#334155" strokeDasharray="2,2" />
          <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#334155" strokeDasharray="2,2" />

          {/* Battery Line */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinejoin="round"
            points={batteryPoints}
          />
          
          {/* Altitude Line */}
          <polyline
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinejoin="round"
            points={altPoints}
          />
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2">
         <div className="bg-slate-900 p-2 border border-slate-700">
            <span className="block text-[7px] text-slate-500 font-bold uppercase">Curr_Bat</span>
            <span className="text-xs font-mono font-black text-blue-400">{history[history.length-1].battery.toFixed(0)}%</span>
         </div>
         <div className="bg-slate-900 p-2 border border-slate-700">
            <span className="block text-[7px] text-slate-500 font-bold uppercase">Curr_Alt</span>
            <span className="text-xs font-mono font-black text-green-400">{history[history.length-1].alt.toFixed(1)}m</span>
         </div>
         <div className="bg-slate-900 p-2 border border-slate-700">
            <span className="block text-[7px] text-slate-500 font-bold uppercase">Storm_Vel</span>
            <span className="text-xs font-mono font-black text-amber-500">{history[history.length-1].wind.toFixed(1)}m/s</span>
         </div>
      </div>
    </div>
  )
}
