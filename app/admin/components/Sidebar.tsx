"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Search, 
  Settings, 
  LogOut, 
  PieChart, 
  Users,
  Layers
} from "lucide-react";
import { motion } from "framer-motion";

const MENU_ITEMS = [
  { name: "Overview", icon: LayoutDashboard, href: "/admin/dashboard" },
  { name: "SEO Manager", icon: Search, href: "/admin/seo" },
  { name: "Clients", icon: Users, href: "/admin/clients" }, // Placeholder for future
  { name: "Reports", icon: PieChart, href: "/admin/reports" }, // Placeholder
  { name: "Settings", icon: Settings, href: "/admin/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen bg-slate-950 border-r border-white/5 flex flex-col fixed left-0 top-0 z-50">
      
      {/* 1. LOGO AREA */}
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          AnyNet<span className="text-indigo-400">.io</span>
        </div>
      </div>

      {/* 2. NAVIGATION LINKS */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Main Menu
        </div>
        
        {MENU_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="relative group block"
            >
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? "bg-indigo-600/10 text-indigo-400" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}>
                <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-white"}`} />
                <span className="text-sm font-medium">{item.name}</span>
                
                {/* Active Glow Indicator */}
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 border border-indigo-500/20 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. USER / LOGOUT AREA */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:stroke-rose-400 transition-colors" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}