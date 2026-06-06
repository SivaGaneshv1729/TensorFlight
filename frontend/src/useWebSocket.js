import { useEffect, useRef } from 'react'
import useTelemetryStore from './store/useTelemetryStore'

export default function useWebSocket() {
  const setTelemetry = useTelemetryStore((state) => state.setTelemetry)
  const socketRef = useRef(null)
  const reconnectCount = useRef(0)

  useEffect(() => {
    let timeoutId;
    
    function connect() {
      const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      console.log(`🔌 Attempting WebSocket connection to ${host}:8000...`);
      
      const socket = new WebSocket(`ws://${host}:8000/ws/telemetry`)
      socketRef.current = socket

      socket.onopen = () => {
        console.log('✅ WebSocket Connected Successfully');
        reconnectCount.current = 0; // Reset count on successful connection
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setTelemetry(data)
        } catch (err) {
          console.error('Failed to parse telemetry data:', err)
        }
      }

      socket.onerror = (error) => {
        console.error('WebSocket Error:', error)
      }

      socket.onclose = () => {
        const backoff = Math.min(1000 * Math.pow(2, reconnectCount.current), 30000);
        console.warn(`❌ WebSocket disconnected. Reconnecting in ${backoff / 1000}s...`);
        
        timeoutId = setTimeout(() => {
          reconnectCount.current++;
          connect();
        }, backoff);
      }
    }

    connect()

    return () => {
      if (socketRef.current) {
        socketRef.current.onclose = null // Prevent reconnect on unmount
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close()
        }
      }
      clearTimeout(timeoutId)
    }
  }, [setTelemetry])
}
