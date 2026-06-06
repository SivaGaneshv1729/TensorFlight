import React from 'react'

export default function VideoContainer() {
  return (
    <div className="w-full h-full bg-zinc-900 flex items-center justify-center relative overflow-hidden">
      {/* Placeholder for RTSP/WebSocket Video Stream */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
      <div className="text-white/20 font-bold text-4xl uppercase tracking-[1em] rotate-12">
        Live Stream Feed
      </div>
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  )
}
