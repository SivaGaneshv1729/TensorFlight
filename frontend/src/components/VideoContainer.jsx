import React, { useState } from 'react'
import useTelemetryStore from '../store/useTelemetryStore'

export default function VideoContainer() {
  const cameraMode = useTelemetryStore((state) => state.cameraMode)
  const setCameraMode = useTelemetryStore((state) => state.setCameraMode)
  const [hasError, setHasError] = useState(false);
  const streamUrl = `/api/video/stream?mode=${cameraMode}`;

  const handleModeChange = (newMode) => {
    setCameraMode(newMode);
    setHasError(false); // Reset error state on mode change
  };

  return (
    <div className="w-full h-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Real Video Stream Feed */}
      {!hasError ? (
        <img 
          src={streamUrl} 
          alt="Live Drone Feed" 
          className="w-full h-full object-contain grayscale-[10%] contrast-110"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-20">
          <div className="text-white/20 font-bold text-4xl uppercase tracking-wider tracking-[1em] rotate-12 mb-4">
            No Video Signal
          </div>
          <div className="text-agri-neon text-xs font-mono tracking-wide animate-pulse mb-8">
            CHECK CONNECTION / CAMERA STATUS
          </div>
          <button 
            onClick={() => setHasError(false)}
            className="px-6 py-2 border border-agri-neon text-agri-neon text-xs hover:bg-agri-neon hover:text-black transition-all"
          >
            RETRY CONNECTION
          </button>
        </div>
      )}
      
      {/* Background Video Stream Placeholder Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

      {/* Mode Toggle (Floating Button) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-4 pointer-events-auto">
        <button 
          onClick={() => handleModeChange('normal')}
          className={`px-4 py-1 text-[10px] font-bold tracking-widest uppercase tracking-wider border transition-all ${cameraMode === 'normal' ? 'bg-white text-black border-white' : 'text-white/40 border-white/20 hover:border-white/60'}`}
        >
          Normal
        </button>
        <button 
          onClick={() => handleModeChange('vari')}
          className={`px-4 py-1 text-[10px] font-bold tracking-widest uppercase tracking-wider border transition-all ${cameraMode === 'vari' ? 'bg-agri-neon text-black border-agri-neon shadow-[0_0_10px_#39FF14]' : 'text-agri-neon/40 border-agri-neon/20 hover:border-agri-neon/60'}`}
        >
          VARI (Health)
        </button>
      </div>
    </div>
  )
}
