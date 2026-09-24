import React from "react";

export default function CustomersPage() {
  const mockCustomers = [
    {
      id: "cust-01",
      name: "Pacific Ridge Holdings",
      contact: "Danielle Thorne",
      email: "danielle@pacificridge.example",
      phone: "(604) 555-0142",
      type: "COMMERCIAL",
      status: "ACTIVE",
      totalSpent: "$142,500",
      activeJobs: 2,
    },
    {
      id: "cust-02",
      name: "Harborview Condominiums",
      contact: "Gregory Bell",
      email: "gbell@harborview.example",
      phone: "(604) 555-0199",
      type: "COMMERCIAL",
      status: "ACTIVE",
      totalSpent: "$68,000",
      activeJobs: 1,
    },
    {
      id: "cust-03",
      name: "Elena Rostova",
      contact: "Elena Rostova",
      email: "elena.rostova@homemail.example",
      phone: "(778) 555-0177",
      type: "INDIVIDUAL",
      status: "ACTIVE",
      totalSpent: "$24,500",
      activeJobs: 1,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
            CRM Domain &bull; Accounts Roster
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Customers & Accounts</h1>
          <p className="text-sm text-slate-500">
            Account roster, billing profiles, and ongoing construction job associations.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3.5">Account / Company</th>
              <th className="px-5 py-3.5">Primary Contact</th>
              <th className="px-5 py-3.5">Account Type</th>
              <th className="px-5 py-3.5">Lifetime Value</th>
              <th className="px-5 py-3.5">Active Jobs</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockCustomers.map((cust) => (
              <tr key={cust.id} className="hover:bg-slate-50/80 transition">
                <td className="px-5 py-3.5 font-semibold text-slate-900">{cust.name}</td>
                <td className="px-5 py-3.5">
                  <div className="text-slate-800 font-medium">{cust.contact}</div>
                  <div className="text-[11px] text-slate-500">{cust.email} &bull; {cust.phone}</div>
                </td>
                <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">{cust.type}</td>
                <td className="px-5 py-3.5 font-bold text-slate-900">{cust.totalSpent}</td>
                <td className="px-5 py-3.5 text-slate-700">{cust.activeJobs} Jobs</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {cust.status}
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
