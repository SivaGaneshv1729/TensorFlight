import { useEffect } from 'react'
import axios from 'axios'

export default function useKeyboardControls() {
  useEffect(() => {
    const keys = {}
    
    const handleKeyDown = (e) => {
      keys[e.code] = true
    }
    
    const handleKeyUp = (e) => {
      keys[e.code] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    let lastCommands = []

    const interval = setInterval(async () => {
      const activeCommands = []
      
      if (keys['KeyW']) activeCommands.push('PITCH_FORWARD')
      if (keys['KeyS']) activeCommands.push('PITCH_BACK')
      if (keys['KeyA']) activeCommands.push('ROLL_LEFT')
      if (keys['KeyD']) activeCommands.push('ROLL_RIGHT')
      if (keys['ArrowUp']) activeCommands.push('ALT_UP')
      if (keys['ArrowDown']) activeCommands.push('ALT_DOWN')
      if (keys['ArrowLeft']) activeCommands.push('YAW_LEFT')
      if (keys['ArrowRight']) activeCommands.push('YAW_RIGHT')

      // Only send if commands have changed OR we have active inputs
      if (activeCommands.length > 0 || lastCommands.length > 0) {
        lastCommands = [...activeCommands]
        try {
          await axios.post('/api/command', { 
            action: 'MANUAL_CONTROL', 
            params: { inputs: activeCommands } 
          })
        } catch (err) {}
      }
    }, 50) // Faster 20Hz loop for smoothness

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      clearInterval(interval)
    }
  }, [])
}
