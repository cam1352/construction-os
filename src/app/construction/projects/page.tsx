import React from "react";

export default function ProjectsPage() {
  const mockProjects = [
    {
      id: "PRJ-2026-001",
      title: "Westside Commercial Tenant Improvement",
      customer: "Pacific Ridge Holdings",
      type: "COMMERCIAL",
      status: "IN_PROGRESS",
      budget: "$85,000",
      actualCost: "$38,400",
      progress: 45,
      site: "1050 W Pender St, Vancouver, BC",
    },
    {
      id: "PRJ-2026-002",
      title: "Harborview Tower Lobby Drywall & Paint",
      customer: "Harborview Condominiums",
      type: "COMMERCIAL",
      status: "IN_PROGRESS",
      budget: "$32,000",
      actualCost: "$28,500",
      progress: 85,
      site: "555 Burrard St, Vancouver, BC",
    },
    {
      id: "PRJ-2026-003",
      title: "Rostova Modern Residence Renovation",
      customer: "Elena Rostova",
      type: "RESIDENTIAL",
      status: "PLANNING",
      budget: "$45,000",
      actualCost: "$4,200",
      progress: 10,
      site: "2840 Point Grey Rd, Vancouver, BC",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
            Construction Domain &bull; Master Operations
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Projects & Job Costing</h1>
          <p className="text-sm text-slate-500">
            Active project tracking, budget variance, and real-time job costing progress.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockProjects.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono text-sky-600 font-bold">{p.id}</span>
                <h3 className="font-bold text-sm text-slate-900 mt-0.5">{p.title}</h3>
                <p className="text-xs text-slate-500">{p.customer}</p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                {p.status}
              </span>
            </div>

            <div className="text-xs text-slate-600">
              📍 {p.site}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Budget / Actual:</span>
                <span className="font-semibold text-slate-800">{p.actualCost} / {p.budget}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-600 h-2 rounded-full transition-all"
                  style={{ width: `${p.progress}%` }}
                ></div>
              </div>
              <div className="text-right text-[10px] font-mono text-slate-500">
                {p.progress}% complete
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
