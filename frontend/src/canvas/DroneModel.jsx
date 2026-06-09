import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function DroneModel({ pitch = 0, roll = 0, yaw = 0 }) {
  const group = useRef()

  return (
    <group ref={group} rotation={[THREE.MathUtils.degToRad(pitch), THREE.MathUtils.degToRad(-yaw), THREE.MathUtils.degToRad(-roll)]}>
      {/* Central Hub */}
      <mesh castShadow>
        <boxGeometry args={[1, 0.4, 1]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Arms */}
      {[45, 135, 225, 315].map((angle, i) => (
        <group key={i} rotation={[0, THREE.MathUtils.degToRad(angle), 0]}>
          <mesh position={[0, 0, 1.2]} castShadow>
            <boxGeometry args={[0.2, 0.1, 2.4]} />
            <meshStandardMaterial color="#555" />
          </mesh>
          {/* Motors */}
          <mesh position={[0, 0.1, 2.4]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.4, 16]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          {/* Props (simple discs) */}
          <mesh position={[0, 0.3, 2.4]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 0.05, 16]} />
            <meshStandardMaterial color="#00ffcc" transparent opacity={0.4} />
          </mesh>
        </group>
      ))}

      {/* Front Indicator (Camera/Sensors) */}
      <mesh position={[0, 0, -0.6]} castShadow>
        <boxGeometry args={[0.4, 0.3, 0.4]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}
