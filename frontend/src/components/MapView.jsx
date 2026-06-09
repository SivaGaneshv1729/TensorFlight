import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap, Circle } from 'react-leaflet'
import { X } from 'lucide-react'
import L from 'leaflet'
import axios from 'axios'
import useTelemetryStore from '../store/useTelemetryStore'

// Fix for default marker icons in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Drone Icon
const droneIcon = new L.DivIcon({
  html: `<div style="transform: rotate(0deg); transition: transform 0.2s;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ffcc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>`,
  className: 'drone-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

function MapController({ center, forceCenter, onCentered }) {
  const map = useMap();
  const [hasCentered, setHasCentered] = useState(false);

  useEffect(() => {
    if (center[0] !== 0 && (!hasCentered || forceCenter)) {
      map.setView(center, map.getZoom(), { animate: true });
      if (!hasCentered) setHasCentered(true);
      if (forceCenter) onCentered();
    }
  }, [center, map, hasCentered, forceCenter, onCentered]);

  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function MapView({ onClose }) {
  const { latitude, longitude } = useTelemetryStore((state) => state.telemetry.drone_state.gps)
  const heading = useTelemetryStore((state) => state.telemetry.drone_state.orientation_deg.yaw_heading)
  const [waypoints, setWaypoints] = useState([])
  const [forceCenter, setForceCenter] = useState(false)
  
  const dronePos = [latitude, longitude]

  // Simulator Objects (calculated from Home GPS)
  const homeLat = 41.7315;
  const homeLon = -93.8587;
  const latPerMeter = 1 / 111319;
  const lonPerMeter = 1 / (111319 * Math.cos(homeLat * Math.PI / 180));

  // Barn is at X=150, Z=-200 in 3D (where +Z is South, so -200 is North)
  const barnLat = homeLat + (200 * latPerMeter);
  const barnLon = homeLon + (150 * lonPerMeter);

  // Generate the exact same trees as the 3D Environment
  const trees = useMemo(() => {
    const veg = []
    for (let i = 0; i < 200; i++) {
      const angle = (i / 200) * Math.PI * 2 * 11
      const dist = 60 + (i * 7)
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist
      
      // Translate 3D (x, z) to GPS (lat, lon). Note: -z is North (+lat), +x is East (+lon)
      const tLat = homeLat + (-z * latPerMeter)
      const tLon = homeLon + (x * lonPerMeter)
      
      veg.push({ lat: tLat, lon: tLon, isPine: i % 3 === 0 })
    }
    return veg
  }, [homeLat, homeLon, latPerMeter, lonPerMeter])

  const handleMapClick = async (latlng) => {
    const newWp = { lat: latlng.lat, lon: latlng.lng }
    setWaypoints([...waypoints, newWp])
    
    try {
      await axios.post('/api/command', {
        action: 'GOTO_WAYPOINT',
        params: { lat: latlng.lat, lon: latlng.lng, alt: 15 }
      })
    } catch (err) {}
  }

  const clearWaypoints = () => setWaypoints([])

  return (
    <div className="absolute right-28 top-8 w-[400px] h-[400px] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col pointer-events-auto">
      <div className="flex justify-between items-center p-3 bg-black/60 border-b border-white/10 z-[1000]">
        <span className="text-[10px] font-bold text-agri-gold uppercase tracking-widest">Simulator Tactical Map</span>
        <div className="flex gap-2">
           <button 
             onClick={() => setForceCenter(true)}
             className="text-[8px] bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 px-2 py-1 rounded border border-blue-500/30 transition-colors uppercase font-bold"
           >
             Center
           </button>
           <button 
             onClick={clearWaypoints}
             className="text-[8px] bg-red-500/20 hover:bg-red-500/40 text-red-400 px-2 py-1 rounded border border-red-500/30 transition-colors uppercase font-bold"
           >
             Clear
           </button>
           <button onClick={onClose} className="text-gray-400 hover:text-white ml-2">
             <X size={16} />
           </button>
        </div>
      </div>

      <div className="flex-1 z-0 relative">
        <MapContainer 
          center={dronePos[0] !== 0 ? dronePos : [homeLat, homeLon]} 
          zoom={18} 
          scrollWheelZoom={true}
          className="w-full h-full"
          zoomControl={false}
        >
          {/* Radar Style Dark Map */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            maxZoom={20}
          />
          
          <MapController center={dronePos} forceCenter={forceCenter} onCentered={() => setForceCenter(false)} />
          <MapClickHandler onMapClick={handleMapClick} />

          {/* Render the 3D Trees on the 2D Map! */}
          {trees.map((tree, idx) => (
            <Circle 
              key={idx} 
              center={[tree.lat, tree.lon]} 
              radius={tree.isPine ? 2 : 2.5} 
              color={tree.isPine ? "#064e3b" : "#065f46"} 
              fillColor={tree.isPine ? "#064e3b" : "#065f46"} 
              fillOpacity={0.8} 
              weight={1}
            />
          ))}

          {/* Render the 3D Farm Complex on the 2D Map! */}
          <Circle center={[barnLat, barnLon]} radius={15} color="#b91c1c" fillColor="#b91c1c" fillOpacity={0.6} />

          {/* Drone Path */}
          <Polyline 
            positions={[dronePos, ...waypoints.map(wp => [wp.lat, wp.lon])]} 
            color="#00ffcc" 
            dashArray="5, 10"
            weight={2}
          />

          {/* Current Drone Position */}
          <Marker 
            position={dronePos} 
            icon={new L.DivIcon({
              html: `<div style="transform: rotate(${heading}deg); transition: transform 0.1s;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ffcc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>`,
              className: 'drone-marker',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}
          />
        </MapContainer>
        
        {/* CSS Radar Grid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none z-[400] opacity-30" />
      </div>

      <div className="bg-black/90 p-2 border-t border-white/5 font-mono text-[9px] flex justify-between text-gray-400 z-[1000]">
        <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
        <span className="text-agri-neon animate-pulse">RADAR ACTIVE</span>
      </div>
    </div>
  )
}
