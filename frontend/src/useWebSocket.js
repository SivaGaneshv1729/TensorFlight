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

// Throttle: Only push telemetry to React state at 8fps (125ms)
// Raw WS messages can still arrive at 20fps for physics/commands
const UI_UPDATE_INTERVAL_MS = 125;

export default function useWebSocket() {
  const setTelemetry = useTelemetryStore((state) => state.setTelemetry)
  const socketRef = useRef(null)
  const reconnectCount = useRef(0)
  const pendingDataRef = useRef(null)
  const lastUpdateRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    let timeoutId;

    // Draining loop — runs via RAF, flushes pending data at ~8fps
    const drain = () => {
      const now = performance.now()
      if (pendingDataRef.current && now - lastUpdateRef.current >= UI_UPDATE_INTERVAL_MS) {
        setTelemetry(pendingDataRef.current)
        pendingDataRef.current = null
        lastUpdateRef.current = now
      }
      rafRef.current = requestAnimationFrame(drain)
    }
    rafRef.current = requestAnimationFrame(drain)
    
    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${protocol}://${window.location.host}/ws/telemetry`;
      
      const socket = new WebSocket(url)
      socketRef.current = socket
      globalSocket = socket
      
      socket.onopen = () => {
        reconnectCount.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          // Just buffer the latest data; the drain loop will push it to React
          pendingDataRef.current = JSON.parse(event.data)
        } catch (err) {
          // Ignore parse errors silently
        }
      }

      socket.onerror = () => {} // Suppress console noise

      socket.onclose = (event) => {
        const backoff = Math.min(1000 * Math.pow(2, reconnectCount.current), 30000);
        timeoutId = setTimeout(() => {
          reconnectCount.current++;
          connect();
        }, backoff);
      }
    }

    connect()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (socketRef.current) {
        socketRef.current.onclose = null
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close()
        }
        if (globalSocket === socketRef.current) globalSocket = null
      }
      clearTimeout(timeoutId)
    }
  }, [setTelemetry])
}
