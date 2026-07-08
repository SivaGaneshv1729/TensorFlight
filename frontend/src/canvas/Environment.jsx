import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Sky } from '@react-three/drei'

// Utility for deterministic randomness
function seedRandom(i, seed) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

// PERF: Reduced from 600 to 200 obstacles; shadows disabled
const OBSTACLES = []
for (let i = 0; i < 200; i++) {
  const x = (seedRandom(i, 1) - 0.5) * 600;
  const z = (seedRandom(i, 2) - 0.5) * 600;
  if (Math.abs(x) < 40 && Math.abs(z) < 40) continue;
  // Generate Barns and Silos
  const isSilo = seedRandom(i, 3) > 0.7;
  const width = isSilo ? 12 : 30 + seedRandom(i, 4) * 20;
  const height = isSilo ? 40 + seedRandom(i, 5) * 30 : 12 + seedRandom(i, 6) * 10;
  const depth = isSilo ? 12 : 20 + seedRandom(i, 7) * 15;
  OBSTACLES.push({ position: [x, height / 2 - 0.6, z], args: [width, height, depth] })
}

// PERF: Pre-generate instanced mesh matrices at module level — zero per-render overhead
const INSTANCE_MATRIX = (() => {
  const dummy = new THREE.Object3D()
  const matrices = OBSTACLES.map((obs) => {
    dummy.position.set(...obs.position)
    dummy.scale.set(obs.args[0], obs.args[1], obs.args[2])
    dummy.updateMatrix()
    return dummy.matrix.clone()
  })
  return matrices
})()

function ObstacleInstances() {
  const meshRef = useRef()
  // Apply matrices once on mount
  React.useEffect(() => {
    if (!meshRef.current) return
    INSTANCE_MATRIX.forEach((matrix, i) => {
      meshRef.current.setMatrixAt(i, matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[null, null, OBSTACLES.length]}>
      <boxGeometry args={[1, 1, 1]} />
      {/* Rustic red/brown color for barns/silos */}
      <meshStandardMaterial color="#6b2b2b" roughness={0.9} metalness={0.1} />
    </instancedMesh>
  )
}

function Terrain() {
  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    
    // Rich soil background
    ctx.fillStyle = '#2d1c15'
    ctx.fillRect(0, 0, 256, 256)
    
    // Lush green crop rows
    ctx.fillStyle = '#166534'
    for (let i = 0; i <= 256; i += 32) {
      // Add slight organic variation
      ctx.fillRect(0, i + 4, 256, 14)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(120, 120) // Tile more densely
    return texture
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
      <planeGeometry args={[4000, 4000]} />
      <meshStandardMaterial map={gridTexture} roughness={1} metalness={0} />
    </mesh>
  )
}

function LandingPad() {
  return (
    <group position={[0, -0.55, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[15, 24]} /> {/* PERF: 24 segments vs 32 */}
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[13, 14, 24]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

export default function Environment({ simplified = false, showBackground = true }) {
  return (
    <>
      {showBackground && <color attach="background" args={['#0f172a']} />}
      {showBackground && <fog attach="fog" args={['#0f172a', 50, 500]} />}
      {showBackground && !simplified && (
        <Sky distance={200000} sunPosition={[0, 50, -100]} turbidity={10} rayleigh={2} />
      )}

      <ambientLight intensity={0.8} />
      {!simplified && (
        <directionalLight
          position={[100, 200, 50]}
          intensity={2.0}
          castShadow
          shadow-mapSize={[512, 512]} // PERF: Down from 2048×2048
          shadow-camera-left={-150}
          shadow-camera-right={150}
          shadow-camera-top={150}
          shadow-camera-bottom={-150}
        />
      )}

      <Terrain />
      <LandingPad />
      <ObstacleInstances />
    </>
  )
}
