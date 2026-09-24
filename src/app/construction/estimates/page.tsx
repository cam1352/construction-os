import React from "react";

export default function EstimatesPage() {
  const mockEstimates = [
    {
      number: "EST-2026-101",
      name: "1500 sqft residential cleaning takeoff",
      customer: "Brenda Vance",
      directCost: "$385.00",
      markup: "$115.50 (30%)",
      total: "$525.53",
      status: "APPROVED",
      confidence: "98%",
    },
    {
      number: "EST-2026-102",
      name: "2000 sqft drywall install & finish",
      customer: "Westside Developments Ltd.",
      directCost: "$4,250.00",
      markup: "$1,275.00 (30%)",
      total: "$5,801.25",
      status: "SUBMITTED",
      confidence: "95%",
    },
    {
      number: "EST-2026-103",
      name: "2500 sqft commercial interior painting",
      customer: "Beacon Hill Retail",
      directCost: "$3,100.00",
      markup: "$930.00 (30%)",
      total: "$4,231.50",
      status: "DRAFT",
      confidence: "92%",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
            Construction Domain &bull; Takeoffs & Pricing
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Takeoffs & Estimates</h1>
          <p className="text-sm text-slate-500">
            Dimension takeoff formulas, trade rate calculations, and structured contractor bids.
          </p>
        </div>
        <a
          href="/agents/estimating"
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
        >
          Open AI Estimating Calculator &rarr;
        </a>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3.5">Estimate #</th>
              <th className="px-5 py-3.5">Scope Description</th>
              <th className="px-5 py-3.5">Direct Cost</th>
              <th className="px-5 py-3.5">Overhead / Markup</th>
              <th className="px-5 py-3.5">Grand Total (inc Tax)</th>
              <th className="px-5 py-3.5">AI Confidence</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockEstimates.map((est) => (
              <tr key={est.number} className="hover:bg-slate-50/80 transition">
                <td className="px-5 py-3.5 font-mono font-bold text-sky-600">{est.number}</td>
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-900">{est.name}</div>
                  <div className="text-[11px] text-slate-500">Client: {est.customer}</div>
                </td>
                <td className="px-5 py-3.5 text-slate-700">{est.directCost}</td>
                <td className="px-5 py-3.5 text-slate-700">{est.markup}</td>
                <td className="px-5 py-3.5 font-bold text-slate-900">{est.total}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    {est.confidence}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {est.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
