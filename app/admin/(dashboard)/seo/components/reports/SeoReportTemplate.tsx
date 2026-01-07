"use client";

import {
  ArrowUp,
  ArrowDown,
  Minus,
  Trophy,
  Sparkles,
  Layers,
  TrendingUp,
  Printer,
  Share2,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function SeoReportTemplate({
  report,
  client,
  history,
}: {
  report: any;
  client?: any;
  history?: any[];
}) {
  if (!report) return null;

  // Formatting Data for Graph
  const graphData = history
    ? history.map((h) => ({
        date: new Date(h.date).toLocaleDateString("en-GB", {
          month: "short",
          day: "numeric",
        }),
        score: h.overallScore,
      }))
    : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* 1. PRINT CONTROLS (Floating - Hidden when printing) */}
      <div className="fixed bottom-6 right-6 flex gap-3 print:hidden z-50">
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-full shadow-lg hover:bg-slate-50 transition-all font-medium text-sm">
          <Share2 className="w-4 h-4" /> Share
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all font-bold tracking-wide"
        >
          <Printer className="w-4 h-4" /> Download PDF
        </button>
      </div>

      {/* 2. MAIN A4 CONTAINER */}
      {/* w-[297mm] h-[210mm] sets strict A4 Landscape size.
         mx-auto centers it on screen.
         print rules remove margins/shadows for the actual PDF generation.
      */}
      <div className="relative w-full md:w-[297mm] min-h-[210mm] mx-auto bg-white shadow-2xl print:shadow-none print:w-full print:h-full print:m-0 overflow-hidden text-slate-900 font-sans print:rounded-none md:rounded-xl">
        
        {/* HEADER SECTION */}
        <div className="bg-slate-50 border-b border-slate-200 p-8 flex justify-between items-center print:p-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg print:shadow-none">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                AnyNet<span className="text-indigo-600">.io</span>
              </h1>
              <p className="text-xs text-indigo-600 uppercase tracking-widest font-bold">
                Professional SEO Audit
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-slate-900 mb-1">
              {client?.name || "Client Report"}
            </h2>
             <div className="flex items-center justify-end gap-2 text-slate-500 font-medium text-sm">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
             </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="p-8 grid grid-cols-12 gap-8 print:p-6 print:gap-6 h-full">
          
          {/* LEFT COLUMN: Summary & Graph (Width: 60%) */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-8">
            
            {/* EXECUTIVE SUMMARY */}
            {report.aiSummary && (
              <div className="relative p-6 rounded-2xl bg-indigo-50/60 border border-indigo-100 print:bg-indigo-50 print:border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-indigo-900 font-bold text-xs uppercase tracking-wider">
                        Executive Strategy Brief
                    </h4>
                </div>
                <p className="text-slate-800 text-[15px] leading-relaxed font-medium">
                  {report.aiSummary}
                </p>
              </div>
            )}

            {/* VISIBILITY CHART */}
            <div className="flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <TrendingUp className="w-4 h-4 text-indigo-600" /> Visibility Velocity
                </h3>
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[300px] print:border-slate-300 print:shadow-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={graphData}>
                      <defs>
                        <linearGradient id="cardGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        fill="url(#cardGradient)"
                        isAnimationActive={false} // CRITICAL FOR PDF GENERATION
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Rankings Table (Width: 40%) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col h-full">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Trophy className="w-4 h-4 text-indigo-600" /> Keyword Performance
            </h3>
            
            <div className="flex-1 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm print:shadow-none print:border-slate-300">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold text-xs uppercase">Keyword</th>
                    <th className="p-4 font-bold text-xs uppercase text-center">Rank</th>
                    <th className="p-4 font-bold text-xs uppercase text-right">Mov</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.comparison.slice(0, 9).map((item: any, i: number) => (
                    <tr key={i} className="group hover:bg-slate-50/50 print:bg-white">
                      <td className="p-4 text-slate-900 font-bold truncate max-w-[140px]">
                        {item.keyword}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                            item.endRank !== "Not Ranked"
                              ? "bg-slate-900 text-white border-slate-900 print:bg-white print:text-black"
                              : "bg-slate-100 text-slate-400 border-slate-200"
                          }`}
                        >
                          {item.endRank}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            item.status === "improved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : item.status === "declined"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-slate-50 text-slate-600 border border-slate-100"
                          }`}
                        >
                          {item.change === "NEW" ? "NEW" : (
                            <>
                              {typeof item.change === "number" && item.change > 0 ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : typeof item.change === "number" && item.change < 0 ? (
                                <ArrowDown className="w-3 h-3" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                              {typeof item.change === "number" ? Math.abs(item.change) : item.change}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="absolute bottom-0 w-full border-t border-slate-200 p-6 flex justify-between items-center bg-slate-50 print:bg-white">
            <div className="flex gap-4 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                <p>AnyNet.io Agency Tools</p>
                <p>Confidential</p>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Generated {new Date().toLocaleDateString()}
            </p>
        </div>
      </div>

      {/* 3. PRINT CSS INJECTION */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 0mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            background: white;
          }
        }
      `}</style>
    </>
  );
}