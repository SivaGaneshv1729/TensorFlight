import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap, Circle } from 'react-leaflet'
import { X, Navigation } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
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
  const [selectedTarget, setSelectedTarget] = useState(null)
  
  const dronePos = [latitude, longitude]

  // Simulator Constants
  const homeLat = 41.7315;
  const homeLon = -93.8587;
  const latPerMeter = 1 / 111319;
  const lonPerMeter = 1 / (111319 * Math.cos(homeLat * Math.PI / 180));

  // Barn coordinates
  const barnLat = homeLat + (200 * latPerMeter);
  const barnLon = homeLon + (150 * lonPerMeter);

  // Generate 3D Trees on Map
  const trees = useMemo(() => {
    const veg = []
    for (let i = 0; i < 250; i++) {
      const angle = (i / 250) * Math.PI * 2 * 13
      const dist = 45 + (i * 6)
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist
      
      const tLat = homeLat + (-z * latPerMeter)
      const tLon = homeLon + (x * lonPerMeter)
      
      veg.push({ lat: tLat, lon: tLon, isPine: i % 3 === 0 })
    }
    return veg
  }, [homeLat, homeLon, latPerMeter, lonPerMeter])

  // Haversine formula to calculate distance in meters
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const handleMapClick = (latlng) => {
    setSelectedTarget({ lat: latlng.lat, lon: latlng.lng })
  }

  const setDestination = async () => {
    if (!selectedTarget) return
    const newWp = { ...selectedTarget }
    setWaypoints([newWp])
    
    try {
      await axios.post('/api/command', {
        action: 'GOTO_WAYPOINT',
        params: { lat: selectedTarget.lat, lon: selectedTarget.lon, alt: 15 }
      })
    } catch (err) {}
    setSelectedTarget(null)
  }

  const clearWaypoints = () => {
    setWaypoints([])
    setSelectedTarget(null)
  }

  const distance = selectedTarget ? getDistance(latitude, longitude, selectedTarget.lat, selectedTarget.lon) : 0;
  const etaSeconds = distance / 11.0; // Assume 11 m/s cruise speed

  return (
    <div className="absolute left-64 right-28 top-8 bottom-8 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 animate-in zoom-in-95 duration-200 flex flex-col pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/60 border-b border-white/10 z-[1000]">
        <div className="flex items-center gap-2">
          <Navigation size={16} className="text-agri-gold animate-pulse" />
          <span className="text-xs font-bold text-agri-gold uppercase tracking-widest">GCS Tactical Radar & Mission Planner</span>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={() => setForceCenter(true)}
             className="text-[10px] bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 transition-colors uppercase font-bold"
           >
             Center Drone
           </button>
           <button 
             onClick={clearWaypoints}
             className="text-[10px] bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/30 transition-colors uppercase font-bold"
           >
             Reset Mission
           </button>
           <button onClick={onClose} className="text-gray-400 hover:text-white ml-3">
             <X size={20} />
           </button>
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 z-0 relative">
        <MapContainer 
          center={dronePos[0] !== 0 ? dronePos : [homeLat, homeLon]} 
          zoom={18} 
          scrollWheelZoom={true}
          className="w-full h-full"
          zoomControl={false}
        >
          {/* Radar Dark Map Style */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            maxZoom={20}
          />
          
          <MapController center={dronePos} forceCenter={forceCenter} onCentered={() => setForceCenter(false)} />
          <MapClickHandler onMapClick={handleMapClick} />

          {/* 3D Trees mapped on 2D Radar */}
          {trees.map((tree, idx) => (
            <Circle 
              key={idx} 
              center={[tree.lat, tree.lon]} 
              radius={tree.isPine ? 2 : 2.5} 
              color={tree.isPine ? "#0f3a20" : "#166534"} 
              fillColor={tree.isPine ? "#0f3a20" : "#166534"} 
              fillOpacity={0.7} 
              weight={1}
            />
          ))}

          {/* Farm Barn Complex on Radar */}
          <Circle center={[barnLat, barnLon]} radius={15} color="#b91c1c" fillColor="#b91c1c" fillOpacity={0.5} />
          
          {/* Helipad Home Base Ring */}
          <Circle center={[homeLat, homeLon]} radius={7.5} color="#eab308" fillColor="#eab308" fillOpacity={0.15} weight={2} />

          {/* Active Target Preview Route */}
          {selectedTarget && (
            <Polyline 
              positions={[dronePos, [selectedTarget.lat, selectedTarget.lon]]} 
              color="#eab308" 
              dashArray="6, 8"
              weight={3}
            />
          )}

          {/* Active Drone Mission Path */}
          <Polyline 
            positions={[dronePos, ...waypoints.map(wp => [wp.lat, wp.lon])]} 
            color="#00ffcc" 
            dashArray="4, 6"
            weight={2.5}
          />

          {/* Selected Waypoint Marker */}
          {selectedTarget && (
            <Marker 
              position={[selectedTarget.lat, selectedTarget.lon]} 
              icon={new L.DivIcon({
                html: `<div class="animate-bounce text-agri-gold"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3.5"/></svg></div>`,
                className: 'target-marker',
                iconSize: [28, 28],
                iconAnchor: [14, 28]
              })}
            />
          )}

          {/* Live Drone Icon */}
          <Marker 
            position={dronePos} 
            icon={new L.DivIcon({
              html: `<div style="transform: rotate(${heading}deg); transition: transform 0.1s;"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#00ffcc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>`,
              className: 'drone-marker',
              iconSize: [34, 34],
              iconAnchor: [17, 17]
            })}
          />
        </MapContainer>

        {/* Selected Destination Panel */}
        {selectedTarget && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 z-[1000] w-80 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <div className="text-[10px] font-bold text-agri-gold uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-agri-gold animate-ping" /> Target Selected
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-300 bg-white/5 p-2 rounded-lg border border-white/5">
              <div>LAT: <span className="text-white">{selectedTarget.lat.toFixed(6)}</span></div>
              <div>LON: <span className="text-white">{selectedTarget.lon.toFixed(6)}</span></div>
              <div>DIST: <span className="text-agri-neon font-bold">{distance.toFixed(1)}m</span></div>
              <div>ETA: <span className="text-blue-400 font-bold">{etaSeconds.toFixed(1)}s</span></div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={setDestination}
                className="flex-1 bg-agri-gold hover:bg-yellow-500 text-black font-extrabold text-[10px] py-2 rounded-xl transition-colors uppercase tracking-wider"
              >
                Set Destination
              </button>
              <button 
                onClick={() => setSelectedTarget(null)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] px-4 py-2 rounded-xl transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* CSS Radar Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#00ffcc_0.5px,transparent_0.5px)] [background-size:24px_24px] pointer-events-none z-[400] opacity-[0.15]" />
      </div>

      {/* Footer Info */}
      <div className="bg-black/90 px-4 py-2 border-t border-white/5 font-mono text-[10px] flex justify-between text-gray-400 z-[1000]">
        <span>Drone Pos: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
        <span className="text-agri-neon animate-pulse font-bold">RADAR TELEMETRY LINKED</span>
      </div>
    </div>
  )
}
