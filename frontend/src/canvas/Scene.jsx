import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { View, PerspectiveCamera, Line, Points, PointMaterial } from '@react-three/drei'
import useTelemetryStore from '../store/useTelemetryStore'
import * as THREE from 'three'
import Environment from './Environment'

function Rain({ isStorming }) {
  const points = useRef()
  const count = 2000
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200
      pos[i * 3 + 1] = Math.random() * 100
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200
    }
    return pos
  }, [count])

  useFrame((state, delta) => {
    if (!isStorming || !points.current) return
    const array = points.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] -= 40 * delta
      if (array[i * 3 + 1] < 0) {
        array[i * 3 + 1] = 100
      }
    }
    points.current.geometry.attributes.position.needsUpdate = true
  })

  if (!isStorming) return null

  return (
    <Points ref={points} positions={positions}>
      <PointMaterial transparent color="#60a5fa" size={0.15} sizeAttenuation={true} depthWrite={false} opacity={0.4} />
    </Points>
  )
}

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

function HolographicTargetLine() {
  const targetWp = useTelemetryStore((state) => state.telemetry.navigation_target.next_waypoint_gps)
  const distanceToWp = useTelemetryStore((state) => state.telemetry.navigation_target.distance_to_wp_m)
  const isArmed = useTelemetryStore((state) => state.telemetry.is_active)
  const gps = useTelemetryStore((state) => state.telemetry.drone_state.gps)
  
  const homeRef = useRef(null)

  if (!isArmed || !targetWp || distanceToWp < 1.0) return null

  const { latitude, longitude, altitude_relative_m } = gps
  if (latitude === 0 && longitude === 0) return null

  if (!homeRef.current) {
    homeRef.current = { lat: latitude, lon: longitude }
  }

  // Calculate current drone position
  const deltaLat = latitude - homeRef.current.lat
  const deltaLon = longitude - homeRef.current.lon
  const droneX = deltaLon * 111319 * Math.cos(latitude * Math.PI / 180)
  const droneY = altitude_relative_m || 0
  const droneZ = -deltaLat * 111319

  // Calculate target position
  const targetDeltaLat = targetWp.latitude - homeRef.current.lat
  const targetDeltaLon = targetWp.longitude - homeRef.current.lon
  const targetX = targetDeltaLon * 111319 * Math.cos(latitude * Math.PI / 180)
  const targetY = targetWp.altitude_relative_m !== undefined ? targetWp.altitude_relative_m : 15.0
  const targetZ = -targetDeltaLat * 111319

  const points = [
    [droneX, droneY, droneZ],
    [targetX, targetY, targetZ]
  ]

  return (
    <group>
      {/* Holographic Laser Path */}
      <Line 
        points={points} 
        color="#39FF14" 
        lineWidth={3} 
        transparent
        opacity={0.8}
      />
      
      {/* Target Marker Beacon */}
      <mesh position={[targetX, targetY, targetZ]}>
        <cylinderGeometry args={[0, 1.2, 3.5, 16]} />
        <meshBasicMaterial color="#39FF14" wireframe transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

export default function Scene() {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const isStorming = telemetry.ai_analysis?.is_storming ?? false

  return (
    <View className="w-full h-full">
      <Environment />
      <HUDOverlay />
      <HolographicTargetLine />
      <Rain isStorming={isStorming} />
    </View>
  )
}
