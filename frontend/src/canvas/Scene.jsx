import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Sky, Stars, Cloud, Instances, Instance } from '@react-three/drei'
import useTelemetryStore from '../store/useTelemetryStore'
import * as THREE from 'three'

function BoundedEnvironment() {
  return (
    <>
      {/* Sun and Sky are now FIXED */}
      <Sky distance={450000} sunPosition={[2, 1, 0]} inclination={0} azimuth={0.15} />
      {/* Stars speed set to 0 to prevent "Ghost Drift" */}
      <Stars radius={300} depth={150} count={5000} factor={8} saturation={0} fade speed={0} />
      
      <ambientLight intensity={0.6} />
      <directionalLight position={[100, 200, 100]} intensity={1.8} castShadow />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#7fb069" roughness={0.9} />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#88c4ee" roughness={0.1} metalness={0.8} transparent opacity={0.8} />
      </mesh>

      {/* Cloud speed set to 0 */}
      <Cloud position={[-100, 40, -120]} speed={0} opacity={0.2} />

      <mesh position={[0, 49.5, -250]} castShadow><boxGeometry args={[500, 100, 20]} /><meshStandardMaterial color="#b0a9a2" /></mesh>
      <mesh position={[0, 49.5, 250]} castShadow><boxGeometry args={[500, 100, 20]} /><meshStandardMaterial color="#b0a9a2" /></mesh>
      <mesh position={[-250, 49.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow><boxGeometry args={[500, 100, 20]} /><meshStandardMaterial color="#b0a9a2" /></mesh>
      <mesh position={[250, 49.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow><boxGeometry args={[500, 100, 20]} /><meshStandardMaterial color="#b0a9a2" /></mesh>
    </>
  )
}

function HUDOverlay() {
  const groupRef = useRef()
  const homeRef = useRef(null)

  useFrame(() => {
    const telemetry = useTelemetryStore.getState().telemetry
    const { pitch, roll, yaw_heading } = telemetry.drone_state.orientation_deg
    const { latitude, longitude, altitude_relative_m } = telemetry.drone_state.gps
    
    // Set home position on first valid telemetry
    if (!homeRef.current && latitude !== 0 && longitude !== 0) {
      homeRef.current = { lat: latitude, lon: longitude }
    }

    // Smooth camera rotation
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, THREE.MathUtils.degToRad(pitch), 0.1)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, THREE.MathUtils.degToRad(-yaw_heading), 0.1)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, THREE.MathUtils.degToRad(-roll), 0.1)
    
    // Smooth camera altitude
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, (altitude_relative_m || 0) + 1.5, 0.1)

    // Horizontal movement based on GPS offset from Home
    if (homeRef.current) {
      // 1 degree lat approx 111319 meters
      const deltaLat = latitude - homeRef.current.lat
      const deltaLon = longitude - homeRef.current.lon
      
      const posX = deltaLon * 111319 * Math.cos(latitude * Math.PI / 180)
      const posZ = -deltaLat * 111319
      
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, posX, 0.1)
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, posZ, 0.1)
    }
  })

  return (
    <group ref={groupRef}>
      <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={75} />
    </group>
  )
}

export default function Scene() {
  return (
    <Canvas shadows gl={{ antialias: false }}>
      <BoundedEnvironment />
      <HUDOverlay />
    </Canvas>
  )
}
