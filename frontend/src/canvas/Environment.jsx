import React, { useMemo } from 'react'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'

// 1. ASSET GENERATION BASED ON 4 QUADRANTS
// NE: Village Crops (X > 10, Z < -10)
// NW: City Skyscrapers (X < -10, Z < -10)
// SW: Desert & Cacti (X < -10, Z > 10)
// SE: Mountain Peaks (X > 10, Z > 10)

const VILLAGE_TREES = []
for (let i = 0; i < 80; i++) {
  const angle = Math.random() * Math.PI * 0.5 + Math.PI // Top-Right NE quadrant
  const dist = 50 + Math.random() * 500
  VILLAGE_TREES.push({
    position: [Math.sin(angle) * dist, 0, -Math.abs(Math.cos(angle) * dist)],
    scale: 0.8 + Math.random() * 0.5,
    type: 'deciduous'
  })
}

const PINE_TREES = []
for (let i = 0; i < 80; i++) {
  const angle = Math.random() * Math.PI * 0.5 // Bottom-Right SE quadrant
  const dist = 60 + Math.random() * 450
  PINE_TREES.push({
    position: [Math.abs(Math.sin(angle) * dist), 0, Math.abs(Math.cos(angle) * dist)],
    scale: 0.9 + Math.random() * 0.6,
    type: 'pine'
  })
}

const MOUNTAINS = []
for (let i = 0; i < 12; i++) {
  const angle = Math.random() * Math.PI * 0.4 // Far bottom right SE quadrant
  const dist = 250 + Math.random() * 400
  MOUNTAINS.push({
    position: [Math.abs(Math.sin(angle) * dist) + 50, -30, Math.abs(Math.cos(angle) * dist) + 50],
    scale: [80 + Math.random() * 80, 120 + Math.random() * 150, 80 + Math.random() * 80],
    rotation: [0, Math.random() * Math.PI, 0]
  })
}

const SKYSCRAPERS = []
for (let i = 0; i < 28; i++) {
  // Top-Left NW quadrant
  const x = -40 - (i % 5) * 80 + (Math.random() - 0.5) * 15
  const z = -40 - Math.floor(i / 5) * 80 + (Math.random() - 0.5) * 15
  const height = 20 + Math.random() * 55
  const width = 14 + Math.random() * 8
  SKYSCRAPERS.push({
    position: [x, 0, z],
    width,
    height,
    length: width
  })
}

const CACTI = []
for (let i = 0; i < 35; i++) {
  // Bottom-Left SW quadrant
  const x = -30 - Math.random() * 500
  const z = 30 + Math.random() * 500
  CACTI.push({
    position: [x, 0, z],
    scale: 1.0 + Math.random() * 1.2
  })
}

const DESERT_ROCKS = []
for (let i = 0; i < 35; i++) {
  const x = -30 - Math.random() * 500
  const z = 30 + Math.random() * 500
  DESERT_ROCKS.push({
    position: [x, -0.4, z],
    scale: 1.0 + Math.random() * 2.0,
    rotation: [Math.random(), Math.random(), 0]
  })
}

function Terrain() {
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(4000, 4000, 80, 80)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      // Large rolling hills + medium ridges + high-frequency ground bumps
      let h = Math.sin(x * 0.003) * Math.cos(y * 0.003) * 6.0 + 
              Math.sin(x * 0.015) * Math.cos(y * 0.015) * 1.5 +
              Math.sin(x * 0.08) * Math.cos(y * 0.08) * 0.35 + 
              Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.08
      
      // Flatten the city quadrant (NW) a bit for urban streets
      if (x < -10 && y > 10) {
        h *= 0.3;
      }
      pos.setZ(i, h)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  // Procedural satellite map ground textures mapping the 4 quadrants
  const terrainTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    // Default grass fill
    ctx.fillStyle = '#3f6212'
    ctx.fillRect(0, 0, 512, 512)

    // NW Quadrant (City) - Top Left in Canvas coordinates: X (0-256), Y (0-256)
    ctx.fillStyle = '#64748b' // concrete base
    ctx.fillRect(0, 0, 256, 256)
    // Draw city asphalt grid
    ctx.fillStyle = '#334155'
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(i * 45 + 10, 0, 6, 256)
      ctx.fillRect(0, i * 45 + 10, 256, 6)
    }

    // NE Quadrant (Village Fields) - Top Right in Canvas: X (256-512), Y (0-256)
    ctx.fillStyle = '#1e3a1e' // dark field grass
    ctx.fillRect(256, 0, 256, 256)
    ctx.fillStyle = '#166534' // crop rows
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(270 + i * 22, 10, 10, 236)
    }

    // SW Quadrant (Desert Sand) - Bottom Left in Canvas: X (0-256), Y (256-512)
    ctx.fillStyle = '#d97706' // warm desert sand
    ctx.fillRect(0, 256, 256, 256)
    // sand dunes details
    ctx.fillStyle = '#b45309'
    for (let i = 0; i < 15; i++) {
      ctx.beginPath()
      ctx.arc(Math.random() * 256, 256 + Math.random() * 256, 6 + Math.random() * 12, 0, Math.PI * 2)
      ctx.fill()
    }

    // SE Quadrant (Mountain Slate) - Bottom Right in Canvas: X (256-512), Y (256-512)
    ctx.fillStyle = '#475569' // cool slate rock
    ctx.fillRect(256, 256, 256, 256)
    
    // Clear landing pad base circle at the absolute center
    ctx.beginPath()
    ctx.arc(256, 256, 20, 0, Math.PI * 2)
    ctx.fillStyle = '#1e293b'
    ctx.fill()

    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }, [])

  return (
    <mesh geometry={terrainGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
      <meshStandardMaterial 
        map={terrainTexture}
        roughness={0.95} 
        metalness={0.01}
      />
    </mesh>
  )
}

