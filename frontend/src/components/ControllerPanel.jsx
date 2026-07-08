import React, { useRef } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import useTelemetryStore from '../store/useTelemetryStore'
import { sendSocketMessage } from '../useWebSocket'

function DPad({ label, commands, onStart, onEnd }) {
  // commands: { up, down, left, right }
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</span>
      <div className="relative w-28 h-28">
        {/* Up */}
        <button
          onMouseDown={() => onStart(commands.up)}
          onMouseUp={() => onEnd(commands.up)}
          onMouseLeave={() => onEnd(commands.up)}
          onTouchStart={(e) => { e.preventDefault(); onStart(commands.up) }}
          onTouchEnd={() => onEnd(commands.up)}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-9 bg-gray-700/50 hover:bg-agri-primary/30 active:bg-agri-primary border border-gray-600 rounded-md flex items-center justify-center text-gray-400 hover:text-white transition-all select-none touch-none"
        >
          <ChevronUp size={18} />
        </button>
        {/* Down */}
        <button
          onMouseDown={() => onStart(commands.down)}
          onMouseUp={() => onEnd(commands.down)}
          onMouseLeave={() => onEnd(commands.down)}
          onTouchStart={(e) => { e.preventDefault(); onStart(commands.down) }}
          onTouchEnd={() => onEnd(commands.down)}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-9 h-9 bg-gray-700/50 hover:bg-agri-primary/30 active:bg-agri-primary border border-gray-600 rounded-md flex items-center justify-center text-gray-400 hover:text-white transition-all select-none touch-none"
        >
          <ChevronDown size={18} />
        </button>
        {/* Left */}
        <button
          onMouseDown={() => onStart(commands.left)}
          onMouseUp={() => onEnd(commands.left)}
          onMouseLeave={() => onEnd(commands.left)}
          onTouchStart={(e) => { e.preventDefault(); onStart(commands.left) }}
          onTouchEnd={() => onEnd(commands.left)}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-700/50 hover:bg-agri-primary/30 active:bg-agri-primary border border-gray-600 rounded-md flex items-center justify-center text-gray-400 hover:text-white transition-all select-none touch-none"
        >
          <ChevronLeft size={18} />
        </button>
        {/* Right */}
        <button
          onMouseDown={() => onStart(commands.right)}
          onMouseUp={() => onEnd(commands.right)}
          onMouseLeave={() => onEnd(commands.right)}
          onTouchStart={(e) => { e.preventDefault(); onStart(commands.right) }}
          onTouchEnd={() => onEnd(commands.right)}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-700/50 hover:bg-agri-primary/30 active:bg-agri-primary border border-gray-600 rounded-md flex items-center justify-center text-gray-400 hover:text-white transition-all select-none touch-none"
        >
          <ChevronRight size={18} />
        </button>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-3 h-3 rounded-full bg-gray-600/50 border border-gray-500/50" />
        </div>
      </div>
    </div>
  )
}

export default function ControllerPanel() {
  const activeDroneId = useTelemetryStore((state) => state.activeDroneId)
  const { forwardSpeed, climbSpeed } = useTelemetryStore((state) => state.settings)
  const setActiveCommands = useTelemetryStore((state) => state.setActiveCommands)
  
  const activeInputsRef = useRef(new Set())

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
    <div className="h-full flex flex-col font-sans min-h-0 gap-3 items-center justify-center">
      
      <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest self-start">Manual Override</div>
      
      {/* Dual D-Pad Layout */}
      <div className="flex gap-4 items-center justify-center flex-1 w-full">
        {/* Left D-Pad: Throttle + Yaw */}
        <DPad
          label="Throttle / Yaw"
          commands={{ up: 'ALT_UP', down: 'ALT_DOWN', left: 'YAW_LEFT', right: 'YAW_RIGHT' }}
          onStart={handleControlStart}
          onEnd={handleControlEnd}
        />

        {/* Divider */}
        <div className="h-16 w-px bg-gray-700/50 shrink-0" />

        {/* Right D-Pad: Pitch + Roll */}
        <DPad
          label="Pitch / Roll"
          commands={{ up: 'PITCH_FORWARD', down: 'PITCH_BACK', left: 'ROLL_LEFT', right: 'ROLL_RIGHT' }}
          onStart={handleControlStart}
          onEnd={handleControlEnd}
        />
      </div>

      {/* Keyboard shortcut reference */}
      <div className="w-full bg-black/20 border border-gray-700/40 rounded-md p-2 shrink-0">
        <div className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mb-1.5">Keyboard Shortcuts</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          {[
            ['W / S', 'Pitch Fwd/Back'],
            ['A / D', 'Roll L/R'],
            ['Q / E', 'Yaw L/R'],
            ['Space / Shift', 'Altitude'],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono bg-gray-700 px-1 rounded text-white/70 shrink-0">{key}</span>
              <span className="text-[8px] text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
