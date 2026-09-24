import React from "react";

export default function WorkOrdersPage() {
  const mockWorkOrders = [
    {
      woNumber: "WO-2026-041",
      title: "HVAC Duct Seal & Drywall Patch",
      project: "PRJ-2026-001",
      priority: "HIGH",
      status: "IN_PROGRESS",
      assignedTo: "Dave Miller (Field Tech)",
      checklist: "4 / 5 items done",
    },
    {
      woNumber: "WO-2026-042",
      title: "Window Caulking & Framing Inspection",
      project: "PRJ-2026-003",
      priority: "MEDIUM",
      status: "ASSIGNED",
      assignedTo: "Samir Patel",
      checklist: "0 / 3 items done",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
          Construction Domain &bull; Field Execution
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Work Orders & Punch Lists</h1>
        <p className="text-sm text-slate-500">
          Field technician dispatch, priority punch lists, and task checklist verification.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3.5">WO Number</th>
              <th className="px-5 py-3.5">Title & Project</th>
              <th className="px-5 py-3.5">Assigned Tech</th>
              <th className="px-5 py-3.5">Checklist Progress</th>
              <th className="px-5 py-3.5">Priority</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockWorkOrders.map((wo) => (
              <tr key={wo.woNumber} className="hover:bg-slate-50/80 transition">
                <td className="px-5 py-3.5 font-mono font-bold text-sky-600">{wo.woNumber}</td>
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-900">{wo.title}</div>
                  <div className="text-[11px] text-slate-500">{wo.project}</div>
                </td>
                <td className="px-5 py-3.5 font-medium text-slate-800">{wo.assignedTo}</td>
                <td className="px-5 py-3.5 text-slate-700 font-mono text-[11px]">{wo.checklist}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    wo.priority === "HIGH" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-slate-50 text-slate-700 border border-slate-200"
                  }`}>
                    {wo.priority}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    {wo.status}
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
