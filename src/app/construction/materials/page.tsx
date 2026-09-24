import React from "react";

export default function MaterialsPage() {
  const mockMaterials = [
    {
      sku: "MAT-DRY-001",
      name: "1/2\" Drywall Sheet (4x8)",
      category: "DRYWALL",
      unitCost: "$16.50",
      markup: "20%",
      stock: "250 sheets",
      reorderPoint: "50 sheets",
    },
    {
      sku: "MAT-CLN-002",
      name: "HEPA Disinfectant Concentrate (5 Gal)",
      category: "CLEANING",
      unitCost: "$45.00",
      markup: "25%",
      stock: "18 pails",
      reorderPoint: "5 pails",
    },
    {
      sku: "MAT-PNT-003",
      name: "Commercial Eggshell Latex Primer",
      category: "PAINTING",
      unitCost: "$38.00",
      markup: "22%",
      stock: "42 cans",
      reorderPoint: "10 cans",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
          Construction Domain &bull; Inventory & Catalog
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Materials & Inventory</h1>
        <p className="text-sm text-slate-500">
          Stock levels, trade unit costs, markup percentages, and replenishment thresholds.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3.5">SKU</th>
              <th className="px-5 py-3.5">Material Description</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Unit Cost</th>
              <th className="px-5 py-3.5">Target Markup</th>
              <th className="px-5 py-3.5">Stock on Hand</th>
              <th className="px-5 py-3.5">Reorder Point</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockMaterials.map((m) => (
              <tr key={m.sku} className="hover:bg-slate-50/80 transition">
                <td className="px-5 py-3.5 font-mono font-bold text-sky-600">{m.sku}</td>
                <td className="px-5 py-3.5 font-semibold text-slate-900">{m.name}</td>
                <td className="px-5 py-3.5 font-mono text-slate-600 text-[11px]">{m.category}</td>
                <td className="px-5 py-3.5 font-medium text-slate-800">{m.unitCost}</td>
                <td className="px-5 py-3.5 text-emerald-700 font-medium">{m.markup}</td>
                <td className="px-5 py-3.5 font-bold text-slate-900">{m.stock}</td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">{m.reorderPoint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
