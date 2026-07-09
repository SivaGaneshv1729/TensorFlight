import React, { useRef, useState, Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { Hexagon } from 'lucide-react'
import HUD from './components/HUD'
import VideoContainer from './components/VideoContainer'
import Sidebar from './components/Sidebar'
import TelemetryPanel from './components/TelemetryPanel'
import SettingsPanel from './components/SettingsPanel'
import ControllerPanel from './components/ControllerPanel'
import DroneViews from './components/DroneViews'
import Scene from './canvas/Scene'
import AIOverlay from './components/AIOverlay'
import { VIEW_CONFIGS } from './components/ViewComponents'
import AnalyticsDashboard from './components/AnalyticsDashboard'

// PERF: Lazy-load heavy MapView+Leaflet bundle only when Map tab is active
const MapView = lazy(() => import('./components/MapView'))

import useWebSocket from './useWebSocket'
import useKeyboardControls from './useKeyboardControls'
import useTelemetryStore from './store/useTelemetryStore'

function TopNavbar({ activeTab, setActiveTab }) {
  const telemetry = useTelemetryStore((state) => state.telemetry)
  const isConnected = telemetry.is_connected
  const lat = telemetry.drone_state.gps.latitude
  const lon = telemetry.drone_state.gps.longitude
  
  return (
    <div className="h-[60px] w-full bg-agri-bg border-b border-gray-700/50 flex items-center px-6 justify-between shrink-0 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 text-agri-primary font-bold text-lg">
           <Hexagon size={24} fill="currentColor" className="text-agri-primary" />
           <span className="tracking-wide text-white">AgriHUD</span>
        </div>
        <div className="flex gap-4 text-sm font-medium text-gray-400">
           <button onClick={() => setActiveTab('Controler')} className={`px-4 py-1.5 rounded-sm flex items-center gap-2 shadow-sm font-bold transition-colors ${activeTab === 'Controler' ? 'bg-white text-agri-bg' : 'hover:text-white'}`}>Controler</button>
           <button onClick={() => setActiveTab('Overview')} className={`px-4 py-1.5 rounded-sm flex items-center gap-2 shadow-sm font-bold transition-colors ${activeTab === 'Overview' ? 'bg-white text-agri-bg' : 'hover:text-white'}`}>Overview</button>
           <button onClick={() => setActiveTab('Analytics')} className={`px-4 py-1.5 rounded-sm flex items-center gap-2 shadow-sm font-bold transition-colors ${activeTab === 'Analytics' ? 'bg-white text-agri-bg' : 'hover:text-white'}`}>Analytics</button>
           <button className="px-4 py-1.5 hover:text-white flex items-center gap-2 transition-colors">Routes</button>
           <button className="px-4 py-1.5 hover:text-white flex items-center gap-2 transition-colors">All drones</button>
           <button onClick={() => setActiveTab('Map view')} className={`px-4 py-1.5 rounded-sm flex items-center gap-2 shadow-sm font-bold transition-colors ${activeTab === 'Map view' ? 'bg-white text-agri-bg' : 'hover:text-white'}`}>Map view</button>
        </div>
      </div>
      <div className="flex gap-4 text-sm font-medium">
         <div className="flex items-center gap-2 border border-gray-600 px-4 py-1.5 rounded-sm text-gray-300 bg-agri-dark/30">
            <span>{lat.toFixed(4)}, {lon.toFixed(4)}</span>
         </div>
         <div className="flex items-center gap-2 px-4 py-1.5 text-gray-300">
            <span>Rain, 36 °C</span>
         </div>
         <div className={`flex items-center gap-2 border px-4 py-1.5 rounded-sm font-bold ${isConnected ? 'border-agri-secondary/40 bg-agri-secondary/10 text-agri-secondary' : 'border-red-500/40 bg-red-500/10 text-red-500'}`}>
            <span>{isConnected ? 'UPLINK OK' : 'LINK LOST'}</span>
         </div>
         <div className="flex items-center gap-2 bg-agri-panel px-4 py-1.5 rounded-sm text-white font-bold border border-gray-600">
            <span>11:43 AM</span>
         </div>
      </div>
    </div>
  )
}

function App() {
  const container = useRef()
  useWebSocket()
  useKeyboardControls()
  const [activeTab, setActiveTab] = useState('Controler')
  const mainViewId = useTelemetryStore(s => s.mainViewId)
  
  return (
    <div ref={container} className="h-screen w-screen bg-[#282a2e] flex flex-col font-sans text-gray-200 overflow-hidden">
       {/* 1. TOP NAVBAR */}
       <TopNavbar activeTab={activeTab} setActiveTab={setActiveTab} />
       
       {/* 2. MAIN CONTENT AREA */}
       {activeTab === 'Controler' && (
         <div className="flex-1 p-4 grid grid-cols-12 grid-rows-10 gap-4 min-h-0 bg-[#282a2e] overflow-hidden">
            
            {/* Top Left (Drone Views) */}
            <div className="col-span-2 row-span-7 bg-[#34373a] rounded-lg p-3 flex flex-col shadow-lg border border-gray-700/30 overflow-hidden min-h-0">
               <div className="text-white font-bold mb-3 pl-1 shrink-0">Camera Feeds</div>
               <DroneViews />
            </div>

            {/* Top Center (Main Viewport) */}
            <div className="col-span-7 row-span-7 bg-[#1c1d21] rounded-lg relative overflow-hidden flex flex-col shadow-lg border border-gray-700/30 min-h-0">
               {React.createElement(VIEW_CONFIGS[mainViewId].Component)}
            </div>

            {/* Top Right (Sidebar - Master Controls) */}
            <div className="col-span-3 row-span-7 bg-[#34373a] rounded-lg p-5 flex flex-col shadow-lg border border-gray-700/30 overflow-hidden min-h-0">
               <Sidebar />
            </div>

            {/* Bottom Left (Telemetry & Diagnostics) */}
            <div className="col-span-5 row-span-3 bg-[#34373a] rounded-lg p-5 flex flex-col shadow-lg border border-gray-700/30 overflow-hidden min-h-0">
               <TelemetryPanel />
            </div>

            {/* Bottom Middle (Altitude/Velocity/Settings) */}
            <div className="col-span-4 row-span-3 bg-[#34373a] rounded-lg p-5 flex flex-col shadow-lg border border-gray-700/30 overflow-hidden min-h-0">
               <SettingsPanel />
            </div>

            {/* Bottom Right (Controller D-Pad) */}
            <div className="col-span-3 row-span-3 bg-[#34373a] rounded-lg p-5 flex flex-col shadow-lg border border-gray-700/30 overflow-hidden min-h-0">
               <ControllerPanel />
            </div>

         </div>
       )}

       {activeTab === 'Map view' && (
         <div className="flex-1 relative bg-black">
           <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-500">Loading map…</div>}>
             <MapView onClose={() => setActiveTab('Controler')} />
           </Suspense>
         </div>
       )}

       {activeTab === 'Overview' && (
         <div className="flex-1 p-8 overflow-y-auto">
            <h1 className="text-3xl text-white font-bold mb-8">System Overview</h1>
            <div className="grid grid-cols-2 gap-8">
               <div className="bg-[#34373a] rounded-lg p-6 h-96">
                  <TelemetryPanel />
               </div>
               <div className="bg-[#34373a] rounded-lg p-6 h-96">
                  <SettingsPanel />
               </div>
            </div>
         </div>
       )}

       {activeTab === 'Analytics' && (
         <AnalyticsDashboard />
       )}
    </div>
  )
}

export default App