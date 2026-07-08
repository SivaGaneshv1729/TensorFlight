import React, { memo, useMemo } from 'react'
import useTelemetryStore from '../store/useTelemetryStore'

// PERF: memo prevents re-render when parent re-renders (e.g. because of navigation)
const TelemetryGraph = memo(function TelemetryGraph() {
  const history = useTelemetryStore((state) => state.history)
  const activeDroneId = useTelemetryStore((state) => state.activeDroneId)

  // PERF: Limit history slice so SVG path math is bounded
  const slice = useMemo(() => history.slice(-120), [history])

  const { batteryPoints, altPoints, lastBat, lastAlt, lastWind } = useMemo(() => {
    if (slice.length < 2) return {}
    const w = 300, h = 100, pad = 16

    const batteryPoints = slice.map((p, i) => {
      const x = (i / (slice.length - 1)) * (w - 2 * pad) + pad
      const y = h - ((p.battery / 100) * (h - 2 * pad) + pad)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')

    const altPoints = slice.map((p, i) => {
      const x = (i / (slice.length - 1)) * (w - 2 * pad) + pad
      const y = h - ((Math.min(p.alt, 30) / 30) * (h - 2 * pad) + pad)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')

    const last = slice[slice.length - 1]
    return { batteryPoints, altPoints, lastBat: last.battery, lastAlt: last.alt, lastWind: last.wind }
  }, [slice])

  if (slice.length < 2) {
    return (
      <div className="flex-1 flex items-center justify-center text-[10px] text-gray-500 italic">
        Gathering telemetry data…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex justify-between items-center shrink-0">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{activeDroneId} — Performance Log</span>
        <div className="flex gap-3">
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full" /><span className="text-[8px] text-gray-500">Battery</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-agri-secondary rounded-full" /><span className="text-[8px] text-gray-500">Altitude</span></div>
        </div>
      </div>

      <div className="flex-1 relative min-h-0">
        <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
          <line x1="16" y1="16" x2="284" y2="16" stroke="#334155" strokeDasharray="2,3" strokeWidth="0.5" />
          <line x1="16" y1="50" x2="284" y2="50" stroke="#334155" strokeDasharray="2,3" strokeWidth="0.5" />
          <line x1="16" y1="84" x2="284" y2="84" stroke="#334155" strokeDasharray="2,3" strokeWidth="0.5" />
          {batteryPoints && <polyline fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" points={batteryPoints} />}
          {altPoints && <polyline fill="none" stroke="#20c997" strokeWidth="1.5" strokeLinejoin="round" points={altPoints} />}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 shrink-0">
        <div className="bg-black/30 border border-gray-700/40 rounded-md p-2">
          <span className="block text-[7px] text-gray-500 font-bold uppercase tracking-widest">Battery</span>
          <span className="text-xs font-mono font-black text-blue-400">{lastBat?.toFixed(0)}%</span>
        </div>
        <div className="bg-black/30 border border-gray-700/40 rounded-md p-2">
          <span className="block text-[7px] text-gray-500 font-bold uppercase tracking-widest">Altitude</span>
          <span className="text-xs font-mono font-black text-agri-secondary">{lastAlt?.toFixed(1)}m</span>
        </div>
        <div className="bg-black/30 border border-gray-700/40 rounded-md p-2">
          <span className="block text-[7px] text-gray-500 font-bold uppercase tracking-widest">Wind</span>
          <span className="text-xs font-mono font-black text-amber-400">{lastWind?.toFixed(1)}m/s</span>
        </div>
      </div>
    </div>
  )
})

export default TelemetryGraph
