import { useEffect } from 'react'
import useTelemetryStore from './store/useTelemetryStore'

export default function useWebSocket() {
  const setTelemetry = useTelemetryStore((state) => state.setTelemetry)

  useEffect(() => {
    const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    console.log(`🔌 Attempting WebSocket connection to ${host}:8000...`);
    const socket = new WebSocket(`ws://${host}:8000/ws/telemetry`)

    socket.onopen = () => {
      console.log('✅ WebSocket Connected Successfully');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('🛰️ WebSocket Received:', data); // Debug log
      setTelemetry(data)
    }

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error)
    }

    return () => {
      socket.close()
    }
  }, [setTelemetry])
}
