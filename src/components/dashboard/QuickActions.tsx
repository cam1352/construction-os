import React from "react";

export function QuickActions() {
  const actions = [
    {
      title: "New Estimate Takeoff",
      href: "/agents/estimating",
      description: "Auto-parse specs and calculate job costs",
      color: "border-sky-200 hover:border-sky-400 bg-sky-50/50 text-sky-800",
    },
    {
      title: "Triage Inbound Leads",
      href: "/agents/sales",
      description: "Purge spam and dispatch autonomous replies",
      color: "border-purple-200 hover:border-purple-400 bg-purple-50/50 text-purple-800",
    },
    {
      title: "Publish SEO Blog",
      href: "/agents/marketing",
      description: "Generate and push articles to portfolio sites",
      color: "border-emerald-200 hover:border-emerald-400 bg-emerald-50/50 text-emerald-800",
    },
    {
      title: "Crawl Trade Leads",
      href: "/agents/scraper",
      description: "Harvest construction contacts into CRM",
      color: "border-amber-200 hover:border-amber-400 bg-amber-50/50 text-amber-800",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
        <span>⚡ Quick Actions & AI Automation</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((act) => (
          <a
            key={act.href}
            href={act.href}
            className={`block p-3.5 rounded-lg border transition-all text-left group ${act.color}`}
          >
            <div className="font-semibold text-xs text-slate-900 group-hover:text-sky-600 transition-colors">
              {act.title} &rarr;
            </div>
            <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              {act.description}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
