import React from "react";

export default function SchedulingPage() {
  const mockSchedule = [
    {
      task: "Site Preparation & Containment",
      project: "PRJ-2026-001 (Commercial TI)",
      lead: "Carlos Mendez",
      startDate: "2026-09-22",
      endDate: "2026-09-25",
      status: "COMPLETED",
      progress: 100,
    },
    {
      task: "Drywall Framing & Board Hanging",
      project: "PRJ-2026-001 (Commercial TI)",
      lead: "Apex Drywall Systems (Sub)",
      startDate: "2026-09-26",
      endDate: "2026-10-02",
      status: "IN_PROGRESS",
      progress: 40,
    },
    {
      task: "Post-Construction Deep Clean",
      project: "PRJ-2026-002 (Harborview Tower)",
      lead: "CleanPro Elite Crew",
      startDate: "2026-10-05",
      endDate: "2026-10-06",
      status: "SCHEDULED",
      progress: 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
          Construction Domain &bull; Master Schedule
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Project Scheduling & Milestones</h1>
        <p className="text-sm text-slate-500">
          Gantt timelines, crew allocations, and critical milestone tracking.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3.5">Phase / Milestone</th>
              <th className="px-5 py-3.5">Assigned Lead / Sub</th>
              <th className="px-5 py-3.5">Timeline</th>
              <th className="px-5 py-3.5">Progress</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockSchedule.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-900">{item.task}</div>
                  <div className="text-[11px] text-slate-500">{item.project}</div>
                </td>
                <td className="px-5 py-3.5 font-medium text-slate-800">{item.lead}</td>
                <td className="px-5 py-3.5 font-mono text-slate-500 text-[11px]">
                  {item.startDate} &rarr; {item.endDate}
                </td>
                <td className="px-5 py-3.5">
                  <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden inline-block mr-2 align-middle">
                    <div
                      className="bg-sky-600 h-2 rounded-full"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-600">{item.progress}%</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    {item.status}
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
