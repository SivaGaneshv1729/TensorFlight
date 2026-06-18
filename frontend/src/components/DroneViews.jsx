import React, { useRef, useMemo } from 'react'
import { useFrame, Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import useTelemetryStore from '../store/useTelemetryStore'
import * as THREE from 'three'
import Environment from '../canvas/Environment'

function FPVCamera({ type, orientation, gps }) {
  const groupRef = useRef()
  const homeRef = useRef(null)

  const pitch = orientation?.pitch ?? 0
  const roll = orientation?.roll ?? 0
  const yaw_heading = orientation?.yaw_heading ?? 0
  const latitude = gps?.latitude ?? 0
  const longitude = gps?.longitude ?? 0
  const altitude = gps?.altitude_relative_m ?? 0

  useFrame(() => {
    if (!groupRef.current) return

    if (!homeRef.current && latitude !== 0 && longitude !== 0) {
      homeRef.current = { lat: latitude, lon: longitude }
    }

    const lerpFactor = 0.1
    const gimbalFactor = 0.3

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, THREE.MathUtils.degToRad(pitch * gimbalFactor), lerpFactor)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, THREE.MathUtils.degToRad(-yaw_heading), lerpFactor)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, THREE.MathUtils.degToRad(-roll * gimbalFactor), lerpFactor)
    
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, altitude + 1.8, lerpFactor)

    if (homeRef.current) {
      const deltaLat = latitude - homeRef.current.lat
      const deltaLon = longitude - homeRef.current.lon
      const posX = deltaLon * 111319 * Math.cos(latitude * Math.PI / 180)
      const posZ = -deltaLat * 111319
      
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, posX, lerpFactor)
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, posZ, lerpFactor)
    }
  })

  const cameraConfig = useMemo(() => {
    switch (type) {
      case 'front': return { position: [0, 0, -1], rotation: [0, 0, 0] }
      case 'back': return { position: [0, 0, 1], rotation: [0, Math.PI, 0] }
      case 'bottom': return { position: [0, -1, 0], rotation: [-Math.PI / 2, 0, 0] }
      default: return { position: [0, 0, 0], rotation: [0, 0, 0] }
    }
  }, [type])

  return (
    <group ref={groupRef}>
      <PerspectiveCamera 
        makeDefault 
        position={cameraConfig.position} 
        rotation={cameraConfig.rotation}
        fov={80} 
      />
    </group>
  )
}

function Viewport({ title, type, orientation, gps }) {
  const isConnected = useTelemetryStore((state) => state.telemetry.is_connected)

  return (
    <div className="w-full bg-neutral-900 border-b border-neutral-800 relative group pointer-events-none overflow-hidden">

      {/* 1. Clip Label Overlay */}
      <div className="absolute top-1 left-1 z-50 flex items-center bg-black/60 px-1.5 py-0.5 rounded-sm">
         <span className="text-[7px] font-bold text-neutral-300 uppercase tracking-widest leading-none">
           {title}
         </span>
      </div>

      {/* 2. Top Right Duration */}
      <div className="absolute top-1 right-1 z-50 px-1.5 py-0.5 bg-black/60 rounded-sm">
         <span className="text-[7px] font-mono text-emerald-500 font-bold leading-none">00:04:12:00</span>
      </div>

      {/* 3. 3D Viewport Target (The "Thumbnail") */}
      <div className="w-full aspect-video relative z-0 opacity-80 group-hover:opacity-100 transition-opacity">
        <Canvas className="w-full h-full" gl={{ antialias: true, alpha: true }}>
          <color attach="background" args={['#000']} />
          <Environment showBackground={false} simplified />
          <FPVCamera type={type} orientation={orientation} gps={gps} />
        </Canvas>

        {/* Multicam Icon */}
        <div className="absolute bottom-1 left-1 z-50 opacity-40">
           <div className="w-3 h-3 border border-white/50 flex items-center justify-center text-[6px] text-white/50 font-bold">C{type === 'front' ? '1' : type === 'back' ? '2' : '3'}</div>
        </div>
      </div>

      {/* 4. Bottom Clip Info Bar */}
      <div className="h-4 bg-neutral-800 flex items-center justify-between px-2">
         <div className="flex items-center gap-1.5">
           <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' : 'bg-rose-500'}`} />
           <span className="text-[7px] font-bold text-neutral-400 uppercase tracking-widest">Live Source</span>
         </div>
         <span className="text-[7px] font-mono text-neutral-500">24 fps</span>
      </div>
    </div>
  )
}

export default function DroneViews() {
  const orientation = useTelemetryStore((state) => state.telemetry.drone_state.orientation_deg)
  const gps = useTelemetryStore((state) => state.telemetry.drone_state.gps)

  return (
    <div className="flex flex-col gap-0 pointer-events-auto border-b border-emerald-500/40">
      <Viewport title="Forward View" type="front" orientation={orientation} gps={gps} />
      <Viewport title="Rear View" type="back" orientation={orientation} gps={gps} />
      <Viewport title="Nadir View" type="bottom" orientation={orientation} gps={gps} />
    </div>
  )
}
