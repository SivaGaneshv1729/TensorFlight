import React, { useState, useRef } from 'react'
import { Settings as SettingsIcon, Satellite, ShieldAlert, Play, Square, Home, Compass, Eye, ShieldCheck, Target, Wind, Battery, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, RotateCcw } from 'lucide-react'
import axios from 'axios'
import useTelemetryStore from '../store/useTelemetryStore'
import { sendSocketMessage } from '../useWebSocket'

export default function Sidebar() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const isConnected = telemetry.is_connected
  const isArmed = telemetry.is_active
  const altitude = telemetry.drone_state.gps.altitude_relative_m || 0

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
      params: {
        inputs,
        forward_speed: forwardSpeed,
        climb_speed: climbSpeed
      }
    })
  }

  const handleControlEnd = (command) => {
    activeInputsRef.current.delete(command)
    const inputs = Array.from(activeInputsRef.current)
    setActiveCommands(inputs)
    sendSocketMessage({
      action: 'MANUAL_CONTROL',
      params: {
        inputs,
        forward_speed: forwardSpeed,
        climb_speed: climbSpeed
      }
    })
  }

  const startManualInput = (command) => {
     handleControlStart(command);
  }

  return (
    <>
      <div className="w-full bg-black/85 backdrop-blur-xl border-l border-white/10 h-full flex flex-col py-6 px-5 pointer-events-auto overflow-y-auto no-scrollbar shadow-2xl z-30 select-none">
        
        {/* Header Section */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-mono">Control Uplink</span>
            <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
               COMMAND TERMINAL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-agri-neon shadow-[0_0_8px_#39ff14]' : 'bg-red-500'}`} />
            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${isConnected ? 'text-agri-neon' : 'text-red-500'}`}>
              {isConnected ? 'LIVE' : 'LINK LOST'}
            </span>
          </div>
        </div>

        {/* Flight Presets / Commands */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button 
            onClick={() => sendCommand('ARM')}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${isArmed ? 'bg-agri-neon/10 text-agri-neon border-agri-neon/30 shadow-[0_0_8px_rgba(57,255,20,0.2)]' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}
          >
            <Play size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Arm</span>
          </button>

          <button 
            onClick={() => sendCommand('TAKEOFF')}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${altitude > 0.5 ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.2)]' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}
          >
            <ArrowUp size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Takeoff</span>
          </button>

          <button 
            onClick={() => sendCommand('DISARM')}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${!isArmed ? 'bg-white/5 text-gray-500 border-white/5' : 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'}`}
          >
            <Square size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Disarm</span>
          </button>

          <button 
            onClick={() => sendCommand('SET_MODE', { mode: 'GUIDED' })}
            className="p-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl flex flex-col items-center gap-1 transition-all"
          >
            <ShieldCheck size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Guided</span>
          </button>

          <button 
            onClick={() => sendCommand('RTL')}
            className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl flex flex-col items-center gap-1 transition-all"
          >
            <Home size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">RTL</span>
          </button>

          <button 
            onClick={() => sendCommand('EMERGENCY_STOP')}
            className="p-2.5 bg-red-500/15 hover:bg-red-500/30 text-red-500 border border-red-500/30 rounded-xl flex flex-col items-center gap-1 transition-all"
          >
            <ShieldAlert size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">E-Stop</span>
          </button>
        </div>

        {/* 2D Map Toggle & Tuning Settings */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => { 
              const nextShowMap = !showMap;
              setShowMap(nextShowMap); 
              setShowSettings(false); 
              if (nextShowMap) {
                axios.post('/api/command', {
                  action: 'MANUAL_CONTROL',
                  params: { inputs: [], forward_speed: forwardSpeed, climb_speed: climbSpeed }
                }).catch(() => {});
              }
            }}
            className={`flex-1 py-2 px-3 rounded-xl border transition-all uppercase font-bold text-[10px] tracking-widest flex items-center justify-center gap-2 ${showMap ? 'text-agri-gold bg-agri-gold/15 border-agri-gold/40 shadow-[0_0_8px_rgba(251,191,36,0.2)]' : 'text-gray-400 border-white/10 hover:text-white hover:bg-white/5'}`}
          >
            <Satellite size={14} className={showMap ? 'animate-spin' : ''} style={showMap ? { animationDuration: '10s' } : {}} />
            Tactical Map
          </button>

          <button 
            onClick={() => { setShowSettings(!showSettings); setShowMap(false); }}
            className={`p-2 rounded-xl border transition-all ${showSettings ? 'text-agri-neon bg-agri-neon/15 border-agri-neon/30' : 'text-gray-400 border-white/10 hover:text-white hover:bg-white/5'}`}
          >
            <SettingsIcon size={16} />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <span className="text-[10px] font-bold uppercase text-agri-neon tracking-widest flex items-center gap-1.5 pb-2 border-b border-white/5">
              <SettingsIcon size={12} /> Tuning Calibrator
            </span>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Cruise Speed</span>
                <span className="text-agri-neon">{forwardSpeed}</span>
              </div>
              <input 
                type="range" min="10" max="500" step="10"
                value={forwardSpeed}
                onChange={(e) => setSettings({ forwardSpeed: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-agri-neon"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Vertical Speed</span>
                <span className="text-blue-400">{climbSpeed}</span>
              </div>
              <input 
                type="range" min="10" max="500" step="10"
                value={climbSpeed}
                onChange={(e) => setSettings({ climbSpeed: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>
          </div>
        )}

        {/* Interactive Manual Flight Cockpit */}
        <div className="flex flex-col gap-3 border-t border-white/10 pt-5 mb-5">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-mono">Manual Flight Controls</span>
          
          <div className="flex justify-between gap-4">
            {/* Left Pad (Altitude / Rotation) */}
            <div className="flex-1 flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-3">
              <span className="text-[8px] font-bold uppercase text-blue-400 mb-2 tracking-wider">Alt & Yaw</span>
              <div className="grid grid-cols-3 gap-2 w-28 h-28 relative">
                {/* Climb Up */}
                <button
                  onMouseDown={() => startManualInput('ALT_UP')}
                  onMouseUp={() => handleControlEnd('ALT_UP')}
                  onTouchStart={() => startManualInput('ALT_UP')}
                  onTouchEnd={() => handleControlEnd('ALT_UP')}
                  className="col-start-2 col-span-1 p-2 bg-blue-500/10 hover:bg-blue-500/25 active:bg-blue-500/40 text-blue-400 border border-blue-500/20 rounded-lg flex items-center justify-center transition-all"
                >
                  <ArrowUp size={16} />
                </button>
                {/* Turn Left */}
                <button
                  onMouseDown={() => startManualInput('YAW_LEFT')}
                  onMouseUp={() => handleControlEnd('YAW_LEFT')}
                  onTouchStart={() => startManualInput('YAW_LEFT')}
                  onTouchEnd={() => handleControlEnd('YAW_LEFT')}
                  className="col-start-1 row-start-2 p-2 bg-blue-500/10 hover:bg-blue-500/25 active:bg-blue-500/40 text-blue-400 border border-blue-500/20 rounded-lg flex items-center justify-center transition-all"
                >
                  <RotateCcw size={16} />
                </button>
                {/* Center marker */}
                <div className="col-start-2 row-start-2 flex items-center justify-center text-blue-500/30">
                  <Compass size={14} className="animate-spin" style={{ animationDuration: '12s' }} />
                </div>
                {/* Turn Right */}
                <button
                  onMouseDown={() => startManualInput('YAW_RIGHT')}
                  onMouseUp={() => handleControlEnd('YAW_RIGHT')}
                  onTouchStart={() => startManualInput('YAW_RIGHT')}
                  onTouchEnd={() => handleControlEnd('YAW_RIGHT')}
                  className="col-start-3 row-start-2 p-2 bg-blue-500/10 hover:bg-blue-500/25 active:bg-blue-500/40 text-blue-400 border border-blue-500/20 rounded-lg flex items-center justify-center transition-all"
                >
                  <RotateCw size={16} />
                </button>
                {/* Climb Down */}
                <button
                  onMouseDown={() => startManualInput('ALT_DOWN')}
                  onMouseUp={() => handleControlEnd('ALT_DOWN')}
                  onTouchStart={() => startManualInput('ALT_DOWN')}
                  onTouchEnd={() => handleControlEnd('ALT_DOWN')}
                  className="col-start-2 row-start-3 p-2 bg-blue-500/10 hover:bg-blue-500/25 active:bg-blue-500/40 text-blue-400 border border-blue-500/20 rounded-lg flex items-center justify-center transition-all"
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            </div>

            {/* Right Pad (Directional Thrust) */}
            <div className="flex-1 flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-3">
              <span className="text-[8px] font-bold uppercase text-agri-neon mb-2 tracking-wider">Pitch & Roll</span>
              <div className="grid grid-cols-3 gap-2 w-28 h-28 relative">
                {/* Pitch Forward */}
                <button
                  onMouseDown={() => startManualInput('PITCH_FORWARD')}
                  onMouseUp={() => handleControlEnd('PITCH_FORWARD')}
                  onTouchStart={() => startManualInput('PITCH_FORWARD')}
                  onTouchEnd={() => handleControlEnd('PITCH_FORWARD')}
                  className="col-start-2 col-span-1 p-2 bg-agri-neon/10 hover:bg-agri-neon/25 active:bg-agri-neon/40 text-agri-neon border border-agri-neon/20 rounded-lg flex items-center justify-center transition-all"
                >
                  <ArrowUp size={16} />
                </button>
                {/* Roll Left */}
                <button
                  onMouseDown={() => startManualInput('ROLL_LEFT')}
                  onMouseUp={() => handleControlEnd('ROLL_LEFT')}
                  onTouchStart={() => startManualInput('ROLL_LEFT')}
                  onTouchEnd={() => handleControlEnd('ROLL_LEFT')}
                  className="col-start-1 row-start-2 p-2 bg-agri-neon/10 hover:bg-agri-neon/25 active:bg-agri-neon/40 text-agri-neon border border-agri-neon/20 rounded-lg flex items-center justify-center transition-all"
                >
                  <ArrowLeft size={16} />
                </button>
                {/* Center marker */}
                <div className="col-start-2 row-start-2 flex items-center justify-center text-agri-neon/30">
                  <Compass size={14} />
                </div>
                {/* Roll Right */}
                <button
                  onMouseDown={() => startManualInput('ROLL_RIGHT')}
                  onMouseUp={() => handleControlEnd('ROLL_RIGHT')}
                  onTouchStart={() => startManualInput('ROLL_RIGHT')}
                  onTouchEnd={() => handleControlEnd('ROLL_RIGHT')}
                  className="col-start-3 row-start-2 p-2 bg-agri-neon/10 hover:bg-agri-neon/25 active:bg-agri-neon/40 text-agri-neon border border-agri-neon/20 rounded-lg flex items-center justify-center transition-all"
                >
                  <ArrowRight size={16} />
                </button>
                {/* Pitch Back */}
                <button
                  onMouseDown={() => startManualInput('PITCH_BACK')}
                  onMouseUp={() => handleControlEnd('PITCH_BACK')}
                  onTouchStart={() => startManualInput('PITCH_BACK')}
                  onTouchEnd={() => handleControlEnd('PITCH_BACK')}
                  className="col-start-2 row-start-3 p-2 bg-agri-neon/10 hover:bg-agri-neon/25 active:bg-agri-neon/40 text-agri-neon border border-agri-neon/20 rounded-lg flex items-center justify-center transition-all"
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            </div>
          </div>
          <span className="text-[8px] text-gray-500 italic text-center">Click/Tap & Hold to fly, or use WASD + Space/Shift + Arrows</span>
        </div>

      </div>
    </>
  )
}
