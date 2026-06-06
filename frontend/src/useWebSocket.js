import { useEffect, useRef } from 'react'
import useTelemetryStore from './store/useTelemetryStore'

export default function useWebSocket() {
  const setTelemetry = useTelemetryStore((state) => state.setTelemetry)
  const socketRef = useRef(null)

  useEffect(() => {
    let timeoutId;
    
    function connect() {
      const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      console.log(`🔌 Attempting WebSocket connection to ${host}:8000...`);
      const socket = new WebSocket(`ws://${host}:8000/ws/telemetry`)
      socketRef.current = socket

      socket.onopen = () => {
        console.log('✅ WebSocket Connected Successfully');
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setTelemetry(data)
      }

      socket.onerror = (error) => {
        console.error('WebSocket Error:', error)
      }

      socket.onclose = () => {
        console.warn('❌ WebSocket disconnected. Reconnecting in 2s...');
        timeoutId = setTimeout(connect, 2000)
      }
    }

    connect()

    return () => {
      if (socketRef.current) {
        socketRef.current.onclose = null // Prevent reconnect on unmount
        socketRef.current.close()
      }
      clearTimeout(timeoutId)
    }
  }, [setTelemetry])
}
