import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { View, PerspectiveCamera } from '@react-three/drei'
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
    <div className="w-full aspect-video border-b border-slate-700 relative group pointer-events-none bg-transparent overflow-hidden">
      
      {/* 1. Title Badge */}
      <div className="absolute top-0 left-0 z-50 flex items-center bg-slate-800 border-r border-b border-slate-700 px-2 py-0.5">
         <span className="text-[8px] font-bold text-white uppercase tracking-widest">
           {title}
         </span>
      </div>

      {/* 2. Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 px-2 py-0.5 bg-black/60 border-t border-slate-700 flex justify-between items-center">
         <span className="text-[6px] font-mono text-gray-500 uppercase">CAM_FEED_0{type === 'front' ? '1' : type === 'back' ? '2' : '3'}</span>
         <div className="flex items-center gap-1">
            <div className={`w-1 h-1 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-[6px] font-mono text-white/40 font-bold uppercase">{isConnected ? 'LINK_OK' : 'LINK_LOST'}</span>
         </div>
      </div>

      {/* 3. 3D Viewport Target */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <View className="w-full h-full">
          <color attach="background" args={['#030508']} />
          <Environment background={true} />
          <FPVCamera type={type} orientation={orientation} gps={gps} />
        </View>
      </div>
    </div>
  )
}

export default function DroneViews() {
  const orientation = useTelemetryStore((state) => state.telemetry.drone_state.orientation_deg)
  const gps = useTelemetryStore((state) => state.telemetry.drone_state.gps)

  return (
    <div className="flex flex-col gap-0 border-t border-slate-700 pointer-events-auto">
      <Viewport title="Nadir_View" type="front" orientation={orientation} gps={gps} />
      <Viewport title="Rear_View" type="back" orientation={orientation} gps={gps} />
      <Viewport title="Zenith_View" type="bottom" orientation={orientation} gps={gps} />
    </div>
  )
}
