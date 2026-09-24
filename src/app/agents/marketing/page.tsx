import React from "react";

export default function MarketingAgentPage() {
  const brandProfiles = [
    {
      brand: "Walker General Contractors",
      slug: "walker-general-contractors",
      trade: "Commercial & Residential General Contracting",
      articlesPublished: 14,
      targetKeywords: ["commercial general contractor Vancouver", "tenant improvements BC", "heritage home renovation"],
      lastPost: "Top 5 Seismic Retrofitting Upgrades for Vancouver Heritage Properties",
    },
    {
      brand: "Vancouver Cleaning Specialists",
      slug: "vancouver-cleaning",
      trade: "Post-Construction & Commercial Cleaning",
      articlesPublished: 22,
      targetKeywords: ["post construction cleaning Vancouver", "commercial office janitorial", "strata turnover cleaning"],
      lastPost: "Complete Post-Construction Cleaning Checklist for General Contractors",
    },
    {
      brand: "Vancouver Pharmacy Platform",
      slug: "vancouver-pharmacy",
      trade: "Healthcare & Prescription Fulfillment",
      articlesPublished: 8,
      targetKeywords: ["online pharmacy Vancouver", "compounding prescriptions BC"],
      lastPost: "How Digital Prescription Fulfillment Streamlines Patient Care in BC",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
            AI Agent Control Center &bull; Multi-Brand Content Marketing
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing SEO Blog Manager</h1>
          <p className="text-sm text-slate-500">
            Autonomous SEO blog generation, keyword clustering, markdown frontmatter formatting, and direct disk push.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {brandProfiles.map((p) => (
          <div key={p.slug} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <span className="text-[10px] font-mono text-purple-600 uppercase font-bold tracking-wider">
                Target Portfolio Brand
              </span>
              <h3 className="font-bold text-base text-slate-900 mt-0.5">{p.brand}</h3>
              <p className="text-xs text-slate-500">{p.trade}</p>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 space-y-1">
              <div className="text-[10px] text-purple-800 font-bold uppercase">Latest Autonomous Post</div>
              <div className="text-xs font-semibold text-slate-800">{p.lastPost}</div>
              <div className="text-[10px] text-emerald-600 font-mono">✓ Written to local disk repository</div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-700">Target SEO Keywords:</div>
              <div className="flex flex-wrap gap-1">
                {p.targetKeywords.map((kw, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Total Posts: <strong className="text-slate-800">{p.articlesPublished}</strong></span>
              <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[11px] font-medium transition">
                Generate Blog &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
