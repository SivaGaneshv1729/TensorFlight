import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Sky, Stars, Cloud } from '@react-three/drei'
import useTelemetryStore from '../store/useTelemetryStore'
import * as THREE from 'three'

function FarmFields() {
  const patches = useMemo(() => {
    const data = []
    const colors = ['#4d7c0f', '#3f6212', '#713f12', '#a16207', '#166534']
    // Expand grid to 1000x1000 area
    for (let x = -500; x < 500; x += 50) {
      for (let z = -500; z < 500; z += 50) {
        data.push({
          position: [x + 25, -0.45, z + 25],
          color: colors[Math.floor(Math.random() * colors.length)],
          size: [48, 48]
        })
      }
    }
    return data
  }, [])

  return (
    <group>
      {patches.map((patch, i) => (
        <mesh key={i} position={patch.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={patch.size} />
          <meshStandardMaterial color={patch.color} roughness={0.8} />
        </mesh>
      ))}
      <gridHelper args={[2000, 40, '#ffffff', '#111111']} position={[0, -0.4, 0]} opacity={0.1} transparent />
    </group>
  )
}

function Obstacles() {
  const trees = useMemo(() => {
    const data = []
    for (let i = 0; i < 150; i++) {
      data.push({
        position: [
          (Math.random() - 0.5) * 1500,
          0,
          (Math.random() - 0.5) * 1500
        ],
        scale: 0.8 + Math.random() * 1.5
      })
    }
    return data
  }, [])

  return (
    <group>
      {trees.map((tree, i) => (
        <group key={i} position={tree.position} scale={tree.scale}>
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.4, 2, 8]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
          <mesh position={[0, 3, 0]} castShadow>
            <coneGeometry args={[1.5, 3, 8]} />
            <meshStandardMaterial color="#065f46" />
          </mesh>
        </group>
      ))}
      
      {/* Scattered Farm Structures */}
      <group position={[100, 0, -150]}>
        <mesh position={[0, 5, 0]} castShadow><cylinderGeometry args={[4, 4, 10, 16]} /><meshStandardMaterial color="#94a3b8" metalness={0.8} /></mesh>
        <mesh position={[0, 11, 0]} castShadow><sphereGeometry args={[4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#ef4444" /></mesh>
      </group>
      
      <group position={[-300, 0, 200]}>
        <mesh position={[0, 5, 0]} castShadow><boxGeometry args={[15, 10, 20]} /><meshStandardMaterial color="#b91c1c" /></mesh>
        <mesh position={[0, 12, 0]} rotation={[0, 0, Math.PI/4]} castShadow><boxGeometry args={[12, 12, 22]} /><meshStandardMaterial color="#7f1d1d" /></mesh>
      </group>
    </group>
  )
}

function WindTurbine({ position }) {
  const bladesRef = useRef()
  useFrame((state, delta) => { if (bladesRef.current) bladesRef.current.rotation.z += delta * 2.5 })

  return (
    <group position={position}>
      <mesh position={[0, 15, 0]} castShadow><cylinderGeometry args={[0.6, 1, 30, 8]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <group position={[0, 30, 0.8]}>
        <mesh castShadow><sphereGeometry args={[1.2, 16, 16]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
        <group ref={bladesRef}>
          {[0, 120, 240].map((deg, i) => (
            <mesh key={i} rotation={[0, 0, THREE.MathUtils.degToRad(deg)]} position={[0, 6, 0]} castShadow>
              <boxGeometry args={[0.6, 12, 0.1]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

function BoundedEnvironment() {
  return (
    <>
      <Sky distance={450000} sunPosition={[2, 1, 0]} inclination={0} azimuth={0.15} />
      <Stars radius={1000} depth={500} count={10000} factor={4} saturation={0} fade speed={0} />
      
      <ambientLight intensity={0.7} />
      <directionalLight position={[100, 200, 100]} intensity={1.5} castShadow shadow-camera-left={-500} shadow-camera-right={500} shadow-camera-top={500} shadow-camera-bottom={-500} />
      
      {/* Infinite-feeling ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[4000, 4000]} />
        <meshStandardMaterial color="#2d4a10" roughness={1} />
      </mesh>
      
      <FarmFields />
      <Obstacles />
      
      <WindTurbine position={[-400, 0, -400]} />
      <WindTurbine position={[-350, 0, -200]} />
      <WindTurbine position={[500, 0, 600]} />

      <Cloud position={[-200, 60, -300]} speed={0} opacity={0.3} />
      <Cloud position={[300, 80, 400]} speed={0} opacity={0.2} />
    </>
  )
}

function HUDOverlay() {
  const groupRef = useRef()
  const homeRef = useRef(null)

  // Use state selectors for better performance and stability
  const orientation = useTelemetryStore((state) => state.telemetry.drone_state.orientation_deg)
  const gps = useTelemetryStore((state) => state.telemetry.drone_state.gps)

  useFrame(() => {
    const { pitch, roll, yaw_heading } = orientation
    const { latitude, longitude, altitude_relative_m } = gps
    
    if (!homeRef.current && latitude !== 0 && longitude !== 0) {
      homeRef.current = { lat: latitude, lon: longitude }
    }

    // High-stability LERP for smooth ride
    const lerpFactor = 0.08
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, THREE.MathUtils.degToRad(pitch), lerpFactor)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, THREE.MathUtils.degToRad(-yaw_heading), lerpFactor)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, THREE.MathUtils.degToRad(-roll), lerpFactor)
    
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
    <Canvas shadows gl={{ antialias: true, logarithmicDepthBuffer: true }}>
      <BoundedEnvironment />
      <HUDOverlay />
    </Canvas>
  )
}
