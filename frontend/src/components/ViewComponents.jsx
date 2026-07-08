import React, { useRef, memo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import useTelemetryStore from '../store/useTelemetryStore'
import Scene from '../canvas/Scene'
import Environment from '../canvas/Environment'
import VideoContainer from './VideoContainer'
import AIOverlay from './AIOverlay'
import HUD from './HUD'

const glConfigLow = { antialias: false, powerPreference: 'low-power', depth: true, stencil: false }
const glConfigHigh = { antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' }

const cameraConfigs = {
  front: { position: [0, 0, -1], rotation: [0, 0, 0] },
  back:  { position: [0, 0,  1], rotation: [0, Math.PI, 0] },
}

function FPVScene({ type }) {
  const groupRef = useRef()
  const homeRef = useRef(null)
  const camCfg = cameraConfigs[type] || cameraConfigs.front

  useFrame(() => {
    if (!groupRef.current) return
    const telemetry = useTelemetryStore.getState().telemetry
    const { pitch = 0, roll = 0, yaw_heading = 0 } = telemetry.drone_state.orientation_deg || {}
    const { latitude = 0, longitude = 0, altitude_relative_m: alt = 0 } = telemetry.drone_state.gps || {}
    
    if (!homeRef.current && latitude !== 0) homeRef.current = { lat: latitude, lon: longitude }
    
    const lp = 0.08
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, THREE.MathUtils.degToRad(pitch * 0.25), lp)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, THREE.MathUtils.degToRad(-yaw_heading), lp)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, THREE.MathUtils.degToRad(-roll * 0.25), lp)
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, alt + 1.8, lp)
    if (homeRef.current) {
      const posX = (longitude - homeRef.current.lon) * 111319 * Math.cos(latitude * Math.PI / 180)
      const posZ = -(latitude - homeRef.current.lat) * 111319
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, posX, lp)
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, posZ, lp)
    }
  })

  return (
    <group ref={groupRef}>
      <PerspectiveCamera makeDefault position={camCfg.position} rotation={camCfg.rotation} fov={80} far={2000} />
    </group>
  )
}

export const View3D = memo(function View3D() {
  return (
    <>
      <div className="absolute inset-0 z-10">
        <Canvas shadows={false} dpr={[1, 1.5]} gl={glConfigHigh}>
          <Scene />
        </Canvas>
      </div>
      <div className="absolute inset-0 z-20 pointer-events-none">
        <HUD />
      </div>
    </>
  )
})

export const ViewFront = memo(function ViewFront() {
  return (
    <div className="absolute inset-0 z-10 bg-black/40">
      <Canvas dpr={1} frameloop="always" gl={glConfigLow}>
        <ambientLight intensity={1.2} />
        <Environment showBackground={true} simplified />
        <FPVScene type="front" />
      </Canvas>
    </div>
  )
})

export const ViewBack = memo(function ViewBack() {
  return (
    <div className="absolute inset-0 z-10 bg-black/40">
      <Canvas dpr={1} frameloop="always" gl={glConfigLow}>
        <ambientLight intensity={1.2} />
        <Environment showBackground={true} simplified />
        <FPVScene type="back" />
      </Canvas>
    </div>
  )
})

export const ViewNadir = memo(function ViewNadir() {
  return (
    <div className="absolute inset-0 z-10 bg-black/40">
      <VideoContainer />
      <AIOverlay />
    </div>
  )
})

export const VIEW_CONFIGS = {
  '3d': { id: '3d', title: '3D Map View', Component: View3D },
  'front': { id: 'front', title: 'Forward View', Component: ViewFront },
  'back': { id: 'back', title: 'Rear View', Component: ViewBack },
  'nadir': { id: 'nadir', title: 'Nadir View (ML)', Component: ViewNadir },
}
