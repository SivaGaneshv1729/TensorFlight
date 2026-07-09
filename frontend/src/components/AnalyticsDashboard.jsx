import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar
} from 'recharts'
import { Activity, Wind, Leaf } from 'lucide-react'

export default function AnalyticsDashboard() {
  const [data, setData] = useState([])

  useEffect(() => {
    let active = true
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/ai/report')
        if (!res.ok) return
        const json = await res.json()
        
        if (active && json.history) {
          // Format timestamps for the X-axis (limit to last 60 points for performance)
          const formatted = json.history.slice(-60).map(item => {
            const date = new Date(item.t * 1000)
            return {
              ...item,
              time: date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              vari: Number(item.vari.toFixed(3)),
              stress_pct: Number((item.stress_pct * 100).toFixed(1)),
              wind: Number(item.wind.toFixed(1))
            }
          })
          setData(formatted)
        }
      } catch (err) {
        console.error('Failed to fetch analytics history:', err)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 1000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  if (data.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 h-full p-8">
        <Activity size={48} className="mb-4 animate-pulse opacity-50" />
        <p className="text-xl">Waiting for AI telemetry history...</p>
      </div>
    )
  }

  // Calculate current averages for header stats
  const latest = data[data.length - 1]
  const avgVari = (data.reduce((acc, curr) => acc + curr.vari, 0) / data.length).toFixed(3)
  const maxWeeds = Math.max(...data.map(d => d.weed_count))

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 h-full overflow-y-auto bg-[#282a2e]">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-wide">Historical Analytics</h1>
        <div className="flex gap-4">
           <div className="bg-[#34373a] px-4 py-2 rounded-lg border border-gray-700/50 flex flex-col min-w-[140px]">
             <span className="text-xs text-gray-400 font-bold tracking-wider mb-1">AVG HEALTH (VARI)</span>
             <span className="text-2xl text-agri-primary font-bold">{avgVari}</span>
           </div>
           <div className="bg-[#34373a] px-4 py-2 rounded-lg border border-gray-700/50 flex flex-col min-w-[140px]">
             <span className="text-xs text-gray-400 font-bold tracking-wider mb-1">PEAK WEED ZONES</span>
             <span className="text-2xl text-red-500 font-bold">{maxWeeds}</span>
           </div>
           <div className="bg-[#34373a] px-4 py-2 rounded-lg border border-gray-700/50 flex flex-col min-w-[140px]">
             <span className="text-xs text-gray-400 font-bold tracking-wider mb-1">CURRENT WIND</span>
             <span className="text-2xl text-blue-400 font-bold">{latest.wind} m/s</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1 min-h-[400px]">
        {/* CHART 1: Crop Health (VARI) */}
        <div className="bg-[#1c1d21] rounded-xl p-5 border border-gray-700/50 shadow-lg flex flex-col col-span-2 h-[350px]">
           <div className="flex items-center gap-2 mb-4">
             <Leaf size={18} className="text-agri-primary" />
             <h2 className="text-lg font-bold text-gray-200">Crop Health Index (VARI)</h2>
           </div>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="99%" height="100%">
               <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                 <defs>
                   <linearGradient id="colorVari" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#00c83c" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#00c83c" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                 <XAxis dataKey="time" stroke="#9ca3af" tick={{fontSize: 12}} tickMargin={10} minTickGap={30} />
                 <YAxis stroke="#9ca3af" domain={['auto', 'auto']} tick={{fontSize: 12}} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#282a2e', border: '1px solid #4b5563', borderRadius: '8px' }}
                   itemStyle={{ color: '#e5e7eb' }}
                 />
                 <Legend wrapperStyle={{ paddingTop: '10px' }} />
                 <Area type="monotone" dataKey="vari" name="VARI Index" stroke="#00c83c" strokeWidth={2} fillOpacity={1} fill="url(#colorVari)" isAnimationActive={false} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* CHART 2: Anomalies */}
        <div className="bg-[#1c1d21] rounded-xl p-5 border border-gray-700/50 shadow-lg flex flex-col h-[300px]">
           <div className="flex items-center gap-2 mb-4">
             <Activity size={18} className="text-red-400" />
             <h2 className="text-lg font-bold text-gray-200">Anomaly Detections</h2>
           </div>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="99%" height="100%">
               <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                 <XAxis dataKey="time" stroke="#9ca3af" tick={{fontSize: 12}} minTickGap={30} />
                 <YAxis stroke="#9ca3af" tick={{fontSize: 12}} allowDecimals={false} />
                 <Tooltip contentStyle={{ backgroundColor: '#282a2e', border: '1px solid #4b5563', borderRadius: '8px' }} />
                 <Legend wrapperStyle={{ paddingTop: '10px' }} />
                 <Line type="stepAfter" dataKey="weed_count" name="Weed Zones" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                 <Line type="stepAfter" dataKey="pest_count" name="Pest Stress Zones" stroke="#eab308" strokeWidth={2} dot={false} isAnimationActive={false} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* CHART 3: Environment vs Stress */}
        <div className="bg-[#1c1d21] rounded-xl p-5 border border-gray-700/50 shadow-lg flex flex-col h-[300px]">
           <div className="flex items-center gap-2 mb-4">
             <Wind size={18} className="text-blue-400" />
             <h2 className="text-lg font-bold text-gray-200">Environmental Stress Correlation</h2>
           </div>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="99%" height="100%">
               <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                 <XAxis dataKey="time" stroke="#9ca3af" tick={{fontSize: 12}} minTickGap={30} />
                 <YAxis yAxisId="left" stroke="#9ca3af" tick={{fontSize: 12}} label={{ value: 'Stress %', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }} />
                 <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" tick={{fontSize: 12}} label={{ value: 'Wind m/s', angle: 90, position: 'insideRight', fill: '#9ca3af', fontSize: 12 }} />
                 <Tooltip contentStyle={{ backgroundColor: '#282a2e', border: '1px solid #4b5563', borderRadius: '8px' }} />
                 <Legend wrapperStyle={{ paddingTop: '10px' }} />
                 <Bar yAxisId="left" dataKey="stress_pct" name="Crop Stress %" fill="#f97316" barSize={10} isAnimationActive={false} />
                 <Line yAxisId="right" type="monotone" dataKey="wind" name="Wind Speed (m/s)" stroke="#60a5fa" strokeWidth={2} dot={false} isAnimationActive={false} />
               </ComposedChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  )
}
