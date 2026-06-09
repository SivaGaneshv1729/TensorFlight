import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { View, PerspectiveCamera } from '@react-three/drei'
import useTelemetryStore from '../store/useTelemetryStore'
import * as THREE from 'three'
import Environment from './Environment'

function HUDOverlay() {
  const groupRef = useRef()
  const homeRef = useRef(null)

  const orientation = useTelemetryStore((state) => state.telemetry.drone_state.orientation_deg)
  const gps = useTelemetryStore((state) => state.telemetry.drone_state.gps)

  useFrame(() => {
    const { pitch, roll, yaw_heading } = orientation
    const { latitude, longitude, altitude_relative_m } = gps
    
    if (!homeRef.current && latitude !== 0 && longitude !== 0) {
      homeRef.current = { lat: latitude, lon: longitude }
    }

    const lerpFactor = 0.1
    const gimbalFactor = 0.3
    
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, THREE.MathUtils.degToRad(pitch * gimbalFactor), lerpFactor)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, THREE.MathUtils.degToRad(-yaw_heading), lerpFactor)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, THREE.MathUtils.degToRad(-roll * gimbalFactor), lerpFactor)
    
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

  return (
    <group ref={groupRef}>
      <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={70} far={10000} />
    </group>
  )
}

export default function Scene() {
  return (
    <View className="w-full h-full">
      <Environment />
      <HUDOverlay />
    </View>
  )
}
