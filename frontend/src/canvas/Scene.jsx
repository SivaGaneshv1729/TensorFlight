import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Grid } from '@react-three/drei'
import useTelemetryStore from '../store/useTelemetryStore'
import * as THREE from 'three'

function HUDOverlay() {
  const meshRef = useRef()
  
  useFrame(() => {
    const telemetry = useTelemetryStore.getState().telemetry
    if (meshRef.current && telemetry.is_active) {
      // Convert degrees to radians for Three.js
      const { pitch, roll, yaw_heading } = telemetry.drone_state.orientation_deg
      
      const pitchRad = THREE.MathUtils.degToRad(pitch)
      const rollRad = THREE.MathUtils.degToRad(-roll)
      const yawRad = THREE.MathUtils.degToRad(-yaw_heading)
      
      // Update rotation using 'YXZ' order to prevent Gimbal Lock
      meshRef.current.rotation.set(pitchRad, yawRad, rollRad, 'YXZ')
      
      // Update altitude
      meshRef.current.position.y = telemetry.drone_state.gps.altitude_relative_m * 0.1
    }
  })

  return (
    <group ref={meshRef}>
      {/* Virtual Horizon / Grid */}
      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        sectionSize={1} 
        sectionColor="#39FF14" 
        sectionThickness={1.5}
        cellSize={0.5}
        cellColor="#2D5A27"
      />
      
      {/* Center Reticle */}
      <mesh position={[0, 0, -5]}>
        <ringGeometry args={[0.2, 0.22, 32]} />
        <meshBasicMaterial color="#39FF14" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

function FlightTunnel() {
  const meshRef = useRef()
  
  useFrame(() => {
    const telemetry = useTelemetryStore.getState().telemetry
    // Logic can be added here if the tunnel needs to react to live GPS
  })
  
  // Calculate a simplified 3D path to the "target"
  // In a real app, this would use proper GPS-to-Cartesian conversion (UTM)
  const targetPos = new THREE.Vector3(2, 0, -20) // Simulated target relative to drone
  
  const points = []
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    points.push(new THREE.Vector3(
      t * targetPos.x,
      t * targetPos.y + Math.sin(t * Math.PI) * 2, // Slight curve
      t * targetPos.z
    ))
  }
  
  const curve = new THREE.CatmullRomCurve3(points)

  return (
    <group ref={meshRef}>
      {/* The main path line */}
      <mesh>
        <tubeGeometry args={[curve, 20, 0.1, 8, false]} />
        <meshBasicMaterial color="#39FF14" transparent opacity={0.3} />
      </mesh>
      
      {/* Holographic "rings" along the path */}
      {points.filter((_, i) => i % 2 === 0).map((p, i) => (
        <mesh key={i} position={p} rotation={[0, 0, 0]}>
          <ringGeometry args={[0.5, 0.55, 32]} />
          <meshBasicMaterial color="#39FF14" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Target Marker */}
      <mesh position={targetPos}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#FFD700" />
      </mesh>
    </group>
  )
}

export default function Scene() {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <HUDOverlay />
      <FlightTunnel />
    </Canvas>
  )
}
