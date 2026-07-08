import React from 'react'
import { Play, Square, Navigation2, ArrowUp, Home, ShieldCheck, AlertOctagon, ChevronDown, Settings2, Gauge } from 'lucide-react'
import axios from 'axios'
import useTelemetryStore from '../store/useTelemetryStore'

export default function Sidebar() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const activeDroneId = useTelemetryStore((state) => state.activeDroneId)
  const setActiveDroneId = useTelemetryStore((state) => state.setActiveDroneId)
  const fleet = useTelemetryStore((state) => state.fleet)
  const isArmed = telemetry?.is_active ?? false
  const battery = telemetry?.drone_state?.battery_percentage ?? 0
  const altitude = telemetry?.drone_state?.gps?.altitude_relative_m ?? 0
  const settings = useTelemetryStore((state) => state.settings)
  const setSettings = useTelemetryStore((state) => state.setSettings)

  const sendCommand = async (action, params = {}) => {
    try {
      await axios.post('/api/command', { target_id: activeDroneId, action, params })
    } catch (err) {
      console.error('Failed to send command:', err)
    }
  }

  return (
    <div className="h-full flex flex-col font-sans select-none gap-4 overflow-y-auto no-scrollbar">
      
      {/* 1. Fleet / Drone Selector */}
      <div className="shrink-0">
        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Active Drone</div>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(fleet).map(([id, data]) => {
            const bat = data?.drone_state?.battery_percentage ?? 0
            const isActive = id === activeDroneId
            const isOnline = data?.is_connected ?? false
            return (
              <button
                key={id}
                onClick={() => setActiveDroneId(id)}
                className={`flex flex-col items-center py-2 px-1 rounded-md border text-[9px] font-bold transition-all ${
                  isActive 
                    ? 'bg-agri-primary/20 border-agri-primary text-agri-primary' 
                    : 'bg-gray-700/20 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span className="font-mono">{id.replace('UAV_', 'UAV ')}</span>
                <span className={`mt-0.5 ${bat > 20 ? 'text-gray-500' : 'text-red-500'}`}>{bat}%</span>
                <div className={`mt-1 w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-agri-secondary' : 'bg-gray-600'}`} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700/60 shrink-0" />

      {/* 2. Battery Status */}
      <div className="shrink-0">
        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Battery Status</div>
        <div className="border border-gray-600 p-3 relative text-xs bg-black/20 rounded-sm">
          <div className="flex justify-between items-center text-gray-300 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-3 border border-gray-400 rounded-sm p-[1px] relative">
                <div className="absolute -right-1 top-0.5 w-0.5 h-1.5 bg-gray-400" />
                <div className={`h-full transition-all ${battery > 20 ? 'bg-agri-primary' : 'bg-red-500 animate-pulse'}`} style={{ width: `${battery}%` }} />
              </div>
              <span className="font-bold text-sm">{battery}%</span>
            </div>
            <span className="text-gray-500">Main LiPo</span>
            <span className="text-gray-500 border-l border-gray-700 pl-2">27°C</span>
          </div>
          <div className="w-full h-1 bg-gray-700 rounded-full">
            <div className={`h-full rounded-full transition-all ${battery > 50 ? 'bg-agri-secondary' : battery > 20 ? 'bg-agri-primary' : 'bg-red-500'}`} style={{ width: `${battery}%` }} />
          </div>
        </div>
      </div>

      {/* 3. Live Stats Strip */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
        <div className="bg-black/20 border border-gray-700/50 rounded-md p-2 flex flex-col">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Altitude</span>
          <span className="text-agri-secondary font-bold text-base">{altitude.toFixed(1)}<span className="text-[9px] text-gray-500 ml-1">m</span></span>
        </div>
        <div className="bg-black/20 border border-gray-700/50 rounded-md p-2 flex flex-col">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Mode</span>
          <span className={`font-bold text-sm ${isArmed ? 'text-agri-primary' : 'text-gray-400'}`}>{isArmed ? 'ARMED' : 'IDLE'}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700/60 shrink-0" />

      {/* 4. Master Control */}
      <div className="shrink-0">
        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Master Control</div>
        <div className="flex gap-2">
          <button 
            onClick={() => sendCommand('ARM')} 
            className={`flex-1 py-3 text-xs font-bold rounded-md transition-colors border ${isArmed ? 'bg-agri-primary text-agri-bg border-agri-primary shadow-[0_0_12px_rgba(255,140,66,0.4)]' : 'bg-gray-700/30 text-gray-400 border-gray-600 hover:bg-gray-700'}`}
          >
            <Play size={14} className="inline mr-1.5" /> {isArmed ? 'ARMED' : 'ARM'}
          </button>
          <button 
            onClick={() => sendCommand('DISARM')} 
            className="flex-1 py-3 text-xs font-bold rounded-md bg-gray-700/30 text-red-400 border border-gray-600 hover:bg-red-500/20 transition-colors"
          >
            <Square size={14} className="inline mr-1.5" /> DISARM
          </button>
        </div>
      </div>

      {/* 5. Autopilot FCU */}
      <div className="shrink-0">
        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
          <Navigation2 size={12} className="text-agri-secondary" /> Autopilot FCU
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button 
            onClick={() => sendCommand('TAKEOFF')}
            className="bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 border border-gray-600 rounded-md py-3 text-[10px] font-bold transition-colors flex flex-col items-center gap-1"
          >
            <ArrowUp size={14} /> TAKEOFF
          </button>
          <button 
            onClick={() => sendCommand('RTL')}
            className="bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 border border-gray-600 rounded-md py-3 text-[10px] font-bold transition-colors flex flex-col items-center gap-1"
          >
            <Home size={14} /> RTL
          </button>
        </div>
        <button 
          onClick={() => sendCommand('SET_MODE', { mode: 'GUIDED' })}
          className="w-full bg-agri-secondary/20 hover:bg-agri-secondary/30 text-agri-secondary rounded-md py-3 text-[10px] font-bold transition-colors border border-agri-secondary/40 flex items-center justify-center gap-2"
        >
          <ShieldCheck size={14} /> GUIDED MISSION
        </button>
      </div>

      {/* 6. Speed Settings */}
      <div className="shrink-0">
        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
          <Gauge size={12} /> Speed Controls
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[9px] text-gray-500 mb-1">
              <span>Forward Speed</span>
              <span className="text-agri-primary font-mono">{settings.forwardSpeed}</span>
            </div>
            <input type="range" min={10} max={500} value={settings.forwardSpeed} 
              onChange={(e) => setSettings({ forwardSpeed: Number(e.target.value) })}
              className="w-full accent-agri-primary h-1 cursor-pointer" />
          </div>
          <div>
            <div className="flex justify-between text-[9px] text-gray-500 mb-1">
              <span>Climb Speed</span>
              <span className="text-agri-primary font-mono">{settings.climbSpeed}</span>
            </div>
            <input type="range" min={10} max={500} value={settings.climbSpeed} 
              onChange={(e) => setSettings({ climbSpeed: Number(e.target.value) })}
              className="w-full accent-agri-primary h-1 cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* 7. Emergency Stop — always at bottom */}
      <button 
        onClick={() => sendCommand('DISARM')}
        className="shrink-0 w-full py-4 bg-red-950/40 border-2 border-red-600/60 text-red-500 text-xs font-black uppercase tracking-widest rounded-md hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-[inset_0_0_20px_rgba(220,38,38,0.1)]"
      >
        <AlertOctagon size={16} /> EMERGENCY STOP
      </button>
    </div>
  )
}
