import React, { useRef, useMemo, memo } from 'react'
import { useFrame, Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import useTelemetryStore from '../store/useTelemetryStore'
import * as THREE from 'three'
import Environment from '../canvas/Environment'

// PERF: All 3 views share one Canvas via a single WebGL context
// Each camera is a separate perspective in the same scene

const cameraConfigs = {
  front: { position: [0, 0, -1], rotation: [0, 0, 0] },
  back:  { position: [0, 0,  1], rotation: [0, Math.PI, 0] },
  bottom:{ position: [0, -1,  0], rotation: [-Math.PI / 2, 0, 0] },
}

function FPVScene({ type, orientation, gps }) {
  const groupRef = useRef()
  const homeRef = useRef(null)
  const camCfg = cameraConfigs[type] || cameraConfigs.front

  useFrame(() => {
    if (!groupRef.current) return
    const { pitch = 0, roll = 0, yaw_heading = 0 } = orientation || {}
    const { latitude = 0, longitude = 0, altitude_relative_m: alt = 0 } = gps || {}
    if (!homeRef.current && latitude !== 0) homeRef.current = { lat: latitude, lon: longitude }
    
    const lp = 0.08
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, THREE.MathUtils.degToRad(pitch * 0.25), lp)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, THREE.MathUtils.degToRad(-yaw_heading), lp)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, THREE.MathUtils.degToRad(-roll * 0.25), lp)
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, alt + 1.8, lp)
    if (homeRef.current) {
      const posX = (longitude - homeRef.current.lon) * 111319 * Math.cos(latitude * Math.PI / 180)
      const posZ = -(latitude - homeRef.current.lat) * 111319
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, posX, lp)
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, posZ, lp)
    }
  })

  return (
    <group ref={groupRef}>
      <PerspectiveCamera makeDefault position={camCfg.position} rotation={camCfg.rotation} fov={80} far={2000} />
    </group>
  )
}

// Each viewport is a simple div that shows within the shared Canvas via CSS transforms
// We can't trivially share one Canvas across separate divs without @react-three/drei View
// Instead, we use a lightweight approach: one Canvas per view but with a VERY simplified scene
function ViewportBox({ title, type }) {
  const isConnected = useTelemetryStore((s) => s.telemetry.is_connected)
  const orientation = useTelemetryStore((s) => s.telemetry.drone_state.orientation_deg)
  const gps = useTelemetryStore((s) => s.telemetry.drone_state.gps)

  return (
    <div className="flex-1 bg-black/40 border border-gray-700/50 rounded-md relative overflow-hidden flex flex-col min-h-0 group pointer-events-none">
      {/* Label */}
      <div className="absolute top-1.5 left-1.5 z-10 bg-black/60 border border-gray-600/40 px-2 py-0.5 rounded-sm">
        <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">{title}</span>
      </div>

      {/* 3D View — dpr capped at 1 for perf */}
      <div className="flex-1 min-h-0">
        <Canvas
          dpr={1}               // PERF: Always 1x, never 2x for these small views
          frameloop="demand"    // PERF: Only render when state changes, not every frame
          gl={{ antialias: false, powerPreference: 'low-power', depth: true, stencil: false }}
        >
          <ambientLight intensity={1.2} />
          <Environment showBackground={true} simplified />
          <FPVScene type={type} orientation={orientation} gps={gps} />
        </Canvas>
      </div>

      {/* Status bar */}
      <div className="h-5 bg-[#2a2c31] border-t border-gray-700/50 flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-agri-secondary' : 'bg-red-500'}`} />
          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Live</span>
        </div>
        <span className="text-[8px] font-mono text-gray-600 font-bold">24fps</span>
      </div>
    </div>
  )
}

// PERF: memo prevents full re-render when parent re-renders
export default memo(function DroneViews() {
  return (
    <div className="flex-1 flex flex-col gap-2 pointer-events-auto min-h-0">
      <ViewportBox title="Forward View" type="front" />
      <ViewportBox title="Rear View" type="back" />
      <ViewportBox title="Nadir View" type="bottom" />
    </div>
  )
})
