import React, { useState } from 'react'

export default function VideoContainer() {
  const [mode, setMode] = useState('normal'); // 'normal' or 'vari'
  const streamUrl = `/api/video/stream?mode=${mode}`;

  return (
    <div className="w-full h-full bg-zinc-900 flex items-center justify-center relative overflow-hidden">
      {/* Real Video Stream Feed */}
      <img 
        src={streamUrl} 
        alt="Live Drone Feed" 
        className="w-full h-full object-cover grayscale-[20%] contrast-125"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />

      {/* Fallback/Overlay if stream fails */}
      <div className="hidden absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-20">
        <div className="text-white/20 font-bold text-4xl uppercase tracking-[1em] rotate-12 mb-4">
          No Video Signal
        </div>
        <div className="text-agri-neon text-xs font-mono animate-pulse">
          CHECK CONNECTION / CAMERA STATUS
        </div>
      </div>
      
      {/* Background Video Stream Placeholder Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

      {/* Mode Toggle (Floating Button) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-4 pointer-events-auto">
        <button 
          onClick={() => setMode('normal')}
          className={`px-4 py-1 text-[10px] font-bold tracking-widest uppercase border transition-all ${mode === 'normal' ? 'bg-white text-black border-white' : 'text-white/40 border-white/20 hover:border-white/60'}`}
        >
          Normal
        </button>
        <button 
          onClick={() => setMode('vari')}
          className={`px-4 py-1 text-[10px] font-bold tracking-widest uppercase border transition-all ${mode === 'vari' ? 'bg-agri-neon text-black border-agri-neon shadow-[0_0_10px_#39FF14]' : 'text-agri-neon/40 border-agri-neon/20 hover:border-agri-neon/60'}`}
        >
          VARI (Health)
        </button>
      </div>
    </div>
  )
}
