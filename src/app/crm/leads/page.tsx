import React from "react";

export default function LeadsPage() {
  const mockLeads = [
    {
      id: "lead-01",
      name: "Arthur Pendelton",
      company: "Westside Developments Ltd.",
      email: "arthur@westsidedev.example",
      projectType: "Commercial Tenant Improvement",
      budget: "$85,000",
      score: 92,
      status: "QUALIFIED",
      source: "WEBSITE",
      date: "2026-09-24",
    },
    {
      id: "lead-02",
      name: "Brenda Vance",
      company: "Vance Architecture",
      email: "brenda@vancearch.example",
      projectType: "1500 sqft residential cleaning",
      budget: "$4,500",
      score: 88,
      status: "ESTIMATE_DRAFTED",
      source: "AI_AGENT",
      date: "2026-09-23",
    },
    {
      id: "lead-03",
      name: "Marcus Holloway",
      company: "Private Homeowner",
      email: "m.holloway@homemail.example",
      projectType: "Drywall & Painting Renovation",
      budget: "$22,000",
      score: 76,
      status: "NEW",
      source: "REFERRAL",
      date: "2026-09-22",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
            CRM Domain &bull; Inbound Pipeline
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Leads & AI Qualification</h1>
          <p className="text-sm text-slate-500">
            Real-time inbound lead capture with autonomous AI intent parsing and score ranking.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href="/agents/sales"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
          >
            Launch Sales AI Triage
          </a>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Lead Name / Company</th>
                <th className="px-5 py-3.5">Project Scope</th>
                <th className="px-5 py-3.5">Budget</th>
                <th className="px-5 py-3.5">AI Score</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">{lead.name}</div>
                    <div className="text-[11px] text-slate-500">{lead.company} &bull; {lead.email}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">{lead.projectType}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{lead.budget}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      {lead.score} / 100
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-sky-50 text-sky-700 border border-sky-200">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">{lead.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
