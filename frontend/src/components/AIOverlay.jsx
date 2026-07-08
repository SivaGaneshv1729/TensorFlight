import React, { memo, useMemo } from 'react'
import useTelemetryStore from '../store/useTelemetryStore'

// PERF: memo so this only re-renders when telemetry changes (not parent layout changes)
const AIOverlay = memo(function AIOverlay() {
  const isArmed = useTelemetryStore((s) => s.telemetry.is_active)
  const weedCount = useTelemetryStore((s) => s.telemetry.ai_analysis?.weed_count ?? 0)
  const pestCount = useTelemetryStore((s) => s.telemetry.ai_analysis?.pest_stressed_count ?? 0)
  const pitch = useTelemetryStore((s) => s.telemetry.drone_state.orientation_deg.pitch)
  const roll = useTelemetryStore((s) => s.telemetry.drone_state.orientation_deg.roll)

  // PERF: Stable detection positions — only recompute when counts or orientation changes
  const detections = useMemo(() => {
    if (!isArmed) return []
    const items = []
    const total = weedCount + pestCount
    // Use stable time quantized to 500ms buckets so positions only update 2x per second
    const t = Math.floor(Date.now() / 500) * 0.5

    for (let i = 0; i < total; i++) {
      const isPest = i >= weedCount
      const seed = i * 137.5
      const baseX = ((Math.sin(t * 0.2 + seed) + 1) / 2) * 80 + 10
      const baseY = ((Math.cos(t * 0.15 + seed) + 1) / 2) * 60 + 20
      items.push({
        id: i,
        type: isPest ? 'PEST' : 'WEED',
        x: Math.min(Math.max(baseX + roll * 1.5, 5), 95),
        y: Math.min(Math.max(baseY + pitch * 1.5, 5), 90),
        confidence: 0.85 + Math.sin(t + seed) * 0.1
      })
    }
    return items
  }, [isArmed, weedCount, pestCount, pitch, roll])

  if (!isArmed || detections.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <svg className="w-full h-full">
        {detections.map((det) => (
          <g key={det.id} style={{ transform: `translate(${det.x}%, ${det.y}%)` }}>
            {/* Corner marks */}
            <path
              d="M -18 -18 L -9 -18 M -18 -18 L -18 -9 M 18 -18 L 9 -18 M 18 -18 L 18 -9 M -18 18 L -9 18 M -18 18 L -18 9 M 18 18 L 9 18 M 18 18 L 18 9"
              fill="none"
              stroke={det.type === 'PEST' ? '#ef4444' : '#39ff14'}
              strokeWidth="1.5"
            />
            {/* Label */}
            <rect x="-18" y="-30" width="36" height="11" fill={det.type === 'PEST' ? '#ef4444' : '#39ff14'} opacity="0.85" />
            <text x="0" y="-21" textAnchor="middle" className="fill-black font-mono font-black" fontSize="6">
              {det.type} {(det.confidence * 100).toFixed(0)}%
            </text>
            {/* PERF: Removed animated scan-line — SVG SMIL animations are expensive */}
          </g>
        ))}
      </svg>
    </div>
  )
})

export default AIOverlay
