import React from 'react'
import TelemetryGraph from './TelemetryGraph'
import { Activity } from 'lucide-react'

export default function SettingsPanel() {
  return (
    <div className="h-full flex flex-col font-sans">
      <div className="mb-2 text-white text-base font-bold border-b border-gray-700 pb-2 flex items-center gap-2">
         <Activity size={16} className="text-agri-primary" /> Black Box Telemetry
      </div>
      
      <div className="flex-1 overflow-hidden pt-2">
         {/* The TelemetryGraph component will automatically size to its container */}
         <TelemetryGraph />
      </div>
    </div>
  )
}
