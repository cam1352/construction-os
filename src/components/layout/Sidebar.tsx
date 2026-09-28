import React from "react";
import { NAVIGATION_CONFIG } from "../../lib/navigation";

interface SidebarProps {
  currentPath?: string;
}

export function Sidebar({ currentPath = "/" }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 bg-slate-950/40">
        <a href="/" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/20 group-hover:bg-sky-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-sm tracking-wide">Grow Your Business</span>
            <span className="text-[10px] text-sky-400 font-mono">ERP & AGENT MGR</span>
          </div>
        </a>
      </div>

      {/* Overview Home Link */}
      <div className="px-3 pt-4 pb-2">
        <a
          href="/"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            currentPath === "/"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Dashboard Overview</span>
        </a>
      </div>

      {/* Navigation Domains & Links */}
      <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
        {NAVIGATION_CONFIG.map((group) => (
          <div key={group.id} className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {group.title}
            </div>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    title={item.description}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                      isActive
                        ? "bg-sky-600 text-white shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-sky-400 transition-colors"></span>
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                          isActive
                            ? "bg-sky-700 text-white"
                            : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>Engine Status</span>
          <span className="text-emerald-400 font-mono flex items-center">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1 animate-pulse"></span>
            Operational
          </span>
        </div>
        <div className="mt-1 text-[10px] text-slate-600">
          Grow Your Business v1.0.0 (Zero-API)
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
