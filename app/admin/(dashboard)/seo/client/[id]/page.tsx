"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, FileText, Trash2, Save, Clock, Globe, 
  Play, Search as SearchIcon, Loader2, TrendingUp, Settings, 
  AlertTriangle, Sparkles, History
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SeoReportCard from "../../components/SeoReportCard";

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // --- TABS STATE ---
  const [activeTab, setActiveTab] = useState("overview");
  
  // --- DATA STATES ---
  const [client, setClient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ACTION LOADING STATES ---
  const [scanningId, setScanningId] = useState(false);
  const [rankingId, setRankingId] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [runningWayback, setRunningWayback] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // --- INTERACTIVE DATA STATES ---
  const [reportData, setReportData] = useState<any>(null);
  const [waybackDate, setWaybackDate] = useState("");
  const [formData, setFormData] = useState({ name: "", url: "", keywords: "", competitors: "" });

  // --- EDIT MODAL STATES ---
  const [editingScan, setEditingScan] = useState<any>(null);
  const [newDate, setNewDate] = useState("");

  // ==================================================================================
  // 1. INITIAL LOAD
  // ==================================================================================
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      // Fetch Client Info
      const resClient = await fetch(`/api/seo/clients/${id}`);
      const jsonClient = await resClient.json();
      
      if (jsonClient.success) {
        setClient(jsonClient.data);
        // Pre-fill Settings Form
        setFormData({
          name: jsonClient.data.name,
          url: jsonClient.data.url,
          keywords: jsonClient.data.keywords.join(", "),
          competitors: jsonClient.data.competitors?.join(", ") || ""
        });
      }

      // Fetch History & Reports
      await fetchHistory();
      const resReports = await fetch(`/api/seo/reports?clientId=${id}`);
      const jsonReports = await resReports.json();
      setSavedReports(jsonReports.data || []);

    } catch (e) {
      console.error(e);
      toast.error("Failed to load client data");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    const res = await fetch("/api/seo/history", {
      method: "POST", 
      body: JSON.stringify({ clientId: id })
    });
    const json = await res.json();
    setHistory(json.data || []);
  };

  // ==================================================================================
  // 2. CORE ACTIONS (Scan, Rank, Report, Wayback)
  // ==================================================================================

  const runOnPageScan = async () => {
    setScanningId(true);
    try {
      const res = await fetch("/api/seo/scan", {
        method: "POST",
        body: JSON.stringify({ clientId: id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Scan Complete: Score ${data.data.overallScore}/100`);
        fetchHistory();
      } else { toast.error("Scan Failed: " + data.error); }
    } catch (e) { toast.error("Error running scan"); } 
    finally { setScanningId(false); }
  };

  const runRankCheck = async () => {
    if (!confirm("⚠️ This uses SerpApi credits. Continue?")) return;
    setRankingId(true);
    try {
      const res = await fetch("/api/seo/check-rank", {
        method: "POST",
        body: JSON.stringify({ clientId: id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Rankings Updated!");
        fetchHistory();
      } else { toast.error(data.error); }
    } catch (e) { toast.error("Rank check failed"); } 
    finally { setRankingId(false); }
  };

  const runWaybackScan = async () => {
    if (!waybackDate) return toast.error("Please pick a date first.");
    setRunningWayback(true);
    try {
      const res = await fetch("/api/seo/wayback", {
        method: "POST",
        body: JSON.stringify({ clientId: id, date: waybackDate }),
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success(`Found Archive from ${new Date(json.archiveDate).toLocaleDateString()}! Score: ${json.data.overallScore}`);
        fetchHistory(); // Update graph instantly
      } else {
        toast.error(json.error);
      }
    } catch (e) { toast.error("Wayback machine failed"); }
    finally { setRunningWayback(false); }
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch("/api/seo/report", {
        method: "POST",
        body: JSON.stringify({ clientId: id, range: "30_DAYS" }),
      });
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
        toast.success("Report Generated with AI Insights! 🧠");
        setActiveTab("overview"); // Switch to overview to see it
      } else { toast.error(json.error); }
    } catch(e) { toast.error("Generation failed"); } 
    finally { setGeneratingReport(false); }
  };

  const saveReportToVault = async () => {
    if (!reportData) return;
    try {
      await fetch("/api/seo/reports", {
        method: "POST",
        body: JSON.stringify({
          clientId: id,
          title: `ROI Report - ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
          data: reportData.comparison,
          range: "30 Days",
          aiSummary: reportData.aiSummary // 🧠 Sending the brain to the DB
        })
      });
      toast.success("Report saved to Vault 🔒");
      setReportData(null);
      loadData(); // Refresh reports list
    } catch(e) { toast.error("Failed to save"); }
  };

  // ==================================================================================
  // 3. MANAGEMENT (Update, Delete, Time Travel)
  // ==================================================================================

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const keywordArray = formData.keywords.split(",").map(k => k.trim()).filter(k => k);
    const competitorArray = formData.competitors.split(",").map(k => k.trim()).filter(k => k);

    try {
      const res = await fetch(`/api/seo/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name,
          url: formData.url,
          keywords: keywordArray,
          competitors: competitorArray
        }),
      });
      if (res.ok) {
        toast.success("Client Profile Updated");
        loadData();
      } else { toast.error("Update failed"); }
    } catch(e) { toast.error("Error saving settings"); } 
    finally { setSavingSettings(false); }
  };

  const handleDeleteClient = async () => {
    const confirmName = prompt(`Type "${client.name}" to confirm deletion.`);
    if (confirmName !== client.name) return toast.error("Name did not match.");
    try {
      await fetch(`/api/seo/clients/${id}`, { method: "DELETE" });
      toast.success("Client Deleted");
      router.push("/admin/seo");
    } catch(e) { toast.error("Delete failed"); }
  };

  const handleUpdateDate = async () => {
    if (!editingScan || !newDate) return;
    await fetch(`/api/seo/scan/${editingScan._id}`, {
      method: "PATCH", body: JSON.stringify({ date: newDate }),
    });
    setEditingScan(null);
    fetchHistory();
    toast.success("Date updated");
  };

  const handleDeleteScan = async (scanId: string) => {
    if(!confirm("Delete record?")) return;
    await fetch(`/api/seo/scan/${scanId}`, { method: "DELETE" });
    fetchHistory();
    toast.success("Deleted");
  };

  // ==================================================================================
  // 4. RENDER
  // ==================================================================================

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-indigo-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!client) return <div className="p-10 text-white">Client not found</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 text-slate-200">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/admin/seo")} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{client.name}</h1>
            <a href={client.url} target="_blank" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-1">
              <Globe className="w-3 h-3" /> {client.url}
            </a>
          </div>
        </div>

        {/* ACTION TOOLBAR */}
        <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
          <button onClick={runOnPageScan} disabled={scanningId} className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50">
            {scanningId ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4" />} Run Scan
          </button>
          <button onClick={runRankCheck} disabled={rankingId} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50">
            {rankingId ? <Loader2 className="w-4 h-4 animate-spin"/> : <SearchIcon className="w-4 h-4" />} Check Rank
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          <button onClick={generateReport} disabled={generatingReport} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50">
            {generatingReport ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4" />} New Report
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b border-white/10 mb-8 overflow-x-auto">
        {["overview", "rankings", "history", "reports", "settings"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 whitespace-nowrap ${activeTab === tab ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <AnimatePresence>
            {reportData && (
              <div className="relative mb-8">
                <div className="absolute top-4 right-4 z-10">
                  <button onClick={saveReportToVault} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-lg">
                    <Save className="w-3 h-3" /> Save to Vault
                  </button>
                </div>
                {/* PREVIEW CARD */}
                <SeoReportCard report={reportData} />
              </div>
            )}
          </AnimatePresence>

          <div className="h-[400px] bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" /> Performance Timeline
                </h3>
                {history.length > 0 && <div className="text-2xl font-bold text-white">{history[history.length - 1].overallScore}<span className="text-sm text-slate-500 font-normal">/100</span></div>}
            </div>
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={history.map(h => ({ ...h, date: new Date(h.date).toLocaleDateString() }))}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff" }} />
                <Area type="monotone" dataKey="overallScore" stroke="#818cf8" strokeWidth={3} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 2: RANKINGS */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === "rankings" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
           <div className="flex justify-between items-end">
              <div>
                <h3 className="text-white font-semibold text-lg">Keyword Positions</h3>
                <p className="text-sm text-slate-400">Latest data from Google.co.za</p>
              </div>
              <button onClick={runRankCheck} disabled={rankingId} className="text-xs bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-2 rounded-lg transition-all flex items-center gap-2">
                {rankingId ? <Loader2 className="w-3 h-3 animate-spin" /> : <SearchIcon className="w-3 h-3" />} Refresh
              </button>
           </div>
           <div className="bg-slate-900/40 border border-white/10 rounded-xl overflow-hidden">
             <table className="w-full text-sm text-left">
               <thead className="bg-white/5 text-slate-300">
                 <tr>
                   <th className="p-4">Keyword</th>
                   <th className="p-4">Position</th>
                   <th className="p-4">URL Found</th>
                   <th className="p-4 text-right">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {history.filter(h => h.type === 'RANK_CHECK').slice(-1)[0]?.googleRankings.map((rank: any, i: number) => (
                   <tr key={i} className="hover:bg-white/5 transition-colors">
                     <td className="p-4 text-white font-medium">{rank.keyword}</td>
                     <td className="p-4">
                       {rank.position > 0 ? (
                         <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${rank.position <= 3 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : rank.position <= 10 ? "bg-blue-500/20 text-blue-400 border border-blue-500/20" : "bg-slate-700 text-slate-300"}`}>
                           #{rank.position}
                         </span>
                       ) : <span className="text-slate-500 text-xs">Not in Top 20</span>}
                     </td>
                     <td className="p-4 text-slate-400 text-xs truncate max-w-[200px]">{rank.urlFound?.replace("https://www.", "") || "-"}</td>
                     <td className="p-4 text-right">{rank.position > 0 && rank.position <= 3 ? "🏆 Top 3" : rank.position > 0 && rank.position <= 10 ? "✅ Page 1" : "⚠️ Needs Work"}</td>
                   </tr>
                 )) || <tr><td colSpan={4} className="p-8 text-center text-slate-500">No ranking data found.</td></tr>}
               </tbody>
             </table>
           </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 3: HISTORY (With Time Travel) */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === "history" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          
          {/* TIME MACHINE CARD */}
          <div className="p-6 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-300">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold">Time Travel Audit</h4>
                <p className="text-sm text-slate-400 max-w-md">
                  Import historical performance from the Internet Archive (Wayback Machine).
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input 
                type="date" 
                className="bg-slate-900 border border-white/10 text-white text-sm rounded-lg p-2.5 outline-none focus:border-indigo-500"
                value={waybackDate}
                onChange={(e) => setWaybackDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
              <button 
                onClick={runWaybackScan}
                disabled={runningWayback}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
              >
                {runningWayback ? <Loader2 className="w-4 h-4 animate-spin"/> : <Globe className="w-4 h-4" />}
                Import History
              </button>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-slate-300">
                <tr><th className="p-4">Date</th><th className="p-4">Type</th><th className="p-4">Result</th><th className="p-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((scan) => (
                  <tr key={scan._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white font-medium">{new Date(scan.date).toLocaleDateString()}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-medium border ${scan.type === 'RANK_CHECK' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{scan.type === 'RANK_CHECK' ? 'Rank Check' : 'Health Scan'}</span></td>
                    <td className="p-4 text-slate-300">{scan.type === 'RANK_CHECK' ? <span className="text-emerald-400">View Rankings</span> : <span>Score: <b className="text-white">{scan.overallScore}</b>/100</span>}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild><button onClick={() => { setEditingScan(scan); setNewDate(new Date(scan.date).toISOString().split('T')[0]); }} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><Clock className="w-4 h-4" /></button></DialogTrigger>
                        <DialogContent className="bg-slate-900 border-white/10 text-white"><DialogHeader><DialogTitle>Edit Date</DialogTitle></DialogHeader><div className="py-4"><input type="datetime-local" className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-white" value={newDate} onChange={(e) => setNewDate(e.target.value)} /><button onClick={handleUpdateDate} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 py-2 rounded-lg font-medium">Update Timestamp</button></div></DialogContent>
                      </Dialog>
                      <button onClick={() => handleDeleteScan(scan._id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 4: REPORTS VAULT */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === "reports" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedReports.map((report) => (
              <div key={report._id} className="p-5 bg-slate-900/40 border border-white/10 rounded-xl hover:border-indigo-500/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400"><FileText className="w-6 h-6" /></div>
                  <Dialog>
                    <DialogTrigger asChild><button className="text-xs bg-slate-800 hover:bg-white text-slate-300 hover:text-slate-900 px-3 py-1.5 rounded-lg transition-all font-medium">Open</button></DialogTrigger>
                    <DialogContent className="max-w-4xl bg-slate-950 border-white/10 text-white max-h-[85vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>{report.title}</DialogTitle></DialogHeader>
                        {/* 🧠 RE-USE REPORT CARD WITH AI SUMMARY */}
                        <SeoReportCard report={{ 
                            startDate: report.dateGenerated, 
                            endDate: report.dateGenerated, 
                            comparison: report.data,
                            aiSummary: report.aiSummary 
                        }} />
                    </DialogContent>
                  </Dialog>
                </div>
                <h4 className="text-white font-medium truncate">{report.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{new Date(report.dateGenerated).toLocaleDateString()} {report.aiSummary && "• AI Included"}</p>
              </div>
            ))}
            {savedReports.length === 0 && <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-xl text-slate-500">No reports saved yet.</div>}
        </motion.div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 5: SETTINGS */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === "settings" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
          <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-slate-400" /> Client Configuration</h3>
            <form onSubmit={handleUpdateClient} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-slate-400 mb-1.5 block">Name</label><input className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition-colors" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div><label className="text-sm text-slate-400 mb-1.5 block">URL</label><input className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition-colors" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} required /></div>
              </div>
              <div><label className="text-sm text-slate-400 mb-1.5 block">Keywords</label><textarea className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition-colors min-h-[100px]" placeholder="Comma separated list..." value={formData.keywords} onChange={e => setFormData({...formData, keywords: e.target.value})} /></div>
              <div className="pt-4 border-t border-white/5 flex justify-end"><button type="submit" disabled={savingSettings} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2">{savingSettings ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} Save Changes</button></div>
            </form>
          </div>
          <div className="mt-8 border border-rose-500/20 bg-rose-500/5 rounded-2xl p-6">
            <h4 className="text-rose-400 font-semibold flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5" /> Danger Zone</h4>
            <p className="text-sm text-slate-400 mb-6">Deleting this client will permanently remove all data.</p>
            <button onClick={handleDeleteClient} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors">Delete Client</button>
          </div>
        </motion.div>
      )}

    </div>
  );
}