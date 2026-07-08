import React, { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Line, Points, PointMaterial } from '@react-three/drei'
import useTelemetryStore from '../store/useTelemetryStore'
import * as THREE from 'three'
import Environment from './Environment'
import DroneModel from './DroneModel'

// PERF: 600 → 400 particles; skip update when not storming
const RAIN_COUNT = 400

function Rain({ isStorming }) {
  const points = useRef()
  const positions = useMemo(() => {
    const pos = new Float32Array(RAIN_COUNT * 3)
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120
      pos[i * 3 + 1] = Math.random() * 60
      pos[i * 3 + 2] = (Math.random() - 0.5) * 120
    }
    return pos
  }, [])

  useFrame((state, delta) => {
    if (!isStorming || !points.current) return
    const array = points.current.geometry.attributes.position.array
    for (let i = 0; i < RAIN_COUNT; i++) {
      array[i * 3 + 1] -= 30 * delta
      if (array[i * 3 + 1] < 0) array[i * 3 + 1] = 60
    }
    points.current.geometry.attributes.position.needsUpdate = true
  })

  if (!isStorming) return null

  return (
    <Points ref={points} positions={positions}>
      <PointMaterial transparent color="#60a5fa" size={0.12} sizeAttenuation depthWrite={false} opacity={0.35} />
    </Points>
  )
}

// PERF: memo prevents re-render when telemetry reference changes but values don't matter
const HUDOverlay = memo(function HUDOverlay() {
  const groupRef = useRef()
  const homeRef = useRef(null)

  // PERF: Use shallow selectors — only the values needed
  const pitch = useTelemetryStore((s) => s.telemetry.drone_state.orientation_deg.pitch)
  const roll = useTelemetryStore((s) => s.telemetry.drone_state.orientation_deg.roll)
  const yaw_heading = useTelemetryStore((s) => s.telemetry.drone_state.orientation_deg.yaw_heading)
  const latitude = useTelemetryStore((s) => s.telemetry.drone_state.gps.latitude)
  const longitude = useTelemetryStore((s) => s.telemetry.drone_state.gps.longitude)
  const altitude = useTelemetryStore((s) => s.telemetry.drone_state.gps.altitude_relative_m)

  useFrame(() => {
    if (!groupRef.current) return
    if (!homeRef.current && latitude !== 0 && longitude !== 0) {
      homeRef.current = { lat: latitude, lon: longitude }
    }
    const lp = 0.08 // Slightly slower lerp to reduce snap-jitter
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, THREE.MathUtils.degToRad(pitch * 0.25), lp)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, THREE.MathUtils.degToRad(-yaw_heading), lp)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, THREE.MathUtils.degToRad(-roll * 0.25), lp)
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, (altitude || 0) + 1.8, lp)
    if (homeRef.current) {
      const posX = (longitude - homeRef.current.lon) * 111319 * Math.cos(latitude * Math.PI / 180)
      const posZ = -(latitude - homeRef.current.lat) * 111319
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, posX, lp)
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, posZ, lp)
    }
  })

  return (
    <group ref={groupRef}>
      <PerspectiveCamera makeDefault position={[0, 3, 8]} fov={70} far={5000} />
      <DroneModel pitch={pitch} roll={roll} yaw={0} />
    </group>
  )
})

const HolographicTargetLine = memo(function HolographicTargetLine() {
  const targetWp = useTelemetryStore((s) => s.telemetry.navigation_target.next_waypoint_gps)
  const isArmed = useTelemetryStore((s) => s.telemetry.is_active)
  const latitude = useTelemetryStore((s) => s.telemetry.drone_state.gps.latitude)
  const longitude = useTelemetryStore((s) => s.telemetry.drone_state.gps.longitude)
  const altitude = useTelemetryStore((s) => s.telemetry.drone_state.gps.altitude_relative_m)
  const homeRef = useRef(null)

  const lineData = useMemo(() => {
    if (!isArmed || !targetWp || (latitude === 0 && longitude === 0)) return null
    if (!homeRef.current) homeRef.current = { lat: latitude, lon: longitude }

    const droneX = (longitude - homeRef.current.lon) * 111319 * Math.cos(latitude * Math.PI / 180)
    const droneZ = -(latitude - homeRef.current.lat) * 111319
    const tgtX = (targetWp.longitude - homeRef.current.lon) * 111319 * Math.cos(latitude * Math.PI / 180)
    const tgtZ = -(targetWp.latitude - homeRef.current.lat) * 111319
    const tgtY = targetWp.altitude_relative_m ?? 15

    return {
      points: [
        [droneX, altitude || 0, droneZ],
        [tgtX, tgtY, tgtZ]
      ],
      tgtPos: [tgtX, tgtY, tgtZ]
    }
  }, [isArmed, targetWp, latitude, longitude, altitude])

  if (!lineData) return null

  return (
    <group>
      <Line points={lineData.points} color="#fbbf24" lineWidth={1.5} transparent opacity={0.6} dashed={true} dashSize={1} gapSize={0.5} />
      <mesh position={lineData.tgtPos}>
        <octahedronGeometry args={[0.6]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  )
})

export default function Scene() {
  const isStorming = useTelemetryStore((s) => s.telemetry.ai_analysis?.is_storming ?? false)

  return (
    <>
      <ambientLight intensity={0.5} />
      <Environment showBackground={true} />
      <HUDOverlay />
      <HolographicTargetLine />
      <Rain isStorming={isStorming} />
    </>
  )
}
