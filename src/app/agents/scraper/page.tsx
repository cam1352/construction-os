import React from "react";

export default function ScraperAgentPage() {
  const harvestStats = {
    totalHarvested: 580,
    crmDuplicatesSkipped: 142,
    newLeadsCreated: 438,
    activeSources: ["YellowPages BC", "Houzz Vancouver", "BuildZoom Trade Directory"],
  };

  const recentHarvestedLeads = [
    {
      company: "Fraser Valley Framing & Construction",
      contact: "Dan Fraser",
      trade: "Framing & Carpentry",
      email: "dan@fraservalleyframing.example",
      city: "Abbotsford, BC",
      status: "SAVED_TO_CRM",
      date: "12 mins ago",
    },
    {
      company: "Apex Drywall Systems",
      contact: "Marco Rossi",
      trade: "Drywall Systems",
      email: "marco@apexdrywall.example",
      city: "Vancouver, BC",
      status: "DUPLICATE_SKIPPED",
      date: "35 mins ago",
    },
    {
      company: "Coastal Electric & Automation",
      contact: "Evelyn Reed",
      trade: "Electrical",
      email: "evelyn@coastalelectric.example",
      city: "Burnaby, BC",
      status: "SAVED_TO_CRM",
      date: "1 hour ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
            AI Agent Control Center &bull; Autonomous Lead Harvesting
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Web Scraper Control Center</h1>
          <p className="text-sm text-slate-500">
            Autonomous trade directory scraping, contractor email extraction, deduplication, and CRM lead ingestion.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition shadow-sm">
            Run Directory Harvester
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-semibold uppercase">Total Leads Harvested</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{harvestStats.totalHarvested}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-semibold uppercase">CRM Duplicates Blocked</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{harvestStats.crmDuplicatesSkipped}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-semibold uppercase">New Qualified Leads</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{harvestStats.newLeadsCreated}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
          Recent Scraped Directory Entries
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3.5">Contractor / Trade</th>
              <th className="px-5 py-3.5">Contact & Email</th>
              <th className="px-5 py-3.5">Location</th>
              <th className="px-5 py-3.5">Deduplication Status</th>
              <th className="px-5 py-3.5">Harvested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentHarvestedLeads.map((lead, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-900">{lead.company}</div>
                  <div className="text-[11px] text-slate-500">{lead.trade}</div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-slate-800 font-medium">{lead.contact}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{lead.email}</div>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{lead.city}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    lead.status === "SAVED_TO_CRM" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-500 text-[11px]">{lead.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
