import React from "react";

export default function PaymentsPage() {
  const mockPayments = [
    {
      ref: "PAY-2026-901",
      invoice: "INV-2026-001",
      customer: "Pacific Ridge Holdings",
      amount: "$24,500.00",
      method: "ACH_TRANSFER",
      date: "2026-09-22",
      status: "COMPLETED",
    },
    {
      ref: "PAY-2026-902",
      invoice: "INV-2026-004",
      customer: "Beacon Hill Retail",
      amount: "$12,400.00",
      method: "CREDIT_CARD (SIMULATED)",
      date: "2026-09-20",
      status: "COMPLETED",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
          CRM Domain &bull; Payment Ledger
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Payments & Transactions</h1>
        <p className="text-sm text-slate-500">
          Payment ledger and zero-API payment simulator transaction records.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3.5">Payment Ref</th>
              <th className="px-5 py-3.5">Invoice #</th>
              <th className="px-5 py-3.5">Customer</th>
              <th className="px-5 py-3.5">Amount</th>
              <th className="px-5 py-3.5">Method</th>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockPayments.map((p) => (
              <tr key={p.ref} className="hover:bg-slate-50/80 transition">
                <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{p.ref}</td>
                <td className="px-5 py-3.5 font-mono text-sky-600">{p.invoice}</td>
                <td className="px-5 py-3.5 font-medium text-slate-900">{p.customer}</td>
                <td className="px-5 py-3.5 font-bold text-emerald-600">{p.amount}</td>
                <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">{p.method}</td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">{p.date}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {p.status}
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
