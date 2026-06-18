import React, { useState, useRef } from 'react'
import { Settings as SettingsIcon, Satellite, ShieldAlert, Play, Square, Home, ShieldCheck, ArrowUp, Activity, Power, Navigation2, Crosshair } from 'lucide-react'
import axios from 'axios'
import useTelemetryStore from '../store/useTelemetryStore'
import { sendSocketMessage } from '../useWebSocket'
import TelemetryGraph from './TelemetryGraph'

function InspectorSection({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  return (
    <div className="border-b border-neutral-800">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-6 px-2 flex items-center justify-between bg-neutral-800/20 hover:bg-neutral-800/40 transition-colors"
      >
        <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">{title}</span>
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
           <Play size={8} fill="currentColor" className="text-neutral-600" />
        </div>
      </button>
      {isOpen && <div className="p-3 bg-neutral-900/50 flex flex-col gap-3">{children}</div>}
    </div>
  )
}

function ControlButton({ onClick, active, label, icon: Icon, color = "emerald", disabled = false }) {
  const colorMap = {
    emerald: active ? "bg-emerald-600 border-emerald-500 text-white" : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-white",
    amber: active ? "bg-amber-600 border-amber-500 text-white" : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-white",
    rose: active ? "bg-rose-600 border-rose-500 text-white" : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-white",
    cyan: active ? "bg-cyan-600 border-cyan-500 text-white" : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-white",
  }

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 items-center justify-center gap-2 py-1.5 px-2 border rounded-sm transition-all shadow-sm ${disabled ? 'opacity-20 cursor-not-allowed' : colorMap[color]}`}
    >
      {Icon && <Icon size={12} />}
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  )
}

export default function Sidebar() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const activeDroneId = useTelemetryStore((state) => state.activeDroneId)
  const isArmed = telemetry?.is_active ?? false
  const altitude = telemetry?.drone_state?.gps?.altitude_relative_m || 0

  const { forwardSpeed, climbSpeed } = useTelemetryStore((state) => state.settings)
  const setSettings = useTelemetryStore((state) => state.setSettings)
  const showMap = useTelemetryStore((state) => state.showMap)
  const setShowMap = useTelemetryStore((state) => state.setShowMap)
  const showAnalytics = useTelemetryStore((state) => state.showAnalytics)
  const setShowAnalytics = useTelemetryStore((state) => state.setShowAnalytics)
  const setActiveCommands = useTelemetryStore((state) => state.setActiveCommands)

  const activeInputsRef = useRef(new Set())

  const sendCommand = async (action, params = {}) => {
    try {
      await axios.post('/api/command', { target_id: activeDroneId, action, params })
    } catch (err) {
      console.error('Failed to send command:', err)
    }
  }

  const handleControlStart = (command) => {
    activeInputsRef.current.add(command)
    updateManualControl()
  }

  const handleControlEnd = (command) => {
    activeInputsRef.current.delete(command)
    updateManualControl()
  }
  
  const updateManualControl = () => {
    const inputs = Array.from(activeInputsRef.current)
    setActiveCommands(inputs)
    sendSocketMessage({
      target_id: activeDroneId,
      action: 'MANUAL_CONTROL',
      params: { inputs, forward_speed: forwardSpeed, climb_speed: climbSpeed }
    })
  }

  return (
    <div className="w-full h-full flex flex-col pointer-events-auto overflow-y-auto no-scrollbar bg-neutral-900 select-none">
      
      <InspectorSection title="Master Output (Power)">
        <div className="flex gap-2 w-full">
           <ControlButton onClick={() => sendCommand('ARM')} active={isArmed} label={isArmed ? "Armed" : "Arm"} icon={Play} color="amber" />
           <ControlButton onClick={() => sendCommand('DISARM')} label="Disarm" icon={Square} color="rose" />
        </div>
      </InspectorSection>

      <InspectorSection title="Transform (Flight FCU)">
        <div className="flex flex-col gap-3 w-full">
           <div className="flex gap-2">
             <ControlButton onClick={() => sendCommand('TAKEOFF')} disabled={altitude > 1.0} label="Takeoff" icon={ArrowUp} color="cyan" />
             <ControlButton onClick={() => sendCommand('RTL')} label="Home" icon={Home} color="cyan" />
           </div>
           
           <div className="flex flex-col gap-1.5">
             <div className="flex justify-between items-center px-1">
               <span className="text-[8px] text-neutral-500 font-bold uppercase">Throttle Sensitivity</span>
               <span className="text-[9px] text-emerald-500 font-mono font-bold">{forwardSpeed}%</span>
             </div>
             <input 
               type="range" min="10" max="500" value={forwardSpeed} 
               onChange={(e) => setSettings({ forwardSpeed: parseInt(e.target.value) })}
               className="w-full accent-emerald-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
             />
           </div>
        </div>
      </InspectorSection>

      <InspectorSection title="Manual Override (Controls)">
        <div className="flex flex-col gap-4 w-full">
           {/* Navigation Grid Style */}
           <div className="grid grid-cols-3 gap-1.5 px-6">
              <div />
              <button onMouseDown={() => handleControlStart('PITCH_FORWARD')} onMouseUp={() => handleControlEnd('PITCH_FORWARD')} className="aspect-square bg-neutral-800 border border-neutral-700 flex items-center justify-center hover:bg-neutral-700 transition-colors"><ArrowUp size={14} /></button>
              <div />
              <button onMouseDown={() => handleControlStart('ROLL_LEFT')} onMouseUp={() => handleControlEnd('ROLL_LEFT')} className="aspect-square bg-neutral-800 border border-neutral-700 flex items-center justify-center hover:bg-neutral-700 transition-colors"><ArrowUp size={14} className="-rotate-90" /></button>
              <div className="flex items-center justify-center"><div className="w-1.5 h-1.5 bg-emerald-500/40 rounded-full" /></div>
              <button onMouseDown={() => handleControlStart('ROLL_RIGHT')} onMouseUp={() => handleControlEnd('ROLL_RIGHT')} className="aspect-square bg-neutral-800 border border-neutral-700 flex items-center justify-center hover:bg-neutral-700 transition-colors"><ArrowUp size={14} className="rotate-90" /></button>
              <div />
              <button onMouseDown={() => handleControlStart('PITCH_BACK')} onMouseUp={() => handleControlEnd('PITCH_BACK')} className="aspect-square bg-neutral-800 border border-neutral-700 flex items-center justify-center hover:bg-neutral-700 transition-colors"><ArrowUp size={14} className="rotate-180" /></button>
              <div />
           </div>

           <div className="bg-neutral-800/30 p-2 rounded-sm border border-neutral-800">
              <span className="text-[7px] font-black text-neutral-500 uppercase tracking-widest block mb-2 text-center underline decoration-emerald-500/40">Z-Axis / Altitude Engine</span>
              <div className="flex gap-2">
                 <button onMouseDown={() => handleControlStart('ALT_UP')} onMouseUp={() => handleControlEnd('ALT_UP')} className="flex-1 py-1 bg-neutral-800 border border-neutral-700 text-[10px] font-black hover:bg-neutral-700">CLIMB (+)</button>
                 <button onMouseDown={() => handleControlStart('ALT_DOWN')} onMouseUp={() => handleControlEnd('ALT_DOWN')} className="flex-1 py-1 bg-neutral-800 border border-neutral-700 text-[10px] font-black hover:bg-neutral-700">DESC (-)</button>
              </div>
           </div>
        </div>
      </InspectorSection>

      <InspectorSection title="Project Management">
        <div className="flex flex-col gap-2 w-full">
           <ControlButton onClick={() => setShowMap(!showMap)} active={showMap} label="Tactical Radar" icon={Satellite} color="emerald" />
           <ControlButton onClick={() => setShowAnalytics(!showAnalytics)} active={showAnalytics} label="Black Box Logs" icon={Activity} color="emerald" />
        </div>
      </InspectorSection>

      <div className="mt-auto p-4 border-t border-neutral-800 bg-neutral-950/20">
         <button 
           onClick={() => sendCommand('EMERGENCY_STOP')}
           className="w-full py-2 bg-rose-950/40 text-rose-500 border border-rose-900/50 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
         >
           ABORT MISSION (E-STOP)
         </button>
      </div>

      {/* ANALYTICS MODAL OVERLAY */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-12 transition-all">
           <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col p-6 pointer-events-auto">
              <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
                 <h2 className="text-lg font-black text-white uppercase tracking-widest">Black Box Telemetry</h2>
                 <button onClick={() => setShowAnalytics(false)} className="px-4 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] uppercase font-bold hover:bg-neutral-700 hover:text-white transition-all">Close</button>
              </div>
              <div className="h-96">
                <TelemetryGraph />
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
