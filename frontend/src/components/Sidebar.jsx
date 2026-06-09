import React, { useState } from 'react'
import { Settings as SettingsIcon, Map as MapIcon, Activity, ShieldAlert, Play, Square, Home, FastForward, ArrowUpCircle, X } from 'lucide-react'
import axios from 'axios'
import useTelemetryStore from '../store/useTelemetryStore'
import MapView from './MapView'

export default function Sidebar() {
  const { forwardSpeed, climbSpeed } = useTelemetryStore((state) => state.settings)
  const setSettings = useTelemetryStore((state) => state.setSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [showMap, setShowMap] = useState(false)

  const sendCommand = async (action) => {
    try {
      await axios.post('/api/command', { action })
    } catch (err) {
      console.error('Failed to send command:', err)
    }
  }

  return (
    <>
      <div className="w-24 bg-black/60 backdrop-blur-md border-l border-white/10 h-full flex flex-col items-center py-8 gap-6 pointer-events-auto overflow-y-auto no-scrollbar">
        <button 
          onClick={() => sendCommand('ARM')}
          className="p-3 text-agri-neon hover:bg-agri-neon/10 rounded-xl transition-colors group relative"
        >
          <Play size={24} />
          <span className="absolute left-[-80px] bg-black text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">ARM</span>
        </button>

        <button 
          onClick={() => sendCommand('DISARM')}
          className="p-3 text-orange-500 hover:bg-orange-500/10 rounded-xl transition-colors group relative"
        >
          <Square size={24} />
          <span className="absolute left-[-80px] bg-black text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">DISARM</span>
        </button>

        <button 
          onClick={() => sendCommand('RTL')}
          className="p-3 text-blue-400 hover:bg-blue-400/10 rounded-xl transition-colors group relative"
        >
          <Home size={24} />
          <span className="absolute left-[-80px] bg-black text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">RETURN</span>
        </button>

        <div className="w-10 h-[1px] bg-white/10" />

        <button 
          onClick={() => { setShowMap(!showMap); setShowSettings(false); }}
          className={`p-3 rounded-xl transition-colors ${showMap ? 'text-agri-gold bg-agri-gold/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <MapIcon size={24} />
        </button>
        <button 
          onClick={() => { setShowSettings(!showSettings); setShowMap(false); }}
          className={`p-3 rounded-xl transition-colors ${showSettings ? 'text-agri-neon bg-agri-neon/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <SettingsIcon size={24} />
        </button>
        
        <div className="mt-auto">
          <button 
            onClick={() => sendCommand('EMERGENCY_STOP')}
            className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <ShieldAlert size={24} />
          </button>
        </div>
      </div>

      {/* Map Modal/Overlay */}
      {showMap && <MapView onClose={() => setShowMap(false)} />}

      {/* Settings Modal/Overlay */}
      {showSettings && (
        <div className="absolute right-28 top-1/2 -translate-y-1/2 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-agri-neon font-bold uppercase tracking-wider text-sm flex items-center gap-2">
              <SettingsIcon size={16} /> Flight Settings
            </h3>
            <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400 uppercase">Forward Speed</span>
                <span className="text-agri-neon">{forwardSpeed}</span>
              </div>
              <input 
                type="range" min="10" max="500" step="10"
                value={forwardSpeed}
                onChange={(e) => setSettings({ forwardSpeed: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-agri-neon"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400 uppercase">Climb Speed</span>
                <span className="text-blue-400">{climbSpeed}</span>
              </div>
              <input 
                type="range" min="10" max="500" step="10"
                value={climbSpeed}
                onChange={(e) => setSettings({ climbSpeed: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 text-[10px] text-gray-500 italic">
            Speed values are mapped to MAVLink normalized units (0-500).
          </div>
        </div>
      )}
    </>
  )
}
