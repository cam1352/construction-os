import React from "react";

export default function EstimatingAgentPage() {
  const sampleTakeoff = {
    jobSpec: "1500 sqft residential cleaning",
    dimensions: { area: 1500, unit: "sqft" },
    trade: "CLEANING",
    breakdown: {
      laborHours: 7.5,
      laborCost: 337.50,
      materialCost: 47.50,
      equipmentCost: 0.00,
      subcontractorCost: 0.00,
      directCost: 385.00,
      overhead: 38.50,
      margin: 77.00,
      subtotal: 500.50,
      tax: 25.03,
      grandTotal: 525.53,
    },
    lineItems: [
      { desc: "Post-renovation residential cleaning (1500 sqft @ $0.225/sqft)", cost: "$337.50" },
      { desc: "Cleaning consumables & sanitation agents", cost: "$47.50" },
      { desc: "Overhead & markup (30%)", cost: "$115.50" },
      { desc: "Provincial & Federal Sales Tax (5%)", cost: "$25.03" },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
            AI Agent Control Center &bull; Dimension Takeoff Engine
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Estimating Calculator Agent</h1>
          <p className="text-sm text-slate-500">
            Natural language job spec parser, automated trade dimension takeoffs, and itemized bids.
          </p>
        </div>
      </div>

      {/* Interactive Calculator Spec Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900">Active Job Takeoff Specification</h3>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            readOnly
            value={sampleTakeoff.jobSpec}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
          />
          <button className="px-4 py-2.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition">
            Calculate Takeoff
          </button>
        </div>

        {/* Calculated Financial Parity Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Direct Cost</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">${sampleTakeoff.breakdown.directCost.toFixed(2)}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Overhead & Margin</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">${(sampleTakeoff.breakdown.overhead + sampleTakeoff.breakdown.margin).toFixed(2)}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Subtotal</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">${sampleTakeoff.breakdown.subtotal.toFixed(2)}</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-[10px] text-purple-700 uppercase font-semibold">Grand Total</div>
            <div className="text-base font-bold text-purple-900 mt-0.5">${sampleTakeoff.breakdown.grandTotal.toFixed(2)}</div>
          </div>
        </div>

        {/* Line Items Detail */}
        <div className="pt-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Itemized Estimate Lines</h4>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
            {sampleTakeoff.lineItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center px-4 py-2.5 text-xs bg-slate-50/50">
                <span className="text-slate-700">{item.desc}</span>
                <span className="font-mono font-bold text-slate-900">{item.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
