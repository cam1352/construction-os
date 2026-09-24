import React from "react";
import { StatCard } from "../components/dashboard/StatCard";
import { QuickActions } from "../components/dashboard/QuickActions";
import { NAVIGATION_CONFIG } from "../lib/navigation";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Top Welcome & System Status Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Zero-API Mode • Self-Contained PoC</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Construction Business OS Dashboard</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Centralized ERP control center orchestrating CRM pipelines, construction field operations, and autonomous AI agents.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10 self-start md:self-auto">
          <div className="text-right">
            <div className="text-xs font-semibold text-white">Task Worker Pool</div>
            <div className="text-[11px] text-sky-300 font-mono">100 Concurrency Slots</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold">
            100
          </div>
        </div>
      </div>

      {/* KPI Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value="12"
          change="+2 this mo"
          changeType="positive"
          subtitle="6 in progress, 4 planning, 2 bid phase"
          icon={
            <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
          }
        />
        <StatCard
          title="Invoiced Revenue"
          value="$48,250"
          change="+18.4%"
          changeType="positive"
          subtitle="Total accounts receivable for current period"
          icon={
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="CRM Leads Qualified"
          value="34"
          change="84% score"
          changeType="positive"
          subtitle="AI auto-triaged & scored inquiries"
          icon={
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Autonomous AI Agents"
          value="4"
          change="Healthy"
          changeType="neutral"
          subtitle="Sales, Estimating, Marketing, Scraper"
          icon={
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions Shortcuts */}
      <QuickActions />

      {/* Domain Navigation Hub (15 Navigation Links Displayed Across 3 Domains) */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Enterprise Module Directory</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {NAVIGATION_CONFIG.map((group) => (
            <div key={group.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800">{group.title}</span>
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                  {group.items.length} Modules
                </span>
              </div>

              <div className="p-4 flex-1 space-y-2">
                {group.items.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-800 group-hover:text-sky-600 transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.description}
                      </div>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium">
                        {item.badge}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
