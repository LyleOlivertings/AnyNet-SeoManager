"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Trash2,
  Save,
  Clock,
  Globe,
  Play,
  Search as SearchIcon,
  Loader2,
  TrendingUp,
  Settings,
  AlertTriangle,
  History,
  Download,
  Printer, // Added Printer icon
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SeoReportCard from "../../components/SeoReportCard";
import { toPng } from "html-to-image"; // 👈 NEW ENGINE
import { jsPDF } from "jspdf";

export default function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // --- STATES ---
  const [activeTab, setActiveTab] = useState("overview");
  const [client, setClient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- LOADING FLAGS ---
  const [scanningId, setScanningId] = useState(false);
  const [rankingId, setRankingId] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [runningWayback, setRunningWayback] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // --- DATA ---
  const [reportData, setReportData] = useState<any>(null);
  const [waybackDate, setWaybackDate] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    keywords: "",
    competitors: "",
  });
  const [editingScan, setEditingScan] = useState<any>(null);
  const [newDate, setNewDate] = useState("");

  // ==========================
  // 1. INITIAL LOAD
  // ==========================
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const resClient = await fetch(`/api/seo/clients/${id}`);
      const jsonClient = await resClient.json();
      if (jsonClient.success) {
        setClient(jsonClient.data);
        setFormData({
          name: jsonClient.data.name,
          url: jsonClient.data.url,
          keywords: jsonClient.data.keywords.join(", "),
          competitors: jsonClient.data.competitors?.join(", ") || "",
        });
      }
      await fetchHistory();
      const resReports = await fetch(`/api/seo/reports?clientId=${id}`);
      const jsonReports = await resReports.json();
      setSavedReports(jsonReports.data || []);
    } catch (e) {
      toast.error("Failed to load client data");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    const res = await fetch("/api/seo/history", {
      method: "POST",
      body: JSON.stringify({ clientId: id }),
    });
    const json = await res.json();
    setHistory(json.data || []);
  };

  // ==========================
  // 2. THE PDF ENGINE (New & Improved) 🖨️
  // ==========================
  const downloadPdf = async (elementId: string, title: string) => {
    const element = document.getElementById(elementId);
    if (!element) return toast.error("Report content missing");

    setDownloadingPdf(true);
    try {
      // 1. Force the capture to be 1280px wide (A4 Landscape optimized)
      // This ensures the 2-column layout triggers even if you are on a laptop.
      const dataUrl = await toPng(element, { 
        cacheBust: true, 
        backgroundColor: '#ffffff',
        width: 1280, // 👈 FORCE DESKTOP WIDTH
        pixelRatio: 2, 
        style: {
           fontFamily: 'sans-serif',
           maxWidth: 'none', // 👈 UNLOCK CONSTRAINTS
           width: '1280px',  // 👈 FORCE WIDTH
           height: 'auto'    // 👈 ALLOW FULL HEIGHT
        }
      });

      // 2. Generate PDF
      const pdf = new jsPDF("l", "mm", "a4");
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${title.replace(/\s+/g, "_")}_Landscape.pdf`);
      toast.success("PDF Downloaded!");
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to generate PDF. Try refreshing.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ==========================
  // 3. CORE ACTIONS
  // ==========================
  const runOnPageScan = async () => {
    setScanningId(true);
    try {
      const res = await fetch("/api/seo/scan", {
        method: "POST",
        body: JSON.stringify({ clientId: id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Score: ${data.data.overallScore}/100`);
        fetchHistory();
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Error");
    } finally {
      setScanningId(false);
    }
  };

  const runRankCheck = async () => {
    if (!confirm("⚠️ Cost: 1 SerpApi Credit. Continue?")) return;
    setRankingId(true);
    try {
      const res = await fetch("/api/seo/check-rank", {
        method: "POST",
        body: JSON.stringify({ clientId: id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Rankings Updated");
        fetchHistory();
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Error");
    } finally {
      setRankingId(false);
    }
  };

  const runWaybackScan = async () => {
    if (!waybackDate) return toast.error("Pick a date");
    setRunningWayback(true);
    try {
      const res = await fetch("/api/seo/wayback", {
        method: "POST",
        body: JSON.stringify({ clientId: id, date: waybackDate }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("History Imported");
        fetchHistory();
      } else {
        toast.error(json.error);
      }
    } catch (e) {
      toast.error("Error");
    } finally {
      setRunningWayback(false);
    }
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
        toast.success("Report Generated 🧠");
        setActiveTab("overview");
      } else {
        toast.error(json.error);
      }
    } catch (e) {
      toast.error("Error");
    } finally {
      setGeneratingReport(false);
    }
  };

  const saveReportToVault = async () => {
    if (!reportData) return;
    try {
      await fetch("/api/seo/reports", {
        method: "POST",
        body: JSON.stringify({
          clientId: id,
          title: `Report - ${new Date().toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          })}`,
          data: reportData.comparison,
          range: "30 Days",
          aiSummary: reportData.aiSummary,
        }),
      });
      toast.success("Saved to Vault");
      loadData();
    } catch (e) {
      toast.error("Error");
    }
  };

  // ==========================
  // 4. HELPERS (Update/Delete)
  // ==========================
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/seo/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name,
          url: formData.url,
          keywords: formData.keywords.split(",").map((k) => k.trim()),
          competitors: formData.competitors.split(",").map((k) => k.trim()),
        }),
      });
      if (res.ok) {
        toast.success("Updated");
        loadData();
      }
    } catch (e) {
      toast.error("Error");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteClient = async () => {
    if (prompt(`Type "${client.name}" to delete.`) !== client.name) return;
    await fetch(`/api/seo/clients/${id}`, { method: "DELETE" });
    router.push("/admin/seo");
  };

  const handleUpdateDate = async () => {
    if (!editingScan || !newDate) return;
    await fetch(`/api/seo/scan/${editingScan._id}`, {
      method: "PATCH",
      body: JSON.stringify({ date: newDate }),
    });
    setEditingScan(null);
    fetchHistory();
    toast.success("Updated");
  };

  const handleDeleteScan = async (scanId: string) => {
    if (!confirm("Delete?")) return;
    await fetch(`/api/seo/scan/${scanId}`, { method: "DELETE" });
    fetchHistory();
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-indigo-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  if (!client) return <div className="p-10 text-white">Client not found</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 text-slate-200">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/seo")}
            className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{client.name}</h1>
            <a
              href={client.url}
              target="_blank"
              className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-1"
            >
              <Globe className="w-3 h-3" /> {client.url}
            </a>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
          <button
            onClick={runOnPageScan}
            disabled={scanningId}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          >
            {scanningId ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}{" "}
            Scan
          </button>
          <button
            onClick={runRankCheck}
            disabled={rankingId}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          >
            {rankingId ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SearchIcon className="w-4 h-4" />
            )}{" "}
            Rank
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          <button
            onClick={generateReport}
            disabled={generatingReport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          >
            {generatingReport ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}{" "}
            Report
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b border-white/10 mb-8 overflow-x-auto">
        {["overview", "rankings", "history", "reports", "settings"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {/* 1. OVERVIEW */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <AnimatePresence>
            {reportData && (
              <div className="relative mb-8">
                {/* ACTION BAR FOR REPORT */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <button
                    onClick={() =>
                      downloadPdf(
                        "report-container-preview",
                        `${client.name}-Report`
                      )
                    }
                    disabled={downloadingPdf}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg shadow-lg"
                  >
                    {downloadingPdf ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}{" "}
                    PDF
                  </button>
                  <button
                    onClick={saveReportToVault}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-lg"
                  >
                    <Save className="w-3 h-3" /> Save
                  </button>
                </div>

                {/* 📸 CAPTURE TARGET */}
                <div
                  id="report-container-preview"
                  className="p-1 rounded-2xl bg-slate-950"
                >
                  {/* 👇 PASS CLIENT AND HISTORY HERE */}
                  <SeoReportCard
                    report={reportData}
                    client={client}
                    history={history}
                  />
                </div>
              </div>
            )}
          </AnimatePresence>

          <div className="h-[400px] bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative">
            <h3 className="text-lg font-semibold text-white mb-4 flex gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" /> Performance
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart
                data={history.map((h) => ({
                  ...h,
                  date: new Date(h.date).toLocaleDateString(),
                }))}
              >
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff05"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#475569"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="overallScore"
                  stroke="#818cf8"
                  strokeWidth={3}
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* 2. RANKINGS */}
      {activeTab === "rankings" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-white font-semibold text-lg">
                Keyword Positions
              </h3>
              <p className="text-sm text-slate-400">Google.co.za Data</p>
            </div>
            <button
              onClick={runRankCheck}
              disabled={rankingId}
              className="text-xs bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              {rankingId ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <SearchIcon className="w-3 h-3" />
              )}{" "}
              Refresh
            </button>
          </div>

          <div className="bg-slate-900/40 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="p-4">Keyword</th>
                  <th className="p-4">Your Rank</th>
                  <th className="p-4">Top Competitor</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history
                  .filter((h) => h.type === "RANK_CHECK")
                  .slice(-1)[0]
                  ?.googleRankings.map((rank: any, i: number) => {
                    // Find competitor data
                    const snapshot = history
                      .filter((h) => h.type === "RANK_CHECK")
                      .slice(-1)[0];
                    const compData = snapshot.competitorInsights?.find(
                      (c: any) => c.keyword === rank.keyword
                    );

                    return (
                      <tr
                        key={i}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4 text-white font-medium">
                          {rank.keyword}
                        </td>
                        <td className="p-4">
                          {rank.position > 0 ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                rank.position <= 3
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              #{rank.position}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">
                              Not Ranked
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs">
                          {compData ? (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-300">
                                {compData.competitorDomain}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded ${
                                  compData.position < rank.position
                                    ? "bg-rose-500/20 text-rose-400"
                                    : "bg-emerald-500/20 text-emerald-400"
                                }`}
                              >
                                #{compData.position}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right text-xs">
                          {compData && compData.position < rank.position ? (
                            <span className="text-rose-400 flex items-center justify-end gap-1">
                              Losing by {rank.position - compData.position}{" "}
                              <AlertTriangle className="w-3 h-3" />
                            </span>
                          ) : rank.position > 0 ? (
                            <span className="text-emerald-400">Winning 🏆</span>
                          ) : (
                            <span className="text-slate-500">Neutral</span>
                          )}
                        </td>
                      </tr>
                    );
                  }) || (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* 3. HISTORY */}
      {activeTab === "history" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="p-6 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl flex justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-300">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold">Time Travel</h4>
                <p className="text-sm text-slate-400">
                  Import historical data via Wayback Machine.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                className="bg-slate-900 border border-white/10 text-white rounded-lg p-2"
                value={waybackDate}
                onChange={(e) => setWaybackDate(e.target.value)}
              />
              <button
                onClick={runWaybackScan}
                disabled={runningWayback}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm flex gap-2 items-center"
              >
                {runningWayback ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}{" "}
                Import
              </button>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Result</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((scan) => (
                  <tr key={scan._id}>
                    <td className="p-4 text-white">
                      {new Date(scan.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-slate-800 px-2 py-1 rounded">
                        {scan.type || "AUDIT"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">
                      {scan.overallScore
                        ? `${scan.overallScore}/100`
                        : "Rank Data"}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingScan(scan);
                          setNewDate(
                            new Date(scan.date).toISOString().split("T")[0]
                          );
                        }}
                        className="p-2 text-slate-400 hover:text-white"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                      <Dialog
                        open={!!editingScan}
                        onOpenChange={() => setEditingScan(null)}
                      >
                        <DialogContent className="bg-slate-900 border-white/10 text-white">
                          <DialogHeader>
                            <DialogTitle>Edit Date</DialogTitle>
                          </DialogHeader>
                          <input
                            type="datetime-local"
                            className="bg-slate-950 border border-white/10 p-3 rounded-lg w-full mb-4 text-white"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                          />
                          <button
                            onClick={handleUpdateDate}
                            className="bg-indigo-600 w-full py-2 rounded-lg"
                          >
                            Update
                          </button>
                        </DialogContent>
                      </Dialog>
                      <button
                        onClick={() => handleDeleteScan(scan._id)}
                        className="p-2 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* 4. REPORTS VAULT */}
      {activeTab === "reports" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {savedReports.map((report) => (
            <div
              key={report._id}
              className="p-5 bg-slate-900/40 border border-white/10 rounded-xl hover:border-indigo-500/30 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                
                {/* 🛠️ FIXED: Added Print View Button & Corrected ID Usage */}
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-xs bg-slate-800 hover:bg-white text-slate-300 px-3 py-1.5 rounded-lg">
                        Open
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl bg-slate-950 border-white/10 text-white max-h-[85vh] overflow-y-auto">
                      <DialogHeader className="flex flex-row justify-between items-center pr-8">
                        <DialogTitle>{report.title}</DialogTitle>
                        {/* 🧠 DOWNLOAD FROM VAULT */}
                        <button
                          onClick={() =>
                            downloadPdf(`report-${report._id}`, report.title)
                          }
                          disabled={downloadingPdf}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg"
                        >
                          {downloadingPdf ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}{" "}
                          PDF
                        </button>
                      </DialogHeader>
                      <div
                        id={`report-${report._id}`}
                        className="p-1 bg-slate-950"
                      >
                        <SeoReportCard
                          report={{
                            startDate: report.dateGenerated,
                            endDate: report.dateGenerated,
                            comparison: report.data,
                            aiSummary: report.aiSummary,
                          }}
                          client={client}
                          history={history}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <button
                    onClick={() => {
                      // 🛡️ Safe Check: Using _id prevents the "undefined" error
                      if (report._id) {
                        window.open(
                          `/admin/seo/print/${report._id}`,
                          "_blank"
                        );
                      } else {
                        toast.error("Report ID is missing");
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg"
                  >
                     <Printer className="w-3 h-3" /> Print View
                  </button>
                </div>
              </div>
              <h4 className="text-white font-medium truncate">
                {report.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(report.dateGenerated).toLocaleDateString()}
              </p>
            </div>
          ))}
          {savedReports.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-xl text-slate-500">
              No reports saved.
            </div>
          )}
        </motion.div>
      )}

      {/* 5. SETTINGS */}
      {activeTab === "settings" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-2xl"
        >
          <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" /> Client Config
            </h3>
            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Name</label>
                  <input
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">URL</label>
                  <input
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Keywords</label>
                <textarea
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white"
                  value={formData.keywords}
                  onChange={(e) =>
                    setFormData({ ...formData, keywords: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">
                  Competitors (Urls)
                </label>
                <textarea
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white"
                  placeholder="https://comp1.com, https://comp2.com"
                  value={formData.competitors}
                  onChange={(e) =>
                    setFormData({ ...formData, competitors: e.target.value })
                  }
                />
              </div>
              <button
                type="submit"
                disabled={savingSettings}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium w-full flex justify-center"
              >
                {savingSettings ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </button>
            </form>
          </div>
          <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-6">
            <h4 className="text-rose-400 font-semibold mb-2 flex gap-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h4>
            <p className="text-sm text-slate-400 mb-4">Irreversible action.</p>
            <button
              onClick={handleDeleteClient}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-xl text-sm font-medium"
            >
              Delete Client
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}