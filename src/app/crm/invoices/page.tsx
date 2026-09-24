import React from "react";

export default function InvoicesPage() {
  const mockInvoices = [
    {
      invoiceNumber: "INV-2026-001",
      customer: "Pacific Ridge Holdings",
      project: "PRJ-2026-001 (Commercial TI)",
      amount: "$24,500.00",
      balance: "$0.00",
      status: "PAID",
      dueDate: "2026-10-15",
    },
    {
      invoiceNumber: "INV-2026-002",
      customer: "Harborview Condominiums",
      project: "PRJ-2026-002 (Lobby Drywall)",
      amount: "$18,750.00",
      balance: "$18,750.00",
      status: "ISSUED",
      dueDate: "2026-10-20",
    },
    {
      invoiceNumber: "INV-2026-003",
      customer: "Elena Rostova",
      project: "PRJ-2026-003 (Residential Reno)",
      amount: "$5,000.00",
      balance: "$5,000.00",
      status: "OVERDUE",
      dueDate: "2026-09-18",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
            CRM Domain &bull; Billing & Receivables
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices & Receivables</h1>
          <p className="text-sm text-slate-500">
            Progress billing, milestone invoicing, and simulated accounts receivable tracking.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3.5">Invoice #</th>
              <th className="px-5 py-3.5">Customer & Project</th>
              <th className="px-5 py-3.5">Total Amount</th>
              <th className="px-5 py-3.5">Balance Due</th>
              <th className="px-5 py-3.5">Due Date</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockInvoices.map((inv) => (
              <tr key={inv.invoiceNumber} className="hover:bg-slate-50/80 transition">
                <td className="px-5 py-3.5 font-mono font-bold text-sky-600">{inv.invoiceNumber}</td>
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-900">{inv.customer}</div>
                  <div className="text-[11px] text-slate-500">{inv.project}</div>
                </td>
                <td className="px-5 py-3.5 font-bold text-slate-900">{inv.amount}</td>
                <td className="px-5 py-3.5 text-slate-700 font-medium">{inv.balance}</td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">{inv.dueDate}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : inv.status === "OVERDUE"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-sky-100 text-sky-800"
                    }`}
                  >
                    {inv.status}
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
