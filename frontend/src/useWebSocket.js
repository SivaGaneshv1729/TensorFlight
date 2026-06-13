import { useEffect, useRef } from 'react'
import useTelemetryStore from './store/useTelemetryStore'

let globalSocket = null;

export function sendSocketMessage(message) {
  if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
    globalSocket.send(JSON.stringify(message));
    return true;
  }
  return false;
}

export default function useWebSocket() {
  const setTelemetry = useTelemetryStore((state) => state.setTelemetry)
  const socketRef = useRef(null)
  const reconnectCount = useRef(0)

  useEffect(() => {
    let timeoutId;
    
    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${protocol}://${window.location.host}/ws/telemetry`;
      console.log(`🔌 Attempting WebSocket connection to ${url}...`);
      
      const socket = new WebSocket(url)
      socketRef.current = socket
      globalSocket = socket
      
      socket.onopen = () => {
        console.log('✅ WebSocket Connected Successfully to:', url);
        reconnectCount.current = 0; // Reset count on successful connection
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          // console.debug('📡 Telemetry data received', data);
          setTelemetry(data)
        } catch (err) {
          console.error('Failed to parse telemetry data:', err)
        }
      }

      socket.onerror = (error) => {
        console.error('WebSocket Error:', error)
      }

      socket.onclose = (event) => {
        const backoff = Math.min(1000 * Math.pow(2, reconnectCount.current), 30000);
        console.warn(`❌ WebSocket disconnected (code: ${event.code}). Reconnecting in ${backoff / 1000}s...`);
        
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
        if (globalSocket === socketRef.current) {
          globalSocket = null
        }
      }
      clearTimeout(timeoutId)
    }
  }, [setTelemetry])
}

