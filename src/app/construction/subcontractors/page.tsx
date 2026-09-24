import React from "react";

export default function SubcontractorsPage() {
  const mockSubs = [
    {
      company: "Apex Drywall Systems",
      trade: "Drywall & Steel Framing",
      contact: "Marco Rossi",
      phone: "(604) 555-0321",
      license: "BC-LIC-98442",
      hourlyRate: "$65.00/hr",
      rating: "4.9 / 5.0",
      status: "VERIFIED",
    },
    {
      company: "Pacific Coast Electrical Ltd.",
      trade: "Electrical & Data Cabling",
      contact: "David Chen",
      phone: "(604) 555-0819",
      license: "BC-LIC-44109",
      hourlyRate: "$85.00/hr",
      rating: "4.8 / 5.0",
      status: "VERIFIED",
    },
    {
      company: "Cascade Plumbing & Mechanical",
      trade: "Plumbing & Piping",
      contact: "Tyler Ross",
      phone: "(778) 555-0912",
      license: "BC-LIC-32901",
      hourlyRate: "$80.00/hr",
      rating: "4.7 / 5.0",
      status: "VERIFIED",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
          Construction Domain &bull; Trade Directory
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Subcontractor Partners</h1>
        <p className="text-sm text-slate-500">
          Vetted trade partners, active licenses, insurance status, and negotiated trade hourly rates.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3.5">Subcontractor / Company</th>
              <th className="px-5 py-3.5">Primary Trade</th>
              <th className="px-5 py-3.5">Contact Details</th>
              <th className="px-5 py-3.5">Trade License #</th>
              <th className="px-5 py-3.5">Negotiated Rate</th>
              <th className="px-5 py-3.5">Performance Rating</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockSubs.map((s, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition">
                <td className="px-5 py-3.5 font-bold text-slate-900">{s.company}</td>
                <td className="px-5 py-3.5 text-slate-700">{s.trade}</td>
                <td className="px-5 py-3.5">
                  <div className="text-slate-800 font-medium">{s.contact}</div>
                  <div className="text-[11px] text-slate-500">{s.phone}</div>
                </td>
                <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">{s.license}</td>
                <td className="px-5 py-3.5 font-semibold text-slate-900">{s.hourlyRate}</td>
                <td className="px-5 py-3.5 font-bold text-amber-600">⭐ {s.rating}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {s.status}
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
