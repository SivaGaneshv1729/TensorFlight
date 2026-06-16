import React, { useState, useRef } from 'react'
import { Settings as SettingsIcon, Satellite, ShieldAlert, Play, Square, Home, Compass, Eye, ShieldCheck, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, RotateCcw, Radio, Zap, Power, Navigation2, Activity } from 'lucide-react'
import axios from 'axios'
import useTelemetryStore from '../store/useTelemetryStore'
import { sendSocketMessage } from '../useWebSocket'

function ControlButton({ onClick, active, label, icon: Icon, color = "cyan", disabled = false }) {
  const colorMap = {
    cyan: "border-agri-neon/30 text-agri-neon hover:bg-agri-neon/10",
    amber: "border-amber-500/30 text-amber-500 hover:bg-amber-500/10",
    red: "border-red-500/30 text-red-500 hover:bg-red-500/10",
    purple: "border-purple-500/30 text-purple-400 hover:bg-purple-500/10",
    green: "border-green-500/30 text-green-400 hover:bg-green-500/10"
  }
  
  const activeMap = {
    cyan: "bg-agri-neon text-black border-agri-neon shadow-[0_0_15px_#39ff14]",
    amber: "bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_#fbbf24]",
    red: "bg-red-600 text-white border-red-400 shadow-[0_0_15px_#ef4444]",
    purple: "bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_#a855f7]",
    green: "bg-green-600 text-black border-green-400 shadow-[0_0_15px_#22c55e]"
  }

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-sm border transition-all uppercase font-black ${disabled ? 'opacity-20 border-white/5 text-gray-600 cursor-not-allowed' : active ? activeMap[color] : colorMap[color]}`}
    >
      {Icon && <Icon size={18} strokeWidth={2.5} />}
      <span className="text-[8px] tracking-[0.15em] leading-none font-mono">{label}</span>
    </button>
  )
}

export default function Sidebar() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const isConnected = telemetry?.is_connected ?? false
  const isArmed = telemetry?.is_active ?? false
  const altitude = telemetry?.drone_state?.gps?.altitude_relative_m || 0

  const { forwardSpeed, climbSpeed } = useTelemetryStore((state) => state.settings)
  const setSettings = useTelemetryStore((state) => state.setSettings)
  const showMap = useTelemetryStore((state) => state.showMap)
  const setShowMap = useTelemetryStore((state) => state.setShowMap)
  const cameraMode = useTelemetryStore((state) => state.cameraMode)
  const setCameraMode = useTelemetryStore((state) => state.setCameraMode)
  const setActiveCommands = useTelemetryStore((state) => state.setActiveCommands)

  const [showSettings, setShowSettings] = useState(false)
  const activeInputsRef = useRef(new Set())

  const sendCommand = async (action, params = {}) => {
    try {
      await axios.post('/api/command', { action, params })
    } catch (err) {
      console.error('Failed to send command:', err)
    }
  }

  const handleControlStart = (command) => {
    activeInputsRef.current.add(command)
    const inputs = Array.from(activeInputsRef.current)
    setActiveCommands(inputs)
    sendSocketMessage({
      action: 'MANUAL_CONTROL',
      params: { inputs, forward_speed: forwardSpeed, climb_speed: climbSpeed }
    })
  }

  const handleControlEnd = (command) => {
    activeInputsRef.current.delete(command)
    const inputs = Array.from(activeInputsRef.current)
    setActiveCommands(inputs)
    sendSocketMessage({
      action: 'MANUAL_CONTROL',
      params: { inputs, forward_speed: forwardSpeed, climb_speed: climbSpeed }
    })
  }

  return (
    <div className="w-full h-full flex flex-col p-4 gap-5 pointer-events-auto overflow-y-auto no-scrollbar select-none bg-transparent font-mono">
      
      {/* 1. MASTER CONTROL */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1 mb-1">
           <Power size={12} className="text-gray-500" />
           <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">Master_Control</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
           <ControlButton 
             onClick={() => sendCommand('ARM')} 
             active={isArmed} 
             label={isArmed ? "Armed_Active" : "Arm_Motors"} 
             icon={Play} 
             color="amber"
           />
           <ControlButton 
             onClick={() => sendCommand('DISARM')} 
             label="Safe_Disarm" 
             icon={Square} 
             color="red" 
           />
        </div>
      </div>

      {/* 2. AUTOPILOT FCU */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1 mb-1">
           <Navigation2 size={12} className="text-gray-500" />
           <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">Autopilot_FCU</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
           <ControlButton 
             onClick={() => sendCommand('TAKEOFF')} 
             disabled={altitude > 1.0}
             label="Auto_Takeoff" 
             icon={ArrowUp} 
             color="cyan"
           />
           <ControlButton 
             onClick={() => sendCommand('RTL')} 
             label="Return_Home" 
             icon={Home} 
             color="purple"
           />
           <div className="col-span-2">
              <ControlButton 
                onClick={() => sendCommand('SET_MODE', { mode: 'GUIDED' })} 
                label="Engage_Guided_Mission" 
                icon={ShieldCheck} 
                color="cyan"
              />
           </div>
        </div>
      </div>

      {/* 3. NAVIGATION */}
      <div className="grid grid-cols-4 gap-2">
         <div className="col-span-3">
            <ControlButton 
               onClick={() => setShowMap(!showMap)} 
               active={showMap}
               label="Tactical_Radar_2D" 
               icon={Satellite} 
               color="cyan"
            />
         </div>
         <ControlButton 
            onClick={() => setShowSettings(!showSettings)} 
            active={showSettings}
            label="Cfg" 
            icon={SettingsIcon} 
            color="cyan"
         />
      </div>

      {/* 4. MANUAL OVERRIDE */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between px-1 mb-1">
           <div className="flex items-center gap-2">
              <Activity size={12} className="text-gray-500" />
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">Manual_Authority</span>
           </div>
           <Compass size={12} className="text-gray-500" />
        </div>

        <div className="flex flex-col gap-3">
           <div className="bg-black/40 border border-white/5 p-3 rounded-lg flex flex-col gap-3 shadow-inner">
              <span className="text-[7px] font-black text-agri-neon/40 uppercase tracking-widest text-center italic">Elevation & Yaw</span>
              <div className="grid grid-cols-3 gap-1 px-4">
                 <div />
                 <button onMouseDown={() => handleControlStart('ALT_UP')} onMouseUp={() => handleControlEnd('ALT_UP')} className="aspect-square bg-agri-neon/5 border border-agri-neon/20 rounded flex items-center justify-center hover:bg-agri-neon hover:text-black transition-all shadow-inner"><ArrowUp size={14} /></button>
                 <div />
                 <button onMouseDown={() => handleControlStart('YAW_LEFT')} onMouseUp={() => handleControlEnd('YAW_LEFT')} className="aspect-square bg-agri-neon/5 border border-agri-neon/20 rounded flex items-center justify-center hover:bg-agri-neon hover:text-black transition-all shadow-inner"><RotateCcw size={14} /></button>
                 <div className="flex items-center justify-center"><div className="w-1.5 h-1.5 bg-agri-neon/20 rounded-full" /></div>
                 <button onMouseDown={() => handleControlStart('YAW_RIGHT')} onMouseUp={() => handleControlEnd('YAW_RIGHT')} className="aspect-square bg-agri-neon/5 border border-agri-neon/20 rounded flex items-center justify-center hover:bg-agri-neon hover:text-black transition-all shadow-inner"><RotateCw size={14} /></button>
                 <div />
                 <button onMouseDown={() => handleControlStart('ALT_DOWN')} onMouseUp={() => handleControlEnd('ALT_DOWN')} className="aspect-square bg-agri-neon/5 border border-agri-neon/20 rounded flex items-center justify-center hover:bg-agri-neon hover:text-black transition-all shadow-inner"><ArrowDown size={14} /></button>
                 <div />
              </div>
           </div>
           <div className="bg-black/40 border border-white/5 p-3 rounded-lg flex flex-col gap-3 shadow-inner">
              <span className="text-[7px] font-black text-agri-neon/40 uppercase tracking-widest text-center italic">Pitch & Roll</span>
              <div className="grid grid-cols-3 gap-1 px-4">
                 <div />
                 <button onMouseDown={() => handleControlStart('PITCH_FORWARD')} onMouseUp={() => handleControlEnd('PITCH_FORWARD')} className="aspect-square bg-agri-neon/5 border border-agri-neon/20 rounded flex items-center justify-center hover:bg-agri-neon hover:text-black transition-all shadow-inner"><ArrowUp size={14} /></button>
                 <div />
                 <button onMouseDown={() => handleControlStart('ROLL_LEFT')} onMouseUp={() => handleControlEnd('ROLL_LEFT')} className="aspect-square bg-agri-neon/5 border border-agri-neon/20 rounded flex items-center justify-center hover:bg-agri-neon hover:text-black transition-all shadow-inner"><ArrowLeft size={14} /></button>
                 <div className="flex items-center justify-center"><div className="w-1.5 h-1.5 bg-agri-neon/20 rounded-full" /></div>
                 <button onMouseDown={() => handleControlStart('ROLL_RIGHT')} onMouseUp={() => handleControlEnd('ROLL_RIGHT')} className="aspect-square bg-agri-neon/5 border border-agri-neon/20 rounded flex items-center justify-center hover:bg-agri-neon hover:text-black transition-all shadow-inner"><ArrowRight size={14} /></button>
                 <div />
                 <button onMouseDown={() => handleControlStart('PITCH_BACK')} onMouseUp={() => handleControlEnd('PITCH_BACK')} className="aspect-square bg-agri-neon/5 border border-agri-neon/20 rounded flex items-center justify-center hover:bg-agri-neon hover:text-black transition-all shadow-inner"><ArrowDown size={14} /></button>
                 <div />
              </div>
           </div>
        </div>
      </div>

      {/* 5. EMERGENCY KILL SWITCH */}
      <button 
        onClick={() => sendCommand('EMERGENCY_STOP')}
        className="w-full py-5 bg-red-700/10 border-2 border-red-600 text-red-500 font-black uppercase text-xs tracking-[0.4em] hover:bg-red-600 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] mt-auto"
      >
        <ShieldAlert size={16} className="inline mr-2" /> EMERGENCY_STOP
      </button>

    </div>
  )
}