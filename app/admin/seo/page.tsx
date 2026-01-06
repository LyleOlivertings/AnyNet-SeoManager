"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, Globe, Activity, Search, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

// --- MOCK DATA (Replace with API fetch later) ---
const CHART_DATA = [
  { name: "Jan", tnt: 40, summerhill: 20 },
  { name: "Feb", tnt: 45, summerhill: 25 },
  { name: "Mar", tnt: 55, summerhill: 35 }, // TnT Spike
  { name: "Apr", tnt: 60, summerhill: 32 },
  { name: "May", tnt: 75, summerhill: 45 },
  { name: "Jun", tnt: 85, summerhill: 55 },
];

const CLIENTS = [
  {
    name: "TnT Infrastructure",
    domain: "tnt-infra.co.za",
    status: "healthy",
    rank: 3,
    keyword: "Cabling Cape Town",
    trend: "+12%",
  },
  {
    name: "Summerhill Wines",
    domain: "summerhill.co.za",
    status: "warning",
    rank: 8,
    keyword: "Wine Tasting",
    trend: "-4%",
  },
];

// --- UI COMPONENTS ---

export default function SeoDashboard() {

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATA ON LOAD
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/seo/scan");
        const json = await res.json();
        
        if (json.success) {
          // Process data for Recharts (Group by Date, separate by Client)
          // This is a simple transformation; for now, let's just dump the raw data to state
          // You might need a helper function here to format it exactly like 'CHART_DATA' was
          setData(json.data); 
        }
      } catch (error) {
        console.error("Failed to load SEO stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-white">Loading Command Center...</div>;
  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 text-slate-200 font-sans">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            SEO Command Center
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Real-time organic performance tracking for <span className="text-indigo-400">AnyNet Clients</span>.
          </p>
        </div>
        <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
          + Run New Scan
        </button>
      </div>

      {/* 2. MAIN GRAPH (Glass Panel) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full h-[400px] bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden mb-8"
      >
        {/* Glow Element */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60" />
        
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Organic Traffic Growth (YTD)</h3>
        </div>
        
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={CHART_DATA}>
            <defs>
              <linearGradient id="colorTnT" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
              itemStyle={{ color: "#fff" }}
            />
            <Area 
              type="monotone" 
              dataKey="tnt" 
              stroke="#818cf8" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorTnT)" 
            />
            <Area 
              type="monotone" 
              dataKey="summerhill" 
              stroke="#ec4899" 
              strokeWidth={3}
              fillOpacity={0} 
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* 3. CLIENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CLIENTS.map((client, i) => (
          <ClientCard key={client.name} client={client} index={i} />
        ))}
      </div>
    </div>
  );
}

// Sub-component for cleanliness
function ClientCard({ client, index }: { client: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 rounded-2xl p-5 transition-all cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/5"
    >
      {/* Status Dot */}
      <div className={`absolute top-5 right-5 w-2.5 h-2.5 rounded-full ${client.status === 'healthy' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-amber-400'}`} />

      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-slate-950 rounded-xl border border-white/10 group-hover:scale-110 transition-transform duration-300">
          <Globe className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h4 className="text-white font-semibold text-lg">{client.name}</h4>
          <p className="text-xs text-slate-500 font-mono">{client.domain}</p>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-white/5">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400 flex items-center gap-2">
            <Search className="w-3 h-3" /> Top Keyword
          </span>
          <span className="text-white font-medium">{client.keyword}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" /> Rank
          </span>
          <div className="flex items-center gap-1.5 text-white">
            <span className="font-bold text-lg">#{client.rank}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md ${client.trend.includes("+") ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {client.trend}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}