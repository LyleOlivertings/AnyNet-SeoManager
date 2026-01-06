"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus, Trophy } from "lucide-react";

export default function SeoReportCard({ report }: { report: any }) {
  if (!report) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 mt-6"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Performance Report
            </h3>
            <p className="text-sm text-slate-400 mt-1">
                Comparing {new Date(report.startDate).toLocaleDateString()} vs {new Date(report.endDate).toLocaleDateString()}
            </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/5">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="p-4 font-medium">Keyword</th>
              <th className="p-4 font-medium">Start Rank</th>
              <th className="p-4 font-medium">Current Rank</th>
              <th className="p-4 font-medium text-right">Movement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {report.comparison.map((item: any, i: number) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-white font-medium">{item.keyword}</td>
                <td className="p-4 text-slate-400">{item.startRank}</td>
                <td className="p-4 text-white">{item.endRank}</td>
                <td className="p-4 text-right">
                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    item.status === 'improved' ? 'bg-emerald-500/10 text-emerald-400' : 
                    item.status === 'declined' ? 'bg-rose-500/10 text-rose-400' : 
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {item.change === "NEW" ? "NEW ENTRY" : (
                        <>
                            {item.change > 0 ? <ArrowUp className="w-3 h-3" /> : item.change < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {Math.abs(item.change)} Spots
                        </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}