import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap, Circle, Rectangle, Polygon } from 'react-leaflet'
import { X, Navigation, Brain } from 'lucide-react'
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
  
  // AI Path Planner States
  const [plannerMode, setPlannerMode] = useState(false)
  const [polygon, setPolygon] = useState([])
  const [aiPath, setAiPath] = useState([])

  const dronePos = [latitude, longitude]

  // GPS conversion coefficients
  const homeLat = 41.7315;
  const homeLon = -93.8587;
  const latPerMeter = 1 / 111319;
  const lonPerMeter = 1 / (111319 * mathCos(homeLat));

  function mathCos(deg) {
    return Math.cos(deg * Math.PI / 180);
  }

  // 4 Quadrants bounds
  const cityBounds = [[homeLat, homeLon - 600 * lonPerMeter], [homeLat + 600 * latPerMeter, homeLon]];
  const villageBounds = [[homeLat, homeLon], [homeLat + 600 * latPerMeter, homeLon + 600 * lonPerMeter]];
  const desertBounds = [[homeLat - 600 * latPerMeter, homeLon - 600 * lonPerMeter], [homeLat, homeLon]];
  const mountainBounds = [[homeLat - 600 * latPerMeter, homeLon], [homeLat, homeLon + 600 * lonPerMeter]];

  // Barn coordinates
  const barnLat = homeLat + (200 * latPerMeter);
  const barnLon = homeLon + (150 * lonPerMeter);

  // Mapped 3D Assets coordinates for 2D overlays
  const villageTrees = useMemo(() => {
    const list = []
    for (let i = 0; i < 80; i++) {
      const angle = (i / 80) * Math.PI * 0.5 + Math.PI
      const dist = 50 + (i * 6)
      const x = Math.sin(angle) * dist
      const z = -Math.abs(Math.cos(angle) * dist)
      list.push({ lat: homeLat + (-z * latPerMeter), lon: homeLon + (x * lonPerMeter) })
    }
    return list
  }, [homeLat, homeLon, latPerMeter, lonPerMeter])

  const pineTrees = useMemo(() => {
    const list = []
    for (let i = 0; i < 80; i++) {
      const angle = (i / 80) * Math.PI * 0.5
      const dist = 60 + (i * 5.5)
      const x = Math.abs(Math.sin(angle) * dist)
      const z = Math.abs(Math.cos(angle) * dist)
      list.push({ lat: homeLat + (-z * latPerMeter), lon: homeLon + (x * lonPerMeter) })
    }
    return list
  }, [homeLat, homeLon, latPerMeter, lonPerMeter])

  const mountains = useMemo(() => {
    const list = []
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 0.4
      const dist = 250 + (i * 30)
      const x = Math.abs(Math.sin(angle) * dist) + 50
      const z = Math.abs(Math.cos(angle) * dist) + 50
      list.push({ lat: homeLat + (-z * latPerMeter), lon: homeLon + (x * lonPerMeter) })
    }
    return list
  }, [homeLat, homeLon, latPerMeter, lonPerMeter])

  const skyscrapers = useMemo(() => {
    const list = []
    for (let i = 0; i < 28; i++) {
      const x = -40 - (i % 5) * 80
      const z = -40 - Math.floor(i / 5) * 80
      list.push({
        lat: homeLat + (-z * latPerMeter),
        lon: homeLon + (x * lonPerMeter),
        width: 14,
        length: 14
      })
    }
    return list
  }, [homeLat, homeLon, latPerMeter, lonPerMeter])

  const cacti = useMemo(() => {
    const list = []
    for (let i = 0; i < 35; i++) {
      const angle = (i / 35) * Math.PI * 2
      const dist = 30 + (i * 12)
      const x = -30 - Math.abs(Math.sin(angle) * dist)
      const z = 30 + Math.abs(Math.cos(angle) * dist)
      list.push({ lat: homeLat + (-z * latPerMeter), lon: homeLon + (x * lonPerMeter) })
    }
    return list
  }, [homeLat, homeLon, latPerMeter, lonPerMeter])

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
    if (plannerMode) {
      setPolygon([...polygon, { lat: latlng.lat, lon: latlng.lng }])
    } else {
      setSelectedTarget({ lat: latlng.lat, lon: latlng.lng })
    }
  }

  // AI Lawnmower path generator
  const generateLawnmowerPath = () => {
    if (polygon.length < 3) return;
    
    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    polygon.forEach(p => {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lon < minLon) minLon = p.lon;
      if (p.lon > maxLon) maxLon = p.lon;
    });

    const rowSpacing = 22 * latPerMeter; // Spacing between search passes (22 meters)
    const path = [];
    let direction = true;

    // Ray casting point-in-polygon helper
    const isPointInPolygon = (point, vs) => {
      const x = point.lon, y = point.lat;
      let inside = false;
      for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i].lon, yi = vs[i].lat;
        const xj = vs[j].lon, yj = vs[j].lat;
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    for (let currLat = minLat + rowSpacing/2; currLat <= maxLat; currLat += rowSpacing) {
      const rowPoints = [];
      const steps = 20;
      for (let s = 0; s <= steps; s++) {
        const currLon = minLon + (maxLon - minLon) * (s / steps);
        const pt = { lat: currLat, lon: currLon };
        if (isPointInPolygon(pt, polygon)) {
          rowPoints.push(pt);
        }
      }

      if (rowPoints.length >= 2) {
        const segment = [rowPoints[0], rowPoints[rowPoints.length - 1]];
        if (!direction) {
          segment.reverse();
        }
        path.push(...segment);
        direction = !direction;
      }
    }
    setAiPath(path);
  }

  const uploadAiPath = async () => {
    if (aiPath.length === 0) return;
    setWaypoints(aiPath);
    try {
      await axios.post('/api/command', {
        action: 'GOTO_WAYPOINTS',
        params: { waypoints: aiPath }
      })
    } catch (err) {}
    // Reset planner states
    setPolygon([]);
    setAiPath([]);
    setPlannerMode(false);
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
    setPolygon([])
    setAiPath([])
    setSelectedTarget(null)
  }

  const distance = selectedTarget ? getDistance(latitude, longitude, selectedTarget.lat, selectedTarget.lon) : 0;
  const etaSeconds = distance / 11.0;

  return (
    <div className="absolute left-64 right-28 top-8 bottom-8 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 animate-in zoom-in-95 duration-200 flex flex-col pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/60 border-b border-white/10 z-[1000]">
        <div className="flex items-center gap-2">
          <Navigation size={16} className="text-agri-gold animate-pulse" />
          <span className="text-xs font-bold text-agri-gold uppercase tracking-widest font-sans">GCS High-Res Satellite Tactical Planner</span>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={() => { setPlannerMode(!plannerMode); clearWaypoints(); }}
             className={`text-[10px] px-3 py-1.5 rounded-lg border transition-colors uppercase font-bold flex items-center gap-1 ${plannerMode ? 'bg-agri-gold/20 text-agri-gold border-agri-gold/40' : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'}`}
           >
             <Brain size={12} /> {plannerMode ? 'Exit AI Planner' : 'AI Path Planner'}
           </button>
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
          zoom={16} 
          scrollWheelZoom={true}
          className="w-full h-full"
          zoomControl={false}
        >
          {/* Esri World Imagery Satellite Tiles */}
          <TileLayer
            attribution='&copy; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          
          <MapController center={dronePos} forceCenter={forceCenter} onCentered={() => setForceCenter(false)} />
          <MapClickHandler onMapClick={handleMapClick} />

          {/* 4 Quadrants Visual Overlays */}
          <Rectangle bounds={cityBounds} color="#64748b" weight={1.5} fillOpacity={0.15} dashArray="5,5" />
          <Rectangle bounds={villageBounds} color="#166534" weight={1.5} fillOpacity={0.15} dashArray="5,5" />
          <Rectangle bounds={desertBounds} color="#d97706" weight={1.5} fillOpacity={0.15} dashArray="5,5" />
          <Rectangle bounds={mountainBounds} color="#475569" weight={1.5} fillOpacity={0.15} dashArray="5,5" />

          {/* Render Deciduous Trees (NE) */}
          {villageTrees.map((tree, idx) => (
            <Circle key={`vt-${idx}`} center={[tree.lat, tree.lon]} radius={3} color="#15803d" fillColor="#15803d" fillOpacity={0.8} weight={0.5} />
          ))}

          {/* Render Pine Trees (SE) */}
          {pineTrees.map((tree, idx) => (
            <Circle key={`pt-${idx}`} center={[tree.lat, tree.lon]} radius={2.5} color="#0f3a20" fillColor="#0f3a20" fillOpacity={0.85} weight={0.5} />
          ))}

          {/* Render Mountains (SE) */}
          {mountains.map((mnt, idx) => (
            <Circle key={`mnt-${idx}`} center={[mnt.lat, mnt.lon]} radius={20} color="#475569" fillColor="#64748b" fillOpacity={0.5} weight={1.5} />
          ))}

          {/* Render Cacti (SW) */}
          {cacti.map((cct, idx) => (
            <Circle key={`cct-${idx}`} center={[cct.lat, cct.lon]} radius={1.5} color="#16a34a" fillColor="#16a34a" fillOpacity={0.9} weight={0.5} />
          ))}

          {/* Render Skyscrapers (NW) */}
          {skyscrapers.map((sky, idx) => (
            <Rectangle 
              key={`sky-${idx}`} 
              bounds={[
                [sky.lat - (sky.length / 2) * latPerMeter, sky.lon - (sky.width / 2) * lonPerMeter], 
                [sky.lat + (sky.length / 2) * latPerMeter, sky.lon + (sky.width / 2) * lonPerMeter]
              ]} 
              color="#334155" 
              fillColor="#475569" 
              fillOpacity={0.7} 
              weight={1} 
            />
          ))}

          {/* Farm Barn (NE) */}
          <Circle center={[barnLat, barnLon]} radius={15} color="#b91c1c" fillColor="#b91c1c" fillOpacity={0.6} weight={1} />
          
          {/* Center Helipad Ring */}
          <Circle center={[homeLat, homeLon]} radius={10} color="#fbbf24" fillColor="#1e293b" fillOpacity={0.4} weight={2.5} />

          {/* Waypoint Destination Preview Line */}
          {selectedTarget && (
            <Polyline 
              positions={[dronePos, [selectedTarget.lat, selectedTarget.lon]]} 
              color="#fbbf24" 
              dashArray="6, 8"
              weight={3}
            />
          )}

          {/* Drone Active Path */}
          <Polyline 
            positions={[dronePos, ...waypoints.map(wp => [wp.lat, wp.lon])]} 
            color="#00ffcc" 
            dashArray="4, 6"
            weight={2.5}
          />

          {/* AI Path Planner Drawings */}
          {polygon.length > 0 && (
            <Polygon 
              positions={polygon.map(p => [p.lat, p.lon])} 
              color="#fbbf24" 
              fillColor="#fbbf24" 
              fillOpacity={0.15} 
              weight={1.5}
              dashArray="4, 4"
            />
          )}

          {aiPath.length > 0 && (
            <Polyline 
              positions={aiPath.map(p => [p.lat, p.lon])} 
              color="#eab308" 
              weight={3}
            />
          )}

          {/* Target Waypoint Marker */}
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

        {/* AI Path Planner Panel */}
        {plannerMode && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 z-[1000] w-80 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <div className="text-[10px] font-bold text-agri-gold uppercase tracking-widest flex items-center gap-1.5">
              <Brain size={14} className="text-agri-gold" /> AI Coverage Planner
            </div>
            
            <div className="text-[10px] text-gray-400">
              Click 3 or more points on the map to define the boundary polygon, then compute the sweeping path.
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-300 bg-white/5 p-2 rounded-lg border border-white/5">
              <div>Vertices: <span className="text-white font-bold">{polygon.length}</span></div>
              <div>Waypoints: <span className="text-agri-neon font-bold">{aiPath.length}</span></div>
            </div>
            
            <div className="flex gap-2 flex-col">
              <button 
                disabled={polygon.length < 3}
                onClick={generateLawnmowerPath}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold text-[10px] py-2 rounded-xl transition-colors uppercase tracking-wider"
              >
                Generate AI Path
              </button>
              <div className="flex gap-2">
                <button 
                  disabled={aiPath.length === 0}
                  onClick={uploadAiPath}
                  className="flex-1 bg-agri-gold hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 text-black font-extrabold text-[10px] py-2 rounded-xl transition-colors uppercase tracking-wider"
                >
                  Upload AI Mission
                </button>
                <button 
                  onClick={clearWaypoints}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] px-4 py-2 rounded-xl transition-colors uppercase tracking-wider"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid overlay for radar look */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.5px,transparent_0.5px)] [background-size:30px_30px] pointer-events-none z-[400] opacity-5 mt-14" />

      {/* Legend / Overlay info */}
      <div className="bg-black/95 px-4 py-2.5 border-t border-white/10 font-mono text-[9px] flex justify-between items-center text-gray-400 z-[1000] gap-4">
        <span>Drone: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#64748b]/40 border border-[#64748b] rounded" /> City (NW)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#166534]/40 border border-[#166534] rounded" /> Village (NE)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#d97706]/40 border border-[#d97706] rounded" /> Desert (SW)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#475569]/40 border border-[#475569] rounded" /> Mountain (SE)</span>
        </div>
        <span className="text-agri-neon font-bold">RADAR ACTIVE</span>
      </div>
    </div>
  )
}
