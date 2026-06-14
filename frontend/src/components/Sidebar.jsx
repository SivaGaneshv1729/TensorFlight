import React, { useState, useRef } from 'react'
import { Settings as SettingsIcon, Satellite, ShieldAlert, Play, Square, Home, Compass, Eye, ShieldCheck, Target, Wind, Battery, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, RotateCcw } from 'lucide-react'
import axios from 'axios'
import useTelemetryStore from '../store/useTelemetryStore'
import { sendSocketMessage } from '../useWebSocket'

export default function Sidebar() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const isConnected = telemetry.is_connected
  const isArmed = telemetry.is_active
  const battery = telemetry.drone_state.battery_percentage || 0
  const altitude = telemetry.drone_state.gps.altitude_relative_m || 0
  const heading = telemetry.drone_state.orientation_deg.yaw_heading || 0
  const pitch = telemetry.drone_state.orientation_deg.pitch || 0
  const roll = telemetry.drone_state.orientation_deg.roll || 0
  const aiAnalysis = telemetry.ai_analysis || {
    weed_count: 0,
    pest_stressed_count: 0,
    collision_warning: false,
    safe_flight_radius_m: 300,
    wind_speed_mps: 0,
    wind_dir_deg: 0
  }

  const { forwardSpeed, climbSpeed } = useTelemetryStore((state) => state.settings)
  const setSettings = useTelemetryStore((state) => state.setSettings)
  const showMap = useTelemetryStore((state) => state.showMap)
  const setShowMap = useTelemetryStore((state) => state.setShowMap)
  const cameraMode = useTelemetryStore((state) => state.cameraMode)
  const setCameraMode = useTelemetryStore((state) => state.setCameraMode)
  const setActiveCommands = useTelemetryStore((state) => state.setActiveCommands)

  const [showSettings, setShowSettings] = useState(false)
  const activeInputsRef = useRef(new Set())

  const sendCommand = async (action) => {
    try {
      await axios.post('/api/command', { action })
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

  return (
    <>
      <div className="w-96 bg-black/85 backdrop-blur-xl border-l border-white/10 h-full flex flex-col py-6 px-5 pointer-events-auto overflow-y-auto no-scrollbar shadow-2xl z-30 select-none">
        
        {/* Header Section */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-mono">Flight Terminal</span>
            <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="text-agri-gold animate-spin" style={{ animationDuration: '8s' }} size={16} /> 
              AGRI-GCS COCKPIT
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-agri-neon animate-pulse shadow-[0_0_8px_#39ff14]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${isConnected ? 'text-agri-neon' : 'text-red-500'}`}>
              {isConnected ? 'Link: OK' : 'No Link'}
            </span>
          </div>
        </div>

        {/* Dashboard Readouts */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Altitude */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[9px] text-gray-500 uppercase font-mono font-semibold">Altitude</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white">{altitude.toFixed(1)}</span>
              <span className="text-xs text-gray-400 font-mono">m</span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded overflow-hidden">
              <div className="bg-blue-400 h-full transition-all duration-300" style={{ width: `${Math.min(100, (altitude / 50) * 100)}%` }} />
            </div>
          </div>

          {/* Battery */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-gray-500 uppercase font-mono font-semibold">Battery</span>
              <Battery size={12} className={battery <= 20 ? 'text-red-500 animate-pulse' : 'text-agri-neon'} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold font-mono ${battery <= 20 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{battery}</span>
              <span className="text-xs text-gray-400 font-mono">%</span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded overflow-hidden">
              <div className={`h-full transition-all duration-300 ${battery <= 20 ? 'bg-red-500' : 'bg-agri-neon'}`} style={{ width: `${battery}%` }} />
            </div>
          </div>

          {/* Wind Speed */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-gray-500 uppercase font-mono font-semibold">Wind Vector</span>
              <Wind size={12} className="text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-white">{aiAnalysis.wind_speed_mps.toFixed(1)}</span>
              <span className="text-[10px] text-gray-400 font-mono">m/s</span>
            </div>
            <span className="text-[9px] text-gray-400 font-mono">Dir: {aiAnalysis.wind_dir_deg.toFixed(0)}°</span>
          </div>

          {/* Safe Radius */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-gray-500 uppercase font-mono font-semibold">Flight Radius</span>
              <div className="w-2 h-2 rounded-full bg-agri-gold animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-white">{aiAnalysis.safe_flight_radius_m.toFixed(0)}</span>
              <span className="text-[10px] text-gray-400 font-mono">m</span>
            </div>
            <span className="text-[9px] text-gray-400 font-mono">Max safe return limit</span>
          </div>
        </div>

        {/* Flight Presets / Commands */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <button 
            onClick={() => sendCommand('ARM')}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${isArmed ? 'bg-agri-neon/10 text-agri-neon border-agri-neon/30 shadow-[0_0_8px_rgba(57,255,20,0.2)]' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}
          >
            <Play size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Arm</span>
          </button>

          <button 
            onClick={() => sendCommand('DISARM')}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${!isArmed ? 'bg-white/5 text-gray-500 border-white/5' : 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'}`}
          >
            <Square size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Disarm</span>
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

        {/* Unified Diagnostics & Filter Dashboard */}
        <div className="flex flex-col gap-3 border-t border-white/10 pt-5 mt-auto">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-mono">Vision & Diagnostics</span>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/10 text-[11px]">
              <span className="text-gray-400 font-mono">Weeds Identified:</span>
              <span className="font-mono text-agri-neon font-bold flex items-center gap-1">
                <Target size={12} className="animate-pulse" />
                {aiAnalysis.weed_count}
              </span>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/10 text-[11px]">
              <span className="text-gray-400 font-mono">Stress/Pests Alert:</span>
              <span className={`font-mono font-bold flex items-center gap-1 ${aiAnalysis.pest_stressed_count > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                <ShieldAlert size={12} />
                {aiAnalysis.pest_stressed_count}
              </span>
            </div>

            <div className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-colors ${aiAnalysis.collision_warning ? 'bg-red-950/40 border-red-500/50 text-red-500 animate-pulse' : 'bg-green-950/20 border-green-500/20 text-agri-neon'}`}>
              <span className="font-mono">Collision Shield:</span>
              <span className="flex items-center gap-1 font-mono">
                {aiAnalysis.collision_warning ? 'BRAKING' : 'SHIELD SAFE'}
              </span>
            </div>

            {/* VARI Camera Filter Selector */}
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                <span>Vegetation Health Index</span>
                <Eye size={12} className={cameraMode === 'vari' ? 'text-agri-neon animate-pulse' : 'text-gray-400'} />
              </div>
              <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setCameraMode('normal')}
                  className={`flex-1 text-[9px] font-bold uppercase py-1.5 rounded-lg transition-all text-center ${cameraMode === 'normal' ? 'bg-white text-black' : 'text-white/40 hover:text-white/80'}`}
                >
                  RGB Normal
                </button>
                <button
                  onClick={() => setCameraMode('vari')}
                  className={`flex-1 text-[9px] font-bold uppercase py-1.5 rounded-lg transition-all text-center ${cameraMode === 'vari' ? 'bg-agri-neon text-black shadow-[0_0_8px_#39FF14]' : 'text-agri-neon/40 hover:text-agri-neon/80'}`}
                >
                  VARI index
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
