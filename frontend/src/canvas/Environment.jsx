import React, { useMemo } from 'react'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'

// Utility for deterministic randomness
function seedRandom(i, seed) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

// Generate a massive array of obstacles
const PALETTE = [
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#eab308', // Yellow
  '#ef4444', // Red
  '#84cc16'  // Lime
];

const OBSTACLES = []
for (let i = 0; i < 600; i++) {
  const x = (seedRandom(i, 1) - 0.5) * 800;
  const z = (seedRandom(i, 2) - 0.5) * 800;
  
  // Keep a safe zone around the origin (landing pad)
  if (Math.abs(x) < 40 && Math.abs(z) < 40) continue;

  const isTower = seedRandom(i, 3) > 0.85;
  const width = 4 + seedRandom(i, 4) * 12;
  const height = isTower ? 40 + seedRandom(i, 5) * 100 : 10 + seedRandom(i, 6) * 20;
  const depth = 4 + seedRandom(i, 7) * 12;

  const colorIndex = Math.floor(seedRandom(i, 8) * PALETTE.length);

  OBSTACLES.push({
    position: [x, height / 2 - 0.6, z],
    args: [width, height, depth],
    color: PALETTE[colorIndex]
  })
}

function Terrain() {
  // Create a massive grid texture for the floor
  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    ctx.fillStyle = '#0f172a' // Very dark blue/gray base
    ctx.fillRect(0, 0, 512, 512)
    
    ctx.strokeStyle = '#10b981' // Emerald grid lines
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 2
    
    // Draw grid
    for (let i = 0; i <= 512; i += 64) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 512)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(512, i)
      ctx.stroke()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(100, 100) // Repeat across the vast plane
    return texture
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
      <planeGeometry args={[8000, 8000]} />
      <meshStandardMaterial 
        map={gridTexture}
        roughness={0.9} 
        metalness={0.1}
      />
    </mesh>
  )
}

function LandingPad() {
  return (
    <group position={[0, -0.55, 0]}>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[15, 32]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[13, 14, 32]} />
        <meshStandardMaterial color="#10b981" roughness={0.5} emissive="#10b981" emissiveIntensity={0.5} />
      </mesh>
      {/* Central H */}
      <group position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh position={[-3, 0, 0]}>
          <planeGeometry args={[1.5, 8]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[3, 0, 0]}>
          <planeGeometry args={[1.5, 8]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[4.5, 1.5]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  )
}

export default function Environment({ simplified = false, showBackground = true }) {
  if (simplified) {
    return (
      <>
        {showBackground && <color attach="background" args={['#0f172a']} />}
        <ambientLight intensity={1.5} />
        <Terrain />
        <LandingPad />
        <group>
          {OBSTACLES.map((obs, i) => (
            <mesh key={i} position={obs.position} castShadow receiveShadow>
              <boxGeometry args={obs.args} />
              <meshStandardMaterial color={obs.color} roughness={0.7} />
            </mesh>
          ))}
        </group>
      </>
    )
  }

  return (
    <>
      {showBackground && <color attach="background" args={['#0f172a']} />}
      {showBackground && <fog attach="fog" args={['#0f172a', 50, 800]} />}
      {showBackground && <Sky distance={450000} sunPosition={[0, 50, -100]} inclination={0} azimuth={0.25} turbidity={10} rayleigh={2} mieCoefficient={0.005} />}
      
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[100, 200, 50]} 
        intensity={2.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      <directionalLight position={[-100, 50, -50]} intensity={0.5} color="#10b981" />
      
      <Terrain />
      <LandingPad />
      
      <group>
        {OBSTACLES.map((obs, i) => (
          <mesh key={i} position={obs.position} castShadow receiveShadow>
            <boxGeometry args={obs.args} />
            <meshStandardMaterial color={obs.color} roughness={0.4} metalness={0.3} />
            {/* Add an edge highlight to make them pop against the dark background */}
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(...obs.args)]} />
              <lineBasicMaterial color="#ffffff" opacity={0.2} transparent />
            </lineSegments>
          </mesh>
        ))}
      </group>
    </>
  )
}
