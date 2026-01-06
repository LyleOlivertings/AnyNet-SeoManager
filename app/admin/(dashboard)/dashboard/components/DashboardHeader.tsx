"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, Settings } from "lucide-react";

export default function DashboardHeader() {
  const { data: session } = useSession();

  // Fallback if session is loading
  const userName = session?.user?.name?.split(" ")[0] || "Partner";
  const userPosition = session?.user?.position || "AnyNet Team";

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Hello, {userName} 👋
        </h1>
        <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
          {userPosition} &bull; Cape Town (SAST)
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar (Visual Only) */}
        <div className="hidden md:flex items-center bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-400 w-64 focus-within:border-indigo-500/50 transition-colors">
          <Search className="w-4 h-4 mr-2" />
          <input 
            type="text" 
            placeholder="Search clients..." 
            className="bg-transparent outline-none w-full placeholder:text-slate-600"
          />
        </div>

        {/* Action Icons */}
        <button className="p-2.5 bg-slate-900/50 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2.5 bg-slate-900/50 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}