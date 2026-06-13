import { useEffect } from 'react'
import useTelemetryStore from './store/useTelemetryStore'
import { sendSocketMessage } from './useWebSocket'

export default function useKeyboardControls() {
  const { forwardSpeed, climbSpeed } = useTelemetryStore((state) => state.settings)

  useEffect(() => {
    const activeKeys = new Set()
    
    const sendInputs = () => {
      const activeCommands = []
      if (activeKeys.has('KeyW')) activeCommands.push('PITCH_FORWARD')
      if (activeKeys.has('KeyS')) activeCommands.push('PITCH_BACK')
      if (activeKeys.has('KeyA')) activeCommands.push('ROLL_LEFT')
      if (activeKeys.has('KeyD')) activeCommands.push('ROLL_RIGHT')
      if (activeKeys.has('ArrowUp') || activeKeys.has('Space')) activeCommands.push('ALT_UP')
      if (activeKeys.has('ArrowDown') || activeKeys.has('ShiftLeft')) activeCommands.push('ALT_DOWN')
      if (activeKeys.has('ArrowLeft') || activeKeys.has('KeyQ')) activeCommands.push('YAW_LEFT')
      if (activeKeys.has('ArrowRight') || activeKeys.has('KeyE')) activeCommands.push('YAW_RIGHT')

      sendSocketMessage({ 
        action: 'MANUAL_CONTROL', 
        params: { 
          inputs: activeCommands,
          forward_speed: forwardSpeed,
          climb_speed: climbSpeed
        } 
      })
    }
    
    const handleKeyDown = (e) => {
      if (e.repeat) return // Prevent duplicate events when key is held down
      
      const targetKeys = [
        'KeyW', 'KeyS', 'KeyA', 'KeyD', 
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
        'Space', 'ShiftLeft', 'KeyQ', 'KeyE'
      ]
      if (targetKeys.includes(e.code)) {
        activeKeys.add(e.code)
        sendInputs()
      }
    }
    
    const handleKeyUp = (e) => {
      const targetKeys = [
        'KeyW', 'KeyS', 'KeyA', 'KeyD', 
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
        'Space', 'ShiftLeft', 'KeyQ', 'KeyE'
      ]
      if (targetKeys.includes(e.code)) {
        activeKeys.delete(e.code)
        sendInputs()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [forwardSpeed, climbSpeed])
}
