import React, { useMemo } from 'react'
import useTelemetryStore from '../store/useTelemetryStore'

export default function AIOverlay() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const isArmed = telemetry.is_active
  const aiAnalysis = telemetry.ai_analysis || { weed_count: 0, pest_stressed_count: 0 }
  const { pitch, roll, yaw_heading } = telemetry.drone_state.orientation_deg

  // Deterministic "detections" based on count and time
  const detections = useMemo(() => {
    if (!isArmed) return []
    
    const items = []
    const total = aiAnalysis.weed_count + aiAnalysis.pest_stressed_count
    
    // Use the timestamp to drive movement
    const t = Date.now() / 1000
    
    for (let i = 0; i < total; i++) {
      const isPest = i >= aiAnalysis.weed_count
      
      // Seeded random-ish positions that drift
      const seed = i * 137.5
      const baseX = ((Math.sin(t * 0.2 + seed) + 1) / 2) * 80 + 10 // 10-90% range
      const baseY = ((Math.cos(t * 0.15 + seed) + 1) / 2) * 60 + 20 // 20-80% range
      
      // Apply parallax offset based on pitch/roll
      const offsetX = roll * 2
      const offsetY = pitch * 2
      
      items.push({
        id: i,
        type: isPest ? 'PEST' : 'WEED',
        x: baseX + offsetX,
        y: baseY + offsetY,
        confidence: 0.85 + (Math.sin(t + seed) * 0.1)
      })
    }
    return items
  }, [aiAnalysis.weed_count, aiAnalysis.pest_stressed_count, isArmed, pitch, roll])

  if (!isArmed) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <svg className="w-full h-full">
        {detections.map((det) => (
          <g key={det.id} style={{ transform: `translate(${det.x}%, ${det.y}%)` }} className="transition-transform duration-300 ease-linear">
            {/* Bounding Box Corner Marks */}
            <path 
               d="M -20 -20 L -10 -20 M -20 -20 L -20 -10 M 20 -20 L 10 -20 M 20 -20 L 20 -10 M -20 20 L -10 20 M -20 20 L -20 10 M 20 20 L 10 20 M 20 20 L 20 10" 
               fill="none" 
               stroke={det.type === 'PEST' ? '#ef4444' : '#39ff14'} 
               strokeWidth="1.5"
            />
            
            {/* Label Badge */}
            <rect 
              x="-20" y="-32" width="40" height="12" 
              fill={det.type === 'PEST' ? '#ef4444' : '#39ff14'} 
              className="opacity-80"
            />
            <text 
              x="0" y="-23" 
              textAnchor="middle" 
              className="fill-black font-mono font-black text-[7px]"
            >
              {det.type} {(det.confidence * 100).toFixed(0)}%
            </text>
            
            {/* Identification Scan-line */}
            <line 
              x1="-18" y1="-18" x2="18" y2="-18" 
              stroke={det.type === 'PEST' ? '#ef4444' : '#39ff14'} 
              strokeWidth="0.5" 
              className="animate-pulse"
            >
               <animate attributeName="y1" values="-18;18;-18" dur="2s" repeatCount="indefinite" />
               <animate attributeName="y2" values="-18;18;-18" dur="2s" repeatCount="indefinite" />
            </line>
          </g>
        ))}
      </svg>
    </div>
  )
}
