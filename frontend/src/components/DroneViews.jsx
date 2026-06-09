import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { View, PerspectiveCamera } from '@react-three/drei'
import useTelemetryStore from '../store/useTelemetryStore'
import * as THREE from 'three'
import Environment from '../canvas/Environment'

function FPVCamera({ type, orientation, gps }) {
  const groupRef = useRef()
  const homeRef = useRef(null)

  const { pitch, roll, yaw_heading } = orientation
  const { latitude, longitude, altitude_relative_m } = gps

  useFrame(() => {
    if (!homeRef.current && latitude !== 0 && longitude !== 0) {
      homeRef.current = { lat: latitude, lon: longitude }
    }

    const lerpFactor = 0.1
    const gimbalFactor = 0.3 // More stabilization for sub-views

    // Base Orientation
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, THREE.MathUtils.degToRad(pitch * gimbalFactor), lerpFactor)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, THREE.MathUtils.degToRad(-yaw_heading), lerpFactor)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, THREE.MathUtils.degToRad(-roll * gimbalFactor), lerpFactor)
    
    // Base Position
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, (altitude_relative_m || 0) + 1.8, lerpFactor)

    if (homeRef.current) {
      const deltaLat = latitude - homeRef.current.lat
      const deltaLon = longitude - homeRef.current.lon
      const posX = deltaLon * 111319 * Math.cos(latitude * Math.PI / 180)
      const posZ = -deltaLat * 111319
      
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, posX, lerpFactor)
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, posZ, lerpFactor)
    }
  })

  // Camera Offset and Rotation based on View Type
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
  return (
    <div className="w-48 h-32 bg-black/40 border border-white/10 rounded-lg overflow-hidden relative">
      <div className="absolute top-1 left-2 z-10 text-[10px] font-bold text-agri-neon uppercase tracking-tighter bg-black/60 px-2 py-0.5 rounded">
        {title}
      </div>
      <View className="w-full h-full">
        <Environment />
        <FPVCamera type={type} orientation={orientation} gps={gps} />
      </View>
    </div>
  )
}

export default function DroneViews() {
  const orientation = useTelemetryStore((state) => state.telemetry.drone_state.orientation_deg)
  const gps = useTelemetryStore((state) => state.telemetry.drone_state.gps)

  return (
    <div className="flex flex-col gap-3 pointer-events-auto">
      <Viewport title="Front Camera" type="front" orientation={orientation} gps={gps} />
      <Viewport title="Rear Camera" type="back" orientation={orientation} gps={gps} />
      <Viewport title="Ground View" type="bottom" orientation={orientation} gps={gps} />
    </div>
  )
}
