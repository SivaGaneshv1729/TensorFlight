import React, { useMemo } from 'react'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'

// SHARED WORLD DATA - Ensures consistency across all cameras
const COLORS = {
  grass: '#3f6212', // Lush field green
  bark: '#451a03',
  leaves: '#166534',
  pine: '#14532d'
}

// Deterministic placement for trees
const VEGETATION = []
for (let i = 0; i < 250; i++) {
  const angle = (i / 250) * Math.PI * 2 * 13
  const dist = 45 + (i * 6)
  VEGETATION.push({
    position: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
    scale: 0.9 + (i % 7) * 0.3,
    type: i % 3 === 0 ? 'pine' : 'deciduous'
  })
}

// Mountain peaks for the horizon
const MOUNTAINS = []
for (let i = 0; i < 16; i++) {
  const angle = (i / 16) * Math.PI * 2
  const dist = 1400 + Math.random() * 200
  MOUNTAINS.push({
    position: [Math.cos(angle) * dist, -50, Math.sin(angle) * dist],
    scale: [250 + Math.random() * 200, 350 + Math.random() * 400, 250 + Math.random() * 200],
    rotation: [0, Math.random() * Math.PI, 0]
  })
}

function Terrain() {
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(4000, 4000, 80, 80) // High vertex count for bump detail
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      // Large rolling hills + medium ridges + high-frequency ground bumps
      const h = Math.sin(x * 0.003) * Math.cos(y * 0.003) * 6.0 + 
                Math.sin(x * 0.015) * Math.cos(y * 0.015) * 1.5 +
                Math.sin(x * 0.08) * Math.cos(y * 0.08) * 0.35 + 
                Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.08
      pos.setZ(i, h)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  // Procedural canvas texture to create dirt patches and variable grass coloration
  const terrainTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    // Base grass color
    ctx.fillStyle = '#3f6212'
    ctx.fillRect(0, 0, 512, 512)
    
    // Draw dirt and dry grass patches
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const r = 8 + Math.random() * 32
      
      // Alternate between soil/dirt and dry yellowish grass patches
      ctx.fillStyle = Math.random() > 0.5 ? '#543e2b' : '#556b2f'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(30, 30) // Tile across terrain
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

function CropField({ x, z, width, length, color1, color2, stripes }) {
  const fieldGeo = useMemo(() => new THREE.PlaneGeometry(width, length), [width, length])
  const uniforms = useMemo(() => ({
    color1: { value: new THREE.Color(color1) },
    color2: { value: new THREE.Color(color2) },
    stripes: { value: stripes }
  }), [color1, color2, stripes])

  return (
    <mesh geometry={fieldGeo} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.58, z]} receiveShadow>
      <shaderMaterial
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform vec3 color1;
          uniform vec3 color2;
          uniform float stripes;
          void main() {
            float stripe = step(0.5, fract(vUv.x * stripes));
            vec3 finalColor = mix(color1, color2, stripe);
            gl_FragColor = vec4(finalColor, 1.0);
          }
        `}
        uniforms={uniforms}
      />
    </mesh>
  )
}

function FarmFields() {
  const fieldsData = useMemo(() => {
    const list = []
    const colors = [
      { color1: '#14532d', color2: '#166534', stripes: 35.0 }, // Dark green crops
      { color1: '#15803d', color2: '#22c55e', stripes: 25.0 }, // Light green crops
      { color1: '#7c2d12', color2: '#9a3412', stripes: 15.0 }, // Soil/Tilled rows
      { color1: '#854d0e', color2: '#a16207', stripes: 20.0 }  // Wheat/Golden rows
    ]
    
    // Create an 8x8 grid of farm fields
    for (let r = -4; r < 4; r++) {
      for (let c = -4; c < 4; c++) {
        // Skip the landing center point
        if (r === 0 && c === 0) continue;
        
        const x = c * 160 + (Math.random() - 0.5) * 20
        const z = r * 160 + (Math.random() - 0.5) * 20
        const width = 120 + Math.random() * 20
        const length = 120 + Math.random() * 20
        const config = colors[Math.abs(r + c) % colors.length]
        
        list.push({
          x,
          z,
          width,
          length,
          ...config
        })
      }
    }
    return list
  }, [])

  return (
    <group>
      {fieldsData.map((f, i) => (
        <CropField key={i} {...f} />
      ))}
    </group>
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

function Tree({ type, position, scale }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk with slight taper */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.22, 2.4, 8]} />
        <meshStandardMaterial color={COLORS.bark} roughness={0.95} />
      </mesh>
      
      {type === 'pine' ? (
        // Layered Pine Spruce Tree
        <group position={[0, 2.2, 0]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <coneGeometry args={[1.5, 2.0, 7]} />
            <meshStandardMaterial color="#0f3a20" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.3, 0]} castShadow>
            <coneGeometry args={[1.1, 1.6, 7]} />
            <meshStandardMaterial color={COLORS.pine} roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.1, 0]} castShadow>
            <coneGeometry args={[0.7, 1.2, 7]} />
            <meshStandardMaterial color="#166534" roughness={0.8} />
          </mesh>
        </group>
      ) : (
        // Organic Deciduous Tree using overlapping geodesic puffs
        <group position={[0, 2.6, 0]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <dodecahedronGeometry args={[1.3, 1]} />
            <meshStandardMaterial color={COLORS.leaves} roughness={0.8} />
          </mesh>
          <mesh position={[-0.7, 0.2, 0.4]} castShadow>
            <dodecahedronGeometry args={[0.9, 1]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
          <mesh position={[0.7, 0.3, -0.3]} castShadow>
            <dodecahedronGeometry args={[0.9, 1]} />
            <meshStandardMaterial color="#14532d" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.2, 0]} castShadow>
            <dodecahedronGeometry args={[0.8, 1]} />
            <meshStandardMaterial color="#16a34a" roughness={0.8} />
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
      <FarmFields />
      <LandingPad />
      <MountainRange />
      
      <group>
        {VEGETATION.map((v, i) => (
          <Tree key={i} {...v} />
        ))}
        <FarmComplex />
        
        {/* Scattered Rocks */}
        {[...Array(50)].map((_, i) => (
          <mesh key={i} position={[(i * 47) % 1000 - 500, -0.4, (i * 31) % 1000 - 500]} rotation={[Math.random(), Math.random(), 0]}>
            <dodecahedronGeometry args={[1 + Math.random() * 1.5, 0]} />
            <meshStandardMaterial color="#64748b" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </>
  )
}
