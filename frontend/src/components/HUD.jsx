import React, { useState, useEffect } from 'react'
import useTelemetryStore from '../store/useTelemetryStore'

export default function HUD() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const orientation = telemetry?.drone_state?.orientation_deg ?? { pitch: 0, roll: 0, yaw_heading: 0 }
  const heading = orientation.yaw_heading

  const [fps, setFps] = useState(59.9)
  const [timecode, setTimecode] = useState(0)

  useEffect(() => {
    const fpsInterval = setInterval(() => {
      setFps(58 + Math.random() * 2)
    }, 500)
    
    const timeInterval = setInterval(() => {
      setTimecode(t => t + 1)
    }, 1000)

    return () => {
      clearInterval(fpsInterval)
      clearInterval(timeInterval)
    }
  }, [])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="absolute inset-0 p-4 font-sans pointer-events-none flex flex-col justify-between z-20">
      
      {/* Top Overlays */}
      <div className="flex justify-between items-start">
         <div className="flex flex-col gap-2">
            <div className="bg-black/60 backdrop-blur-md rounded-md flex items-center gap-2 px-4 py-2 border border-white/10 w-fit">
               <div className="w-2 h-2 rounded-full bg-red-500" />
               <span className="text-white text-xs font-bold uppercase tracking-wider">HDR</span>
            </div>
            <div className="text-agri-primary font-bold text-sm">
               4K <span className="text-white font-normal">- {fps.toFixed(2)} FPS</span>
            </div>
         </div>

         <div className="bg-black/60 backdrop-blur-md rounded-md flex items-center gap-4 px-4 py-2 border border-white/10">
            <div className="w-1 h-3 bg-white/80 flex items-center gap-1">
               <div className="w-1 h-3 bg-white/80" />
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               <span className="text-white text-xs font-mono">{formatTime(timecode)}</span>
            </div>
         </div>
      </div>

      {/* Center Crosshair & Level */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         {/* Simple crosshair */}
         <div className="w-16 h-px bg-white/80 absolute -ml-24" />
         <div className="w-16 h-px bg-white/80 absolute ml-24" />
         <div className="w-px h-16 bg-white/80 absolute mb-24 dashed" style={{ borderLeft: '1px dashed rgba(255,255,255,0.8)' }} />
         <div className="w-px h-16 bg-white/80 absolute mt-24 dashed" style={{ borderLeft: '1px dashed rgba(255,255,255,0.8)' }} />
         <div className="w-4 h-4 rounded-full bg-white/80 border-[3px] border-black/50" />
      </div>

      <div className="absolute top-1/3 left-4 flex flex-col gap-1 w-32">
         <span className="text-white font-medium text-xs">Level</span>
         <div className="h-0.5 bg-gray-500/50 w-full relative">
            <div className="absolute left-0 top-0 h-full w-1/3 bg-agri-primary" />
         </div>
         <div className="mt-2 w-10 h-8 border border-white/50 rounded-md flex items-center justify-center text-white text-xs font-bold">KT</div>
      </div>

      {/* Bottom Overlays */}
      <div className="flex justify-between items-end">
         
         <div className="flex flex-col gap-4">
            {/* Color picker buttons */}
            <div className="grid grid-cols-2 gap-2">
               <div className="bg-black/60 rounded-md px-4 py-2 flex items-center gap-2 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-white text-xs font-bold">R</span>
               </div>
               <div className="bg-black/60 rounded-md px-4 py-2 flex items-center gap-2 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-agri-secondary" />
                  <span className="text-white text-xs font-bold">G</span>
               </div>
               <div className="bg-black/60 rounded-md px-4 py-2 flex items-center gap-2 border border-white/10 border-indigo-500/50 shadow-[inset_0_0_10px_rgba(99,102,241,0.3)]">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-white text-xs font-bold">B</span>
               </div>
               <div className="bg-black/60 rounded-md px-4 py-2 flex items-center gap-2 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-white text-xs font-bold">Y</span>
               </div>
            </div>

            {/* Histogram (mock) */}
            <div className="w-40 h-20 bg-black/40 border border-white/20 rounded-sm relative flex flex-col justify-end p-1">
               <span className="absolute top-1 left-2 text-white text-xs font-bold">H2.85</span>
               <div className="flex items-end h-1/2 w-full gap-[1px]">
                  {[...Array(40)].map((_, i) => (
                    <div key={i} className={`flex-1 ${i > 10 && i < 18 ? 'bg-agri-primary' : 'bg-white/70'}`} style={{ height: `${Math.max(10, Math.random() * 100)}%` }} />
                  ))}
               </div>
            </div>
         </div>

         {/* Compass */}
         <div className="w-24 h-24 rounded-full bg-[#1c1d21]/80 backdrop-blur-md border-[4px] border-[#2a2c31] relative flex items-center justify-center">
            {/* Tick marks would go here */}
            <div className="absolute inset-1 rounded-full border border-dashed border-gray-500/50" />
            <div className="absolute top-1 w-1 h-3 bg-agri-primary z-10" />
            <div className="flex flex-col items-center leading-tight">
               <span className="text-agri-primary font-bold text-sm">{heading.toFixed(0)}°</span>
               <span className="text-white font-bold text-xs">NW</span>
            </div>
         </div>

      </div>

    </div>
  )
}
