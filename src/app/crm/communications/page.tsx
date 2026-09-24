import React from "react";

export default function CommunicationsPage() {
  const mockCommunications = [
    {
      id: "comm-01",
      channel: "EMAIL",
      direction: "OUTBOUND",
      sender: "sales@construction-os.example",
      recipient: "arthur@westsidedev.example",
      subject: "Formal Quotation & Site Scope for Westside TI",
      sentiment: "POSITIVE",
      aiGenerated: true,
      agentId: "sales-agent-01",
      date: "2026-09-24 10:15",
    },
    {
      id: "comm-02",
      channel: "SMS",
      direction: "OUTBOUND",
      sender: "+1-604-555-0100",
      recipient: "+1-604-555-0188 (Subcontractor)",
      subject: "Drywall punch list assigned for PRJ-2026-002",
      sentiment: "NEUTRAL",
      aiGenerated: true,
      agentId: "estimating-agent-01",
      date: "2026-09-24 09:30",
    },
    {
      id: "comm-03",
      channel: "EMAIL",
      direction: "INBOUND",
      sender: "brenda@vancearch.example",
      recipient: "inbox@construction-os.example",
      subject: "Requesting cost breakdown for 1500 sqft residential cleaning",
      sentiment: "POSITIVE",
      aiGenerated: false,
      agentId: null,
      date: "2026-09-23 16:45",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
            CRM Domain &bull; Unified Inbox
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Communications & Dispatch</h1>
          <p className="text-sm text-slate-500">
            Multi-channel interaction logs, AI sentiment tags, and zero-API simulated transmissions.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3.5">Channel / Direction</th>
              <th className="px-5 py-3.5">Subject & Preview</th>
              <th className="px-5 py-3.5">Participants</th>
              <th className="px-5 py-3.5">Sentiment</th>
              <th className="px-5 py-3.5">AI Engine</th>
              <th className="px-5 py-3.5">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockCommunications.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-900">{c.channel}</div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${c.direction === "INBOUND" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"}`}>
                    {c.direction}
                  </span>
                </td>
                <td className="px-5 py-3.5 max-w-xs truncate">
                  <div className="font-semibold text-slate-900 truncate">{c.subject}</div>
                </td>
                <td className="px-5 py-3.5 text-slate-600 text-[11px]">
                  <div>To: {c.recipient}</div>
                  <div className="text-slate-400">From: {c.sender}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {c.sentiment}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {c.aiGenerated ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      {c.agentId ?? "AI Agent"}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono text-[10px]">Human</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">{c.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
