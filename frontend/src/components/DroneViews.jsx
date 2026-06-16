import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { View, PerspectiveCamera } from '@react-three/drei'
import useTelemetryStore from '../store/useTelemetryStore'
import * as THREE from 'three'
import Environment from '../canvas/Environment'

function FPVCamera({ type, orientation, gps }) {
  const groupRef = useRef()
  const homeRef = useRef(null)

  // Defensive data extraction
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
    <div className="w-full aspect-video border-b border-agri-neon/20 relative group hover:bg-agri-neon/5 transition-all pointer-events-none bg-transparent overflow-hidden">
      
      {/* 1. Technical Bezel & Corner Ticks */}
      <div className="absolute inset-0 border border-white/5 z-10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-agri-neon/40 z-20" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-agri-neon/40 z-20" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-agri-neon/40 z-20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-agri-neon/40 z-20" />

      {/* 2. Top Identification Tape */}
      <div className="absolute top-0 left-0 right-0 z-50 flex justify-between px-2 py-1 bg-gradient-to-b from-black/80 to-transparent">
         <div className="flex items-center gap-2">
            <div className="w-1 h-2 bg-agri-neon shadow-[0_0_5px_#39ff14]" />
            <span className="text-[8px] font-black text-white uppercase tracking-widest">{title}</span>
         </div>
         <div className="flex items-center gap-3">
            <span className="text-[7px] font-mono text-agri-neon/60 font-bold tracking-tighter">SIG: 98%</span>
            <span className="text-[7px] font-mono text-agri-neon/60 font-bold tracking-tighter">FPS: 60</span>
         </div>
      </div>

      {/* 3. Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 px-2 py-0.5 bg-black/40 backdrop-blur-sm border-t border-white/5 flex justify-between items-center">
         <span className="text-[6px] font-mono text-gray-500 uppercase">CAM_FEED_0{type === 'front' ? '1' : type === 'back' ? '2' : '3'} [HD-AV]</span>
         <div className="flex items-center gap-1">
            <div className={`w-1 h-1 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-[6px] font-mono text-white/40 font-bold uppercase">{isConnected ? 'Link_Ok' : 'Link_Lost'}</span>
         </div>
      </div>

      {/* 4. 3D Viewport Target */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <View className="w-full h-full">
          <color attach="background" args={['#030508']} />
          <Environment background={true} />
          <FPVCamera type={type} orientation={orientation} gps={gps} />
        </View>
      </div>

      {/* 5. Hardware Interlace Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-20" />
    </div>
  )
}

export default function DroneViews() {
  const orientation = useTelemetryStore((state) => state.telemetry.drone_state.orientation_deg)
  const gps = useTelemetryStore((state) => state.telemetry.drone_state.gps)

  return (
    <div className="flex flex-col gap-0 border-t border-agri-neon/20 pointer-events-auto">
      <Viewport title="Nadir_View" type="front" orientation={orientation} gps={gps} />
      <Viewport title="Rear_View" type="back" orientation={orientation} gps={gps} />
      <Viewport title="Zenith_View" type="bottom" orientation={orientation} gps={gps} />
    </div>
  )
}
