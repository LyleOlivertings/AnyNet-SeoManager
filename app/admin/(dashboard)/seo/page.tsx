"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Globe, ChevronRight, TrendingUp, AlertCircle 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import DashboardHeader from "../dashboard/components/DashboardHeader";

export default function SeoDashboard() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, number>>({}); // Map clientId -> Score

  // New Client Form
  const [newClient, setNewClient] = useState({ name: "", url: "", keywords: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/seo/clients");
      const json = await res.json();
      if (json.success) {
        setClients(json.data);
        // Fire off background fetches for latest scores
        json.data.forEach((c: any) => fetchLatestScore(c._id));
      }
    } catch (e) {
      console.error("Failed to load directory");
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestScore = async (id: string) => {
    try {
      // We limit to 1 to just get the latest
      const res = await fetch("/api/seo/history", {
        method: "POST",
        body: JSON.stringify({ clientId: id })
      });
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        // The API returns sorted by date (oldest first), so grab the last one
        const latest = json.data[json.data.length - 1];
        setScores(prev => ({ ...prev, [id]: latest.overallScore }));
      }
    } catch(e) { console.error(e); }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const keywordArray = newClient.keywords.split(",").map(k => k.trim());
    await fetch("/api/seo/clients", {
      method: "POST",
      body: JSON.stringify({ ...newClient, keywords: keywordArray }),
    });
    setIsDialogOpen(false);
    fetchClients();
    setNewClient({ name: "", url: "", keywords: "" });
    toast.success("Client added to directory");
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-indigo-400">Loading Directory...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 text-slate-200 font-sans pb-32">
      
      <DashboardHeader />

      {/* ACTION BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Client Directory</h2>
          <p className="text-slate-500 text-sm">Select a client to run scans or view reports.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
              <Plus className="w-4 h-4" /> 
              <span className="hidden md:inline">Add Client</span>
            </button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
            <DialogHeader><DialogTitle>Add SEO Client</DialogTitle></DialogHeader>
            <form onSubmit={handleAddClient} className="space-y-4 mt-4">
              <input className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 outline-none focus:border-indigo-500" placeholder="e.g. TnT Infrastructure" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} required />
              <input className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 outline-none focus:border-indigo-500" placeholder="https://..." value={newClient.url} onChange={e => setNewClient({...newClient, url: e.target.value})} required />
              <textarea className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 outline-none focus:border-indigo-500 min-h-[80px]" placeholder="Keywords (Comma separated)" value={newClient.keywords} onChange={e => setNewClient({...newClient, keywords: e.target.value})} required />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-medium">Save Client</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* CLIENT LIST */}
      <div className="grid grid-cols-1 gap-4">
        {clients.map((client, i) => (
          <motion.div
            key={client._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => router.push(`/admin/seo/client/${client._id}`)}
            className="group relative bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-indigo-500/30 rounded-2xl p-5 cursor-pointer hover:bg-white/5 transition-all flex items-center justify-between"
          >
            {/* Left: Info */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/10 group-hover:border-indigo-500/30 transition-colors">
                <Globe className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{client.name}</h3>
                <p className="text-slate-500 text-sm flex items-center gap-2">
                  {client.url.replace('https://', '').replace('www.', '').split('/')[0]}
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  {client.keywords?.length || 0} Keywords
                </p>
              </div>
            </div>

            {/* Right: Score & Arrow */}
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Last Health Score</p>
                <div className="flex items-center justify-end gap-2">
                  <TrendingUp className={`w-4 h-4 ${scores[client._id] > 80 ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className={`text-xl font-bold ${scores[client._id] > 80 ? 'text-white' : 'text-slate-300'}`}>
                    {scores[client._id] || "--"}<span className="text-sm text-slate-500 font-normal">/100</span>
                  </span>
                </div>
              </div>
              
              <div className="p-2 rounded-full bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-indigo-600 transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}

        {clients.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500">No clients found. Add one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}