import React from 'react'
import useTelemetryStore from '../store/useTelemetryStore'
import { Wind, Target, AlertTriangle, Bug, Droplets, Thermometer, Leaf, ShieldCheck, ShieldAlert } from 'lucide-react'

function StatCard({ icon: Icon, label, value, unit, color = 'text-white', alert = false }) {
  return (
    <div className={`bg-black/40 border rounded-md p-1.5 flex flex-col justify-center relative overflow-hidden ${alert ? 'border-red-500/60 bg-red-900/20' : 'border-gray-800/80'}`}>
      <div className="flex items-center gap-1 text-gray-500 text-[8px] mb-1 font-bold uppercase tracking-widest">
        <Icon size={10} /> {label}
      </div>
      <div className={`font-black text-base leading-none ${color}`}>{value}</div>
      {unit && <div className="text-[7px] text-gray-600 mt-0.5">{unit}</div>}
    </div>
  )
}

export default function TelemetryPanel() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const activeDroneId = useTelemetryStore((state) => state.activeDroneId)
  const gps = telemetry?.drone_state?.gps ?? {}
  const ai = telemetry.ai_analysis || {}
  
  return (
    <div className="h-full flex flex-col font-sans min-h-0 gap-1.5">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="text-white font-bold text-sm">EICAS — {activeDroneId}</div>
        <div className="flex items-center gap-2">
          {/* Weather source badge */}
          <div className="text-[8px] font-bold px-2 py-0.5 rounded border border-gray-700 text-gray-500">
            {ai.weather_source === 'api' ? '🌐 Real Weather' : '📡 Weather Model'}
          </div>
          {/* System status */}
          <div className={`flex items-center gap-1.5 text-[9px] font-bold px-2 py-1 rounded-md border ${
            ai.collision_warning
              ? 'border-red-500/50 bg-red-500/10 text-red-400 animate-pulse'
              : ai.is_safe_to_fly === false
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                : 'border-agri-secondary/30 bg-agri-secondary/5 text-agri-secondary'
          }`}>
             <div className={`w-1.5 h-1.5 rounded-full ${ai.collision_warning ? 'bg-red-500' : ai.is_safe_to_fly === false ? 'bg-amber-500' : 'bg-agri-secondary'}`} />
             {ai.collision_warning ? 'COLLISION' : ai.is_safe_to_fly === false ? 'NO FLY' : 'SAFE'}
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex gap-2 min-h-0">
        {/* Left: Radar */}
        <div className="flex-[0.65] bg-black/40 rounded-md overflow-hidden relative border border-gray-700/50 min-h-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              {[40, 28, 18, 8].map((r, i) => (
                <div key={i} className="absolute rounded-full border" style={{ width: `${r * 2}px`, height: `${r * 2}px`, borderColor: `rgba(32,201,151,${0.08 + i * 0.07})` }} />
              ))}
              <span className="absolute top-2 text-[7px] text-gray-600 font-bold">N</span>
              <span className="absolute bottom-2 text-[7px] text-gray-600 font-bold">S</span>
              <span className="absolute right-2 text-[7px] text-gray-600 font-bold">E</span>
              <span className="absolute left-2 text-[7px] text-gray-600 font-bold">W</span>
              {/* Wind vector arrow — rotates to real wind direction */}
              <div
                className="absolute top-1/2 left-1/2 h-px bg-gradient-to-r from-blue-400 to-transparent origin-left"
                style={{ width: `${Math.min(ai.wind_speed_mps * 4, 48)}px`, transform: `rotate(${(ai.wind_dir_deg || 0) - 90}deg)`, marginTop: '-0.5px' }}
              />
              <div className="w-2 h-2 bg-agri-secondary rounded-full shadow-[0_0_8px_rgba(32,201,151,0.8)] z-10" />
              <div className="absolute bottom-1 left-0 right-0 text-center text-[6px] font-mono text-gray-600">
                {(gps.latitude ?? 0).toFixed(4)}, {(gps.longitude ?? 0).toFixed(4)}
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Stats Grid */}
        <div className="flex-[1.35] grid grid-cols-2 gap-1.5 min-h-0">
          <StatCard icon={Target} label="Weed Targets" value={ai.weed_count ?? 0} unit="AI detections" color="text-agri-primary" />
          <StatCard icon={Bug} label="Pest Stress" value={ai.pest_stressed_count ?? 0} unit="zones" color={(ai.pest_stressed_count ?? 0) > 0 ? 'text-red-400' : 'text-gray-500'} alert={(ai.pest_stressed_count ?? 0) > 0} />
          <StatCard icon={Wind} label="Wind" value={`${(ai.wind_speed_mps ?? 0).toFixed(1)}`} unit={`${(ai.wind_dir_deg ?? 0).toFixed(0)}° | ${ai.is_storming ? '⚠ STORM' : (ai.temperature_c ?? 20).toFixed(0) + '°C'}`} color={(ai.wind_speed_mps ?? 0) > 8 ? 'text-amber-400' : 'text-white'} />
          <StatCard icon={Leaf} label="Crop Health" value={`${(ai.coverage_pct ?? 0).toFixed(0)}%`} unit={`${(ai.stress_pct ?? 0).toFixed(1)}% stressed`} color={(ai.vari_mean ?? 0) > 0.1 ? 'text-agri-secondary' : 'text-amber-400'} />

          {/* Spray recommendation — spans full row */}
          <div className={`col-span-2 rounded-md border p-1.5 flex items-center gap-1.5 ${ai.spray_recommended ? 'border-amber-500/50 bg-amber-900/10' : 'border-gray-800/80 bg-black/40'}`}>
            {ai.spray_recommended
              ? <><ShieldAlert size={12} className="text-amber-400 shrink-0" /><div><div className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Spray Recommended</div><div className="text-[7px] text-gray-500">{ai.spray_zone_count} zones targeted · NDVI {(ai.vari_mean ?? 0).toFixed(3)}</div></div></>
              : <><ShieldCheck size={12} className="text-agri-secondary shrink-0" /><div><div className="text-[8px] font-black text-agri-secondary uppercase tracking-widest">No Spray Needed</div><div className="text-[7px] text-gray-500">VARI {(ai.vari_mean ?? 0).toFixed(3)} · ExG {(ai.exg_mean ?? 0).toFixed(3)} · NGRDI {(ai.ngrdi_mean ?? 0).toFixed(3)}</div></div></>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
