import React from 'react'
import { Settings, Map, Activity, ShieldAlert, Play, Square, Home } from 'lucide-react'
import axios from 'axios'

export default function Sidebar() {
  const sendCommand = async (action) => {
    try {
      await axios.post('/api/command', { action })
    } catch (err) {
      console.error('Failed to send command:', err)
    }
  }

  return (
    <div className="w-20 bg-black/60 backdrop-blur-md border-l border-white/10 h-full flex flex-col items-center py-8 gap-8 pointer-events-auto">
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

      <button className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
        <Map size={24} />
      </button>
      <button className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
        <Settings size={24} />
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
  )
}