function LandingPad() {
  return (
    <group position={[0, -0.6, 0]}>
      {/* Raised Concrete Helipad Foundation */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[10, 10.5, 0.2, 32]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
      
      {/* Dark Inner Grip Area */}
      <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[0, 9.2, 32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* Yellow Border Safety Ring */}
      <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[8.2, 9.2, 32]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.5} />
      </mesh>
      
      {/* Large Yellow "H" */}
      <group position={[0, 0.23, 0]}>
        <mesh position={[-2.2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 5.0]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.5} />
        </mesh>
        <mesh position={[2.2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 5.0]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.2, 1.2]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}

function Building({ position, width, height, length }) {
  return (
    <group position={position}>
      {/* Main skyscraper block */}
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Windows overlay */}
      <mesh position={[0, height / 2, length / 2 + 0.05]}>
        <planeGeometry args={[width * 0.8, height * 0.9]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} emissive="#38bdf8" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, height / 2, -length / 2 - 0.05]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width * 0.8, height * 0.9]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} emissive="#38bdf8" emissiveIntensity={0.15} />
      </mesh>
    </group>
  )
}

function Cactus({ position, scale }) {
  return (
    <group position={position} scale={scale}>
      {/* Main tall cylinder */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 2, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.3, 1.2, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </mesh>
      <mesh position={[-0.6, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.6, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.3, 0.9, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </mesh>
      <mesh position={[0.6, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.6, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Tree({ type, position, scale }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk with taper */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.22, 2.4, 8]} />
        <meshStandardMaterial color="#5c2d12" roughness={0.95} />
      </mesh>
      
      {type === 'pine' ? (
        // Layered Pine Spruce tree
        <group position={[0, 2.2, 0]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <coneGeometry args={[1.5, 2.0, 7]} />
            <meshStandardMaterial color="#0f3a20" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.3, 0]} castShadow>
            <coneGeometry args={[1.1, 1.6, 7]} />
            <meshStandardMaterial color="#14532d" roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.1, 0]} castShadow>
            <coneGeometry args={[0.7, 1.2, 7]} />
            <meshStandardMaterial color="#166534" roughness={0.8} />
          </mesh>
        </group>
      ) : (
        // Deciduous puff tree
        <group position={[0, 2.6, 0]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <dodecahedronGeometry args={[1.3, 1]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
          <mesh position={[-0.7, 0.2, 0.4]} castShadow>
            <dodecahedronGeometry args={[0.9, 1]} />
            <meshStandardMaterial color="#166534" roughness={0.8} />
          </mesh>
          <mesh position={[0.7, 0.3, -0.3]} castShadow>
            <dodecahedronGeometry args={[0.9, 1]} />
            <meshStandardMaterial color="#14532d" roughness={0.8} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function Mountain({ position, scale, rotation }) {
  return (
    <group position={position} scale={scale} rotation={rotation}>
      {/* Mountain Body */}
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#576574" roughness={0.9} flatShading />
      </mesh>
      {/* Snow Cap Peak */}
      <mesh position={[0, 0.55, 0]} scale={[0.85, 0.4, 0.85]} castShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>
    </group>
  )
}

function MountainRange() {
  return (
    <group>
      {MOUNTAINS.map((m, i) => (
        <Mountain key={i} position={m.position} scale={m.scale} rotation={m.rotation} />
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
      <color attach="background" args={['#bae6fd']} />
      <fog attach="fog" args={['#bae6fd', 500, 1800]} />
      <Sky distance={450000} sunPosition={[100, 150, 100]} inclination={0} azimuth={0.25} />
      
      <ambientLight intensity={1.3} />
      <directionalLight 
        position={[150, 300, 150]} 
        intensity={2.8} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      <Terrain />
      <LandingPad />
      <MountainRange />
      
      <group>
        {/* Render Village Assets (NE) */}
        {VILLAGE_TREES.map((v, i) => (
          <Tree key={i} {...v} />
        ))}
        <FarmComplex />

        {/* Render Mountain Pine Trees (SE) */}
        {PINE_TREES.map((p, i) => (
          <Tree key={i} {...p} />
        ))}

        {/* Render City Skyscrapers (NW) */}
        {SKYSCRAPERS.map((b, i) => (
          <Building key={i} {...b} />
        ))}

        {/* Render Desert Cacti & Rocks (SW) */}
        {CACTI.map((c, i) => (
          <Cactus key={i} {...c} />
        ))}
        {DESERT_ROCKS.map((r, i) => (
          <mesh key={i} position={r.position} scale={r.scale} rotation={r.rotation}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#a16207" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </>
  )
}
