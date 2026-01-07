"use client";

import {
  ArrowUp,
  ArrowDown,
  Minus,
  Trophy,
  Sparkles,
  Layers,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function SeoReportCard({
  report,
  client,
  history,
}: {
  report: any;
  client?: any;
  history?: any[];
}) {
  if (!report) return null;

  // Graph Data
  const graphData = history
    ? history.map((h) => ({
        date: new Date(h.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        score: h.overallScore,
      }))
    : [];

  return (
    <div className="bg-white border border-slate-200 rounded-none md:rounded-xl w-full max-w-7xl mx-auto shadow-xl text-slate-900 font-sans">
      {/* 1. AGENCY HEADER (Wide) */}
      <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              AnyNet<span className="text-indigo-600">.io</span>
            </h1>
            <p className="text-xs text-indigo-600 uppercase tracking-wider font-bold">
              SEO Performance Report
            </p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-slate-900">
            {client?.name || "Client Report"}
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Generated:{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* 2. EXECUTIVE SUMMARY (Full Width) */}
        {report.aiSummary && (
          <div className="p-6 rounded-xl bg-indigo-50 border border-indigo-100 flex gap-4 items-start shadow-sm">
            <div className="p-2 bg-white rounded-lg shrink-0 shadow-sm border border-indigo-50 mt-1">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-indigo-900 font-bold text-sm mb-2 uppercase tracking-wide">
                Executive Strategy Brief
              </h4>
              <p className="text-slate-700 text-base leading-relaxed font-medium">
                {report.aiSummary}
              </p>
            </div>
          </div>
        )}

        {/* 3. LANDSCAPE GRID (Graph Left, Table Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: VISIBILITY GRAPH */}
          <div className="flex flex-col h-full">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <TrendingUp className="w-4 h-4 text-indigo-600" /> Visibility
              Growth
            </h3>
            <div className="flex-1 min-h-[300px] bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphData}>
                  <defs>
                    <linearGradient
                      id="cardGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide domain={[0, 100]} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fill="url(#cardGradient)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT: RANKINGS TABLE */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Trophy className="w-4 h-4 text-indigo-600" /> Keyword Rankings
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold text-xs uppercase">Keyword</th>
                    <th className="p-3 font-bold text-xs uppercase text-center">
                      Rank
                    </th>
                    <th className="p-3 font-bold text-xs uppercase text-right">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {report.comparison.slice(0, 8).map((item: any, i: number) => (
                    <tr
                      key={i}
                      className="group hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 text-slate-900 font-bold truncate max-w-[150px]">
                        {item.keyword}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold border ${
                            item.endRank !== "Not Ranked"
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          {item.endRank}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === "improved"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : item.status === "declined"
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {item.change === "NEW" ? (
                            "NEW"
                          ) : (
                            <>
                              {typeof item.change === "number" &&
                              item.change > 0 ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : typeof item.change === "number" &&
                                item.change < 0 ? (
                                <ArrowDown className="w-3 h-3" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                              {typeof item.change === "number"
                                ? Math.abs(item.change)
                                : item.change}
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
        <div className="border-t border-slate-200 pt-6 flex justify-between items-center text-slate-400 text-xs">
          <p>Generated by AnyNet.io Agency Tools</p>
          <p className="font-medium">
            Confidential Performance Data • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
