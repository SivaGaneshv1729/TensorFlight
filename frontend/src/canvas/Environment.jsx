import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Sky, useTexture } from '@react-three/drei'

// Utility for deterministic randomness
function seedRandom(i, seed) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

// Village Generation
const HOUSES = []
const TREES = []
for (let i = 0; i < 400; i++) {
  const x = (seedRandom(i, 1) - 0.5) * 800;
  const z = (seedRandom(i, 2) - 0.5) * 800;
  if (Math.abs(x) < 50 && Math.abs(z) < 50) continue; // Clear landing pad area

  const isTree = seedRandom(i, 3) > 0.35;
  if (isTree) {
    const trunkHeight = 6 + seedRandom(i, 4) * 6;
    const trunkRadius = 1.5 + seedRandom(i, 5) * 1;
    const canopyRadius = 6 + seedRandom(i, 6) * 6;
    TREES.push({
      trunkPos: [x, trunkHeight / 2 - 0.5, z],
      trunkScale: [trunkRadius, trunkHeight, trunkRadius],
      canopyPos: [x, trunkHeight + canopyRadius / 2 - 2, z],
      canopyScale: [canopyRadius, canopyRadius * 0.8, canopyRadius]
    })
  } else {
    const width = 15 + seedRandom(i, 4) * 15;
    const depth = 15 + seedRandom(i, 5) * 15;
    const wallHeight = 10 + seedRandom(i, 6) * 8;
    const roofHeight = 8 + seedRandom(i, 7) * 4;
    HOUSES.push({
      wallPos: [x, wallHeight / 2 - 0.5, z],
      wallScale: [width, wallHeight, depth],
      roofPos: [x, wallHeight - 0.5 + roofHeight / 2, z],
      // Roof slightly wider than walls
      roofScale: [width + 2, roofHeight, depth + 2]
    })
  }
}

// Pre-compute instance matrices
const HOUSE_WALL_MATRICES = []
const HOUSE_ROOF_MATRICES = []
const TREE_TRUNK_MATRICES = []
const TREE_CANOPY_MATRICES = []

const dummy = new THREE.Object3D()
HOUSES.forEach(h => {
  dummy.position.set(...h.wallPos)
  dummy.scale.set(...h.wallScale)
  dummy.updateMatrix()
  HOUSE_WALL_MATRICES.push(dummy.matrix.clone())

  dummy.position.set(...h.roofPos)
  dummy.scale.set(...h.roofScale)
  // Rotate cone to look like a pitched roof (4 sides)
  dummy.rotation.set(0, Math.PI / 4, 0)
  dummy.updateMatrix()
  HOUSE_ROOF_MATRICES.push(dummy.matrix.clone())
  dummy.rotation.set(0, 0, 0) // reset
})

TREES.forEach(t => {
  dummy.position.set(...t.trunkPos)
  dummy.scale.set(...t.trunkScale)
  dummy.updateMatrix()
  TREE_TRUNK_MATRICES.push(dummy.matrix.clone())

  dummy.position.set(...t.canopyPos)
  dummy.scale.set(...t.canopyScale)
  dummy.updateMatrix()
  TREE_CANOPY_MATRICES.push(dummy.matrix.clone())
})

function Village() {
  const wallRef = useRef()
  const roofRef = useRef()
  const trunkRef = useRef()
  const canopyRef = useRef()

  React.useEffect(() => {
    if (!wallRef.current) return
    HOUSE_WALL_MATRICES.forEach((m, i) => wallRef.current.setMatrixAt(i, m))
    HOUSE_ROOF_MATRICES.forEach((m, i) => roofRef.current.setMatrixAt(i, m))
    TREE_TRUNK_MATRICES.forEach((m, i) => trunkRef.current.setMatrixAt(i, m))
    TREE_CANOPY_MATRICES.forEach((m, i) => canopyRef.current.setMatrixAt(i, m))

    wallRef.current.instanceMatrix.needsUpdate = true
    roofRef.current.instanceMatrix.needsUpdate = true
    trunkRef.current.instanceMatrix.needsUpdate = true
    canopyRef.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <group>
      {/* Houses */}
      <instancedMesh ref={wallRef} args={[null, null, HOUSES.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} metalness={0.1} />
      </instancedMesh>
      <instancedMesh ref={roofRef} args={[null, null, HOUSES.length]}>
        <coneGeometry args={[0.707, 1, 4]} /> {/* 4-sided cone acts as a pitched roof */}
        <meshStandardMaterial color="#881337" roughness={0.8} />
      </instancedMesh>

      {/* Trees */}
      <instancedMesh ref={trunkRef} args={[null, null, TREES.length]}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[null, null, TREES.length]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </instancedMesh>
    </group>
  )
}

function Terrain() {
  const texture = useTexture('/field_texture.png')
  
  // Configure texture for seamless tiling
  React.useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(100, 100) // Scale the 1024x1024 texture across the huge 4000x4000 plane
    texture.needsUpdate = true
  }, [texture])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
      <planeGeometry args={[4000, 4000]} />
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
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

      <React.Suspense fallback={null}>
        <Terrain />
      </React.Suspense>
      <LandingPad />
      <Village />
    </>
  )
}
