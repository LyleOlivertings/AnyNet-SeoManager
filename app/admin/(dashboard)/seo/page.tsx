"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Play, Globe, Loader2, Search, TrendingUp, FileText, AlertTriangle 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner"; // Assuming you have sonner installed, or use alert()

// --- CUSTOM COMPONENTS ---
// Make sure you have these files created from previous steps!
import DashboardHeader from "../dashboard/components/DashboardHeader"; 
import SeoReportCard from "./components/SeoReportCard"; 

export default function SeoDashboard() {
  // --- STATE MANAGEMENT ---
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // Data for Visuals
  const [graphData, setGraphData] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);

  // Loading States for Actions
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [rankingId, setRankingId] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Modal State
  const [newClient, setNewClient] = useState({ name: "", url: "", keywords: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    fetchClients();
  }, []);

  // --- 2. FETCH DATA WHEN CLIENT CHANGES ---
  useEffect(() => {
    if (selectedClientId) {
      fetchHistory(selectedClientId);
      setReportData(null); // Clear old report when switching clients
    }
  }, [selectedClientId]);

  // --- API FUNCTIONS ---

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/seo/clients");
      const json = await res.json();
      if (json.success) {
        setClients(json.data);
        // Select the first client by default if none selected
        if (json.data.length > 0 && !selectedClientId) {
          setSelectedClientId(json.data[0]._id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (id: string) => {
    try {
      const res = await fetch("/api/seo/history", {
        method: "POST",
        body: JSON.stringify({ clientId: id })
      });
      const json = await res.json();
      
      if (json.success) {
        // Format dates for the graph (e.g., "06 Jan")
        const formatted = json.data.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          score: item.overallScore
        }));
        setGraphData(formatted);
      }
    } catch (e) {
      console.error("Graph load failed", e);
    }
  };

  // --- ACTION HANDLERS ---

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const keywordArray = newClient.keywords.split(",").map(k => k.trim());
    
    await fetch("/api/seo/clients", {
      method: "POST",
      body: JSON.stringify({ ...newClient, keywords: keywordArray }),
    });
    
    setIsDialogOpen(false);
    fetchClients();
    setNewClient({ name: "", url: "", keywords: "" }); // Reset form
    toast.success("Client added successfully");
  };

  const runScan = async (clientId: string) => {
    setScanningId(clientId);
    try {
      const res = await fetch("/api/seo/scan", {
        method: "POST",
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Scan Complete: Score ${data.data.overallScore}/100`);
        if (selectedClientId === clientId) fetchHistory(clientId);
      } else {
        toast.error("Scan Failed: " + data.error);
      }
    } catch (e) {
      toast.error("Error running scan");
    } finally {
      setScanningId(null);
    }
  };

  const checkRanks = async (clientId: string) => {
    if (!confirm("⚠️ This will use SerpApi credits. Continue?")) return;
    
    setRankingId(clientId);
    try {
      const res = await fetch("/api/seo/check-rank", {
        method: "POST",
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Rankings Updated!");
        // We could show a quick summary alert here
        const ranks = data.data.googleRankings
            .map((r: any) => `${r.keyword}: #${r.position}`)
            .join("\n");
        alert(`📉 Google Rankings:\n${ranks}`);
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Rank check failed");
    } finally {
      setRankingId(null);
    }
  };

  const generateReport = async () => {
    if (!selectedClientId) return;
    setGeneratingReport(true);
    try {
      const res = await fetch("/api/seo/report", {
        method: "POST",
        body: JSON.stringify({ clientId: selectedClientId, range: "30_DAYS" }),
      });
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
        toast.success("Report Generated!");
      } else {
        toast.error(json.error || "Could not generate report");
      }
    } catch(e) { 
      toast.error("Report generation failed");
    } finally {
        setGeneratingReport(false);
    }
  };

  // --- RENDER ---

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-indigo-400">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );

  const activeClient = clients.find(c => c._id === selectedClientId);

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 text-slate-200 font-sans pb-32">
      
      {/* 1. THE HEADER (Your custom component) */}
      <DashboardHeader />

      {/* 2. TOP BAR: Title & Add Client */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Performance Overview</h2>
          <p className="text-slate-500 text-sm">Tracking On-Page Health & Keywords</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
              <Plus className="w-4 h-4" /> 
              <span className="hidden md:inline">Add Client</span>
            </button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add SEO Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddClient} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-400 ml-1">Company Name</label>
                <input 
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 outline-none focus:border-indigo-500 transition-all"
                  placeholder="e.g. TnT Infrastructure"
                  value={newClient.name}
                  onChange={e => setNewClient({...newClient, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400 ml-1">Website URL</label>
                <input 
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 outline-none focus:border-indigo-500 transition-all"
                  placeholder="https://..."
                  value={newClient.url}
                  onChange={e => setNewClient({...newClient, url: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400 ml-1">Keywords (Comma separated)</label>
                <textarea 
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 outline-none focus:border-indigo-500 transition-all min-h-[80px]"
                  placeholder="CCTV Cape Town, Fiber Installers, ..."
                  value={newClient.keywords}
                  onChange={e => setNewClient({...newClient, keywords: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-medium">
                Save Client
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 3. MAIN GRAPH (Glass Panel) */}
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-[350px] bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative mb-6 overflow-hidden shadow-2xl"
      >
        {/* Graph Header & Actions */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {activeClient ? activeClient.name : "Select a Client"}
              </h3>
              <p className="text-xs text-slate-500">History Protocol</p>
            </div>
          </div>
          
          {/* Action Buttons for Selected Client */}
          {activeClient && (
            <div className="flex items-center gap-2">
               <button 
                onClick={(e) => { e.stopPropagation(); generateReport(); }}
                disabled={generatingReport}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-white/5"
                title="Generate ROI Report"
              >
                {generatingReport ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4" />}
              </button>
              <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
              <div className="text-right hidden sm:block">
                 <div className="text-2xl font-bold text-white tracking-tight">
                    {graphData.length > 0 ? graphData[graphData.length - 1].score : 0}
                    <span className="text-sm text-slate-500 font-normal ml-1">/100</span>
                 </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Recharts Area */}
        {graphData.length > 0 ? (
          <ResponsiveContainer width="100%" height="75%">
            <AreaChart data={graphData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                itemStyle={{ color: "#818cf8" }}
              />
              <Area type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 pb-10">
            <p className="text-sm">No scan history available.</p>
            {activeClient && (
                <button onClick={() => runScan(activeClient._id)} className="mt-2 text-indigo-400 hover:underline text-sm">Run first scan</button>
            )}
          </div>
        )}
      </motion.div>

      {/* 4. REPORT CARD (Conditional Render) */}
      <AnimatePresence>
        {reportData && (
            <div className="mb-10">
                <SeoReportCard report={reportData} />
            </div>
        )}
      </AnimatePresence>

      {/* 5. CLIENT LIST GRID */}
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-slate-400 font-medium text-sm uppercase tracking-wider">Active Clients</h3>
        <div className="h-[1px] bg-white/10 flex-1 ml-4"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <motion.div
            key={client._id}
            layoutId={client._id}
            onClick={() => setSelectedClientId(client._id)}
            className={`group relative border rounded-2xl p-5 transition-all cursor-pointer ${
              selectedClientId === client._id 
                ? 'bg-indigo-500/5 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                : 'bg-slate-900/40 border-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-3 rounded-xl border transition-colors ${selectedClientId === client._id ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-slate-950 border-white/10'}`}>
                  <Globe className={`w-5 h-5 ${selectedClientId === client._id ? 'text-indigo-400' : 'text-slate-400'}`} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-white font-semibold truncate">{client.name}</h4>
                  <a href={client.url} target="_blank" className="text-xs text-slate-500 hover:text-indigo-400 transition-colors block truncate">
                    {client.url.replace('https://', '').replace('www.', '')}
                  </a>
                </div>
              </div>
              
              <div className="flex gap-2 shrink-0">
                {/* On-Page Scan */}
                <button 
                  onClick={(e) => { e.stopPropagation(); runScan(client._id); }}
                  disabled={scanningId === client._id}
                  className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-all disabled:opacity-50"
                  title="Run On-Page Health Scan"
                >
                  {scanningId === client._id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4" />}
                </button>

                {/* Rank Check */}
                <button 
                  onClick={(e) => { e.stopPropagation(); checkRanks(client._id); }}
                  disabled={rankingId === client._id}
                  className="p-2 bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white rounded-lg transition-all disabled:opacity-50"
                  title="Check Google Rankings"
                >
                  {rankingId === client._id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex flex-wrap gap-2 max-h-[60px] overflow-hidden">
                {client.keywords?.slice(0, 3).map((k: string) => (
                  <span key={k} className="px-2 py-1 bg-slate-950 rounded-md text-[10px] text-slate-400 border border-white/5 whitespace-nowrap">
                    {k}
                  </span>
                ))}
                 {client.keywords?.length > 3 && (
                    <span className="px-2 py-1 text-[10px] text-slate-500">+{client.keywords.length - 3}</span>
                  )}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add New Card (Empty State) */}
        <motion.div
          onClick={() => setIsDialogOpen(true)}
          className="border border-dashed border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/5 hover:border-indigo-500/30 transition-all min-h-[180px] group"
        >
          <div className="p-3 rounded-full bg-white/5 group-hover:bg-indigo-500/10 transition-colors">
            <Plus className="w-6 h-6 text-slate-500 group-hover:text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-500 group-hover:text-slate-300">Add New Client</p>
        </motion.div>
      </div>
    </div>
  );
}