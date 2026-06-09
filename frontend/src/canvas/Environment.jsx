import React, { useMemo } from 'react'
import { Sky, Stars, MeshDistortMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

// SHARED WORLD DATA - Ensures consistency across all cameras
const COLORS = {
  grass: '#3f6212',
  dryGrass: '#4d7c0f',
  dirt: '#713f12',
  crop: '#166534',
  mountain: '#475569',
  bark: '#451a03',
  leaves: '#065f46',
  pine: '#064e3b'
}

// Deterministic placement for trees
const VEGETATION = []
for (let i = 0; i < 200; i++) {
  const angle = (i / 200) * Math.PI * 2 * 11
  const dist = 60 + (i * 7)
  VEGETATION.push({
    position: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
    scale: 0.8 + (i % 7) * 0.4,
    type: i % 3 === 0 ? 'pine' : 'deciduous'
  })
}

// Mountain peaks for the horizon
const MOUNTAINS = []
for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2
  const dist = 1200 + Math.random() * 200
  MOUNTAINS.push({
    position: [Math.cos(angle) * dist, -50, Math.sin(angle) * dist],
    scale: [200 + Math.random() * 200, 300 + Math.random() * 500, 200 + Math.random() * 200],
    rotation: [0, Math.random() * Math.PI, 0]
  })
}

function Terrain() {
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(3000, 3000, 50, 50)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      // Subtle procedural bumps
      const h = Math.sin(x * 0.01) * Math.cos(y * 0.01) * 2 + 
                Math.sin(x * 0.05) * 0.5
      pos.setZ(i, h)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh geometry={terrainGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
      <meshStandardMaterial 
        color={COLORS.grass} 
        roughness={1} 
        metalness={0}
      />
    </mesh>
  )
}

function Tree({ type, position, scale }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.35, 2, 8]} />
        <meshStandardMaterial color={COLORS.bark} roughness={0.9} />
      </mesh>
      {/* Foliage */}
      {type === 'pine' ? (
        <group position={[0, 3, 0]}>
          <mesh position={[0, 0, 0]} castShadow><coneGeometry args={[1.5, 3, 8]} /><meshStandardMaterial color={COLORS.pine} /></mesh>
          <mesh position={[0, 1.5, 0]} castShadow><coneGeometry args={[1.2, 2.5, 8]} /><meshStandardMaterial color={COLORS.pine} /></mesh>
        </group>
      ) : (
        <mesh position={[0, 3, 0]} castShadow>
          <sphereGeometry args={[1.8, 12, 12]} />
          <meshStandardMaterial color={COLORS.leaves} roughness={0.8} />
        </mesh>
      )}
    </group>
  )
}

function MountainRange() {
  return (
    <group>
      {MOUNTAINS.map((m, i) => (
        <mesh key={i} position={m.position} scale={m.scale} rotation={m.rotation}>
          <coneGeometry args={[1, 1, 4]} />
          <meshStandardMaterial color={COLORS.mountain} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

function FarmComplex() {
  return (
    <group position={[150, 0, -200]}>
      {/* Main Barn */}
      <mesh position={[0, 5, 0]} castShadow>
        <boxGeometry args={[20, 10, 30]} />
        <meshStandardMaterial color="#b91c1c" />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 11, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[15, 15, 31]} />
        <meshStandardMaterial color="#7f1d1d" />
      </mesh>
      {/* Silo */}
      <mesh position={[18, 8, 10]} castShadow>
        <cylinderGeometry args={[4, 4, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[18, 16, 10]} castShadow>
        <sphereGeometry args={[4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
    </group>
  )
}

export default function Environment() {
  return (
    <>
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 500, 1500]} />
      <Sky distance={450000} sunPosition={[5, 1, 8]} inclination={0} azimuth={0.25} />
      <Stars radius={1000} depth={500} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[100, 200, 100]} 
        intensity={2} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      <Terrain />
      <MountainRange />
      
      <group>
        {VEGETATION.map((v, i) => (
          <Tree key={i} {...v} />
        ))}
        <FarmComplex />
        
        {/* Scattered Rocks */}
        {[...Array(40)].map((_, i) => (
          <mesh key={i} position={[(i * 37) % 800 - 400, -0.3, (i * 23) % 800 - 400]} rotation={[Math.random(), Math.random(), 0]}>
            <dodecahedronGeometry args={[1 + Math.random() * 2, 0]} />
            <meshStandardMaterial color="#64748b" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </>
  )
}
