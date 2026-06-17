import React, { useState, useRef } from 'react'
import { Settings as SettingsIcon, Satellite, ShieldAlert, Play, Square, Home, Compass, Eye, ShieldCheck, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, RotateCcw, Radio, Zap, Power, Navigation2, Activity } from 'lucide-react'
import axios from 'axios'
import useTelemetryStore from '../store/useTelemetryStore'
import { sendSocketMessage } from '../useWebSocket'
import TelemetryGraph from './TelemetryGraph'

function ControlButton({ onClick, active, label, icon: Icon, color = "slate", disabled = false }) {
  const colorMap = {
    slate: "border-slate-700 text-slate-300 hover:bg-slate-700",
    amber: "border-amber-900 text-amber-500 hover:bg-amber-900/50",
    red: "border-red-900 text-red-500 hover:bg-red-900/50",
    blue: "border-blue-900 text-blue-400 hover:bg-blue-900/50",
    purple: "border-purple-900 text-purple-400 hover:bg-purple-900/50"
  }
  
  const activeMap = {
    slate: "bg-slate-700 text-white",
    amber: "bg-amber-600 text-black border-amber-400",
    red: "bg-red-600 text-white border-red-400",
    blue: "bg-blue-600 text-white border-blue-400",
    purple: "bg-purple-600 text-white border-purple-400"
  }

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1 py-3 px-2 border transition-all uppercase font-black ${disabled ? 'opacity-20 border-slate-800 text-slate-700 cursor-not-allowed' : active ? activeMap[color] : colorMap[color]}`}
    >
      {Icon && <Icon size={16} strokeWidth={2.5} />}
      <span className="text-[9px] tracking-[0.1em] leading-none font-mono">{label}</span>
    </button>
  )
}

export default function Sidebar() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const activeDroneId = useTelemetryStore((state) => state.activeDroneId)
  const isConnected = telemetry?.is_connected ?? false
  const isArmed = telemetry?.is_active ?? false
  const altitude = telemetry?.drone_state?.gps?.altitude_relative_m || 0

  const { forwardSpeed, climbSpeed } = useTelemetryStore((state) => state.settings)
  const setSettings = useTelemetryStore((state) => state.setSettings)
  const showMap = useTelemetryStore((state) => state.showMap)
  const setShowMap = useTelemetryStore((state) => state.setShowMap)
  const showAnalytics = useTelemetryStore((state) => state.showAnalytics)
  const setShowAnalytics = useTelemetryStore((state) => state.setShowAnalytics)
  const cameraMode = useTelemetryStore((state) => state.cameraMode)
  const setCameraMode = useTelemetryStore((state) => state.setCameraMode)
  const setActiveCommands = useTelemetryStore((state) => state.setActiveCommands)

  const [showSettings, setShowSettings] = useState(false)
  const activeInputsRef = useRef(new Set())

  const sendCommand = async (action, params = {}) => {
    try {
      await axios.post('/api/command', { 
        target_id: activeDroneId,
        action, 
        params 
      })
    } catch (err) {
      console.error('Failed to send command:', err)
    }
  }

  const handleControlStart = (command) => {
    activeInputsRef.current.add(command)
    const inputs = Array.from(activeInputsRef.current)
    setActiveCommands(inputs)
    sendSocketMessage({
      target_id: activeDroneId,
      action: 'MANUAL_CONTROL',
      params: { inputs, forward_speed: forwardSpeed, climb_speed: climbSpeed }
    })
  }

  const handleControlEnd = (command) => {
    activeInputsRef.current.delete(command)
    const inputs = Array.from(activeInputsRef.current)
    setActiveCommands(inputs)
    sendSocketMessage({
      target_id: activeDroneId,
      action: 'MANUAL_CONTROL',
      params: { inputs, forward_speed: forwardSpeed, climb_speed: climbSpeed }
    })
  }

  return (
    <div className="w-full h-full flex flex-col p-2 gap-2 overflow-y-auto no-scrollbar select-none bg-slate-900 font-mono border-l border-slate-700 relative">
      
      {/* 1. MASTER CONTROL */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 px-1 mb-0.5">
           <Power size={10} className="text-slate-500" />
           <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Master_Control</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
           <ControlButton 
             onClick={() => sendCommand('ARM')} 
             active={isArmed} 
             label={isArmed ? "Armed" : "Arm"} 
             icon={Play} 
             color="amber"
           />
           <ControlButton 
             onClick={() => sendCommand('DISARM')} 
             label="Disarm" 
             icon={Square} 
             color="red" 
           />
        </div>
      </div>

      {/* 2. AUTOPILOT FCU */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 px-1 mb-0.5">
           <Navigation2 size={10} className="text-slate-500" />
           <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Autopilot_FCU</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
           <ControlButton 
             onClick={() => sendCommand('TAKEOFF')} 
             disabled={altitude > 1.0}
             label="Takeoff" 
             icon={ArrowUp} 
             color="blue"
           />
           <ControlButton 
             onClick={() => sendCommand('RTL')} 
             label="Home" 
             icon={Home} 
             color="purple"
           />
           <div className="col-span-2">
              <ControlButton 
                onClick={() => sendCommand('SET_MODE', { mode: 'GUIDED' })} 
                label="Guided_Mission" 
                icon={ShieldCheck} 
                color="slate"
              />
           </div>
        </div>
      </div>

      {/* 3. NAVIGATION */}
      <div className="grid grid-cols-4 gap-1">
         <div className="col-span-2">
            <ControlButton 
               onClick={() => setShowMap(!showMap)} 
               active={showMap}
               label="Radar" 
               icon={Satellite} 
               color="slate"
            />
         </div>
         <ControlButton 
            onClick={() => setShowAnalytics(!showAnalytics)} 
            active={showAnalytics}
            label="Logs" 
            icon={Activity} 
            color="slate"
         />
         <ControlButton 
            onClick={() => setShowSettings(!showSettings)} 
            active={showSettings}
            label="Cfg" 
            icon={SettingsIcon} 
            color="slate"
         />
      </div>

      {/* 4. ANALYTICS SLIDE-OUT */}
      {showAnalytics && (
        <div className="absolute left-[-320px] top-0 bottom-0 w-80 p-2 z-[100] animate-in slide-in-from-right-4 duration-300">
           <div className="w-full h-full bg-slate-900 border border-slate-700 shadow-2xl p-2 flex flex-col pointer-events-auto">
              <div className="flex justify-between items-center px-2 py-1 border-b border-slate-700 mb-2">
                 <span className="text-[10px] font-black text-white uppercase">Black_Box_Telemetry</span>
                 <button onClick={() => setShowAnalytics(false)} className="text-slate-500 hover:text-white"><Activity size={14}/></button>
              </div>
              <TelemetryGraph />
              <div className="mt-auto p-4 border-t border-slate-700">
                 <span className="text-[8px] text-slate-500 italic">Advanced Flight Diagnostics active for {activeDroneId}. Data buffer: 100 points.</span>
              </div>
           </div>
        </div>
      )}

      {/* 5. MANUAL OVERRIDE */}
      <div className="flex flex-col gap-1 pt-1 border-t border-slate-700">
        <div className="flex items-center justify-between px-1 mb-1">
           <div className="flex items-center gap-2">
              <Activity size={10} className="text-slate-500" />
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Manual_Authority</span>
           </div>
        </div>

        <div className="flex flex-col gap-1">
           <div className="bg-black/40 p-2 flex flex-col gap-1">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest text-center">Z_YAW</span>
              <div className="grid grid-cols-3 gap-0.5 px-4">
                 <div />
                 <button onMouseDown={() => handleControlStart('ALT_UP')} onMouseUp={() => handleControlEnd('ALT_UP')} className="h-6 border border-slate-700 flex items-center justify-center hover:bg-white hover:text-black">^</button>
                 <div />
                 <button onMouseDown={() => handleControlStart('YAW_LEFT')} onMouseUp={() => handleControlEnd('YAW_LEFT')} className="h-6 border border-slate-700 flex items-center justify-center hover:bg-white hover:text-black">&lt;</button>
                 <div className="flex items-center justify-center"><div className="w-1 h-1 bg-slate-700 rounded-full" /></div>
                 <button onMouseDown={() => handleControlStart('YAW_RIGHT')} onMouseUp={() => handleControlEnd('YAW_RIGHT')} className="h-6 border border-slate-700 flex items-center justify-center hover:bg-white hover:text-black">&gt;</button>
                 <div />
                 <button onMouseDown={() => handleControlStart('ALT_DOWN')} onMouseUp={() => handleControlEnd('ALT_DOWN')} className="h-6 border border-slate-700 flex items-center justify-center hover:bg-white hover:text-black">v</button>
                 <div />
              </div>
           </div>
           <div className="bg-black/40 p-2 flex flex-col gap-1">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest text-center">P_R_XY</span>
              <div className="grid grid-cols-3 gap-0.5 px-4">
                 <div />
                 <button onMouseDown={() => handleControlStart('PITCH_FORWARD')} onMouseUp={() => handleControlEnd('PITCH_FORWARD')} className="h-6 border border-slate-700 flex items-center justify-center hover:bg-white hover:text-black">^</button>
                 <div />
                 <button onMouseDown={() => handleControlStart('ROLL_LEFT')} onMouseUp={() => handleControlEnd('ROLL_LEFT')} className="h-6 border border-slate-700 flex items-center justify-center hover:bg-white hover:text-black">&lt;</button>
                 <div className="flex items-center justify-center"><div className="w-1 h-1 bg-slate-700 rounded-full" /></div>
                 <button onMouseDown={() => handleControlStart('ROLL_RIGHT')} onMouseUp={() => handleControlEnd('ROLL_RIGHT')} className="h-6 border border-slate-700 flex items-center justify-center hover:bg-white hover:text-black">&gt;</button>
                 <div />
                 <button onMouseDown={() => handleControlStart('PITCH_BACK')} onMouseUp={() => handleControlEnd('PITCH_BACK')} className="h-6 border border-slate-700 flex items-center justify-center hover:bg-white hover:text-black">v</button>
                 <div />
              </div>
           </div>
        </div>
      </div>

      {/* 5. EMERGENCY KILL SWITCH */}
      <button 
        onClick={() => sendCommand('EMERGENCY_STOP')}
        className="w-full py-3 bg-red-900 text-red-500 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all mt-auto border border-red-700"
      >
        <ShieldAlert size={14} className="inline mr-2" /> EMERGENCY_STOP
      </button>

    </div>
  )
}
