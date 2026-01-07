"use client";

import { useEffect, useState, use } from "react";
import { 
  Loader2, 
  Printer, 
  Globe, 
  Layers, 
  Calendar,
  MapPin,
  LayoutDashboard 
} from "lucide-react";
import SeoReportCard from "../../components/SeoReportCard";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PrintReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Data States
  const [report, setReport] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch the specific report
        const resReport = await fetch(`/api/seo/reports/${id}`);
        const jsonReport = await resReport.json();

        if (!jsonReport.success) throw new Error(jsonReport.error);
        
        const reportData = jsonReport.data;
        setReport(reportData);

        // 2. Handle Client Data (Fix: Check 'clientId' field)
        // The API populates 'clientId', so it becomes an object { _id, name, ... }
        const clientRef = reportData.clientId; 

        if (clientRef) {
            // If populated successfully, we can use the data directly
            if (typeof clientRef === 'object') {
                setClient(clientRef);
            }

            // Extract the ID string to fetch history
            const cId = clientRef._id || clientRef;

            // Fetch History (for the graph)
            const resHistory = await fetch("/api/seo/history", {
                method: "POST",
                body: JSON.stringify({ clientId: cId }),
            });
            const jsonHistory = await resHistory.json();
            setHistory(jsonHistory.data || []);
            
            // Fallback: If population failed (only ID returned), fetch full client profile
            if (typeof clientRef === 'string') {
                 const resClient = await fetch(`/api/seo/clients/${clientRef}`);
                 const jsonClient = await resClient.json();
                 if (jsonClient.success) setClient(jsonClient.data);
            }
        }

      } catch (e) {
        console.error(e);
        toast.error("Failed to load report data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600 gap-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-sm font-medium uppercase tracking-widest animate-pulse">
          Preparing Report...
        </p>
      </div>
    );
  }

  if (!report) return <div className="p-10 text-center text-red-500">Report not found.</div>;

  return (
    <div className="min-h-screen bg-slate-100 font-sans print:bg-white print:min-h-0">
      
      {/* 1. SCREEN-ONLY TOOLBAR */}
      <div className="print:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-50 flex items-center justify-between px-8 text-white shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide">Report Preview</span>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => window.close()}
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
                Close
            </button>
            <button 
                onClick={handlePrint}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
                <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
        </div>
      </div>

      {/* 2. PRINT CANVAS */}
      <div className="pt-24 pb-20 print:pt-0 print:pb-0">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[1100px] mx-auto bg-white shadow-2xl print:shadow-none print:w-full print:max-w-none"
        >
            <div className="p-0">
                <SeoReportCard
                    report={{
                        startDate: report.dateGenerated,
                        endDate: report.dateGenerated,
                        comparison: report.data || report.comparison, 
                        aiSummary: report.aiSummary,
                    }}
                    client={client}
                    history={history}
                />
            </div>

            {/* PRINT FOOTER */}
            <div className="bg-slate-50 p-8 border-t border-slate-100 grid grid-cols-3 gap-8 text-xs text-slate-500 print:break-inside-avoid">
                <div>
                    <h5 className="font-bold text-slate-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Digital Assets
                    </h5>
                    <p>{client?.url || "N/A"}</p>
                    <p>Generated via AnyNet.io</p>
                </div>
                <div>
                    <h5 className="font-bold text-slate-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> Report Date
                    </h5>
                    <p>{new Date(report.dateGenerated).toLocaleDateString("en-GB", {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</p>
                </div>
                <div className="text-right">
                    <h5 className="font-bold text-slate-900 mb-2 uppercase tracking-wider flex items-center justify-end gap-2">
                        <MapPin className="w-3 h-3" /> AnyNet SA
                    </h5>
                    <p>Cape Town, South Africa</p>
                    <p>support@anynet.io</p>
                </div>
            </div>

        </motion.div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body {
            background: white;
            color: black;
          }
          ::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}