import React, { useMemo, useRef } from 'react'
import { Sky, Stars, Cloud } from '@react-three/drei'
import * as THREE from 'three'

// SHARED WORLD DATA - Ensures all camera views see the exact same world
const WORLD_SEED = 42
const COLORS = ['#4d7c0f', '#3f6212', '#713f12', '#a16207', '#166534']

const FIELD_PATCHES = []
for (let x = -500; x < 500; x += 50) {
  for (let z = -500; z < 500; z += 50) {
    // Simple deterministic "random" based on coordinates
    const colorIdx = Math.abs(x + z) % COLORS.length
    FIELD_PATCHES.push({
      position: [x + 25, -0.45, z + 25],
      color: COLORS[colorIdx],
      size: [48, 48]
    })
  }
}

const TREE_DATA = []
for (let i = 0; i < 150; i++) {
  // Deterministic trees
  const angle = (i / 150) * Math.PI * 2 * 7
  const dist = 50 + (i * 8)
  TREE_DATA.push({
    position: [
      Math.cos(angle) * dist,
      0,
      Math.sin(angle) * dist
    ],
    scale: 0.8 + (i % 5) * 0.3
  })
}

function FarmFields() {
  return (
    <group>
      {FIELD_PATCHES.map((patch, i) => (
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
  return (
    <group>
      {TREE_DATA.map((tree, i) => (
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
    </group>
  )
}

export default function Environment({ simplified = false }) {
  return (
    <>
      <Sky distance={450000} sunPosition={[2, 1, 0]} inclination={0} azimuth={0.15} />
      {!simplified && <Stars radius={1000} depth={500} count={10000} factor={4} saturation={0} fade speed={0} />}
      
      <ambientLight intensity={0.7} />
      <directionalLight position={[100, 200, 100]} intensity={1.5} castShadow />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[4000, 4000]} />
        <meshStandardMaterial color="#2d4a10" roughness={1} />
      </mesh>
      
      <FarmFields />
      {!simplified && <Obstacles />}
    </>
  )
}
