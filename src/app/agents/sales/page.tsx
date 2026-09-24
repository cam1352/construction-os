import React from "react";

export default function SalesAgentPage() {
  const triageStats = {
    totalProcessed: 148,
    spamPurged: 62,
    quotesDrafted: 86,
    autonomousSent: 86,
    avgResponseTime: "1.2s",
  };

  const recentTriage = [
    {
      id: "trg-01",
      sender: "spammer99@crypto-moon.example",
      subject: "Get 500% ROI on crypto trading platform",
      classification: "SPAM",
      action: "PURGE_SPAM",
      autoSent: false,
      timestamp: "10 mins ago",
    },
    {
      id: "trg-02",
      sender: "arthur@westsidedev.example",
      subject: "Requesting bid for commercial tenant improvement",
      classification: "QUOTE_REQUEST",
      action: "DRAFT_AND_AUTONOMOUS_SEND",
      autoSent: true,
      timestamp: "18 mins ago",
    },
    {
      id: "trg-03",
      sender: "brenda@vancearch.example",
      subject: "1500 sqft residential cleaning quote",
      classification: "QUOTE_REQUEST",
      action: "DRAFT_AND_AUTONOMOUS_SEND",
      autoSent: true,
      timestamp: "45 mins ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
            AI Agent Control Center &bull; Sales Triage & Autonomous Dispatch
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Agent Control Center</h1>
          <p className="text-sm text-slate-500">
            Autonomous inbound inbox triage, spam purge, intent classification, and zero-API email dispatch.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Auto-Send Enabled
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Emails Processed</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{triageStats.totalProcessed}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-rose-600 uppercase">Spam Purged</div>
          <div className="text-xl font-bold text-rose-600 mt-1">{triageStats.spamPurged}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-sky-600 uppercase">Quotes Drafted</div>
          <div className="text-xl font-bold text-sky-600 mt-1">{triageStats.quotesDrafted}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase">Auto Dispatched</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{triageStats.autonomousSent}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Latency</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{triageStats.avgResponseTime}</div>
        </div>
      </div>

      {/* Triage Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
          Recent Autonomous Triage Pipeline Runs
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3">Inbound Sender & Subject</th>
              <th className="px-5 py-3">Classification</th>
              <th className="px-5 py-3">Triage Action</th>
              <th className="px-5 py-3">Outbound Auto-Send</th>
              <th className="px-5 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentTriage.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/80 transition">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-900">{r.subject}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{r.sender}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    r.classification === "SPAM" ? "bg-rose-100 text-rose-800" : "bg-sky-100 text-sky-800"
                  }`}>
                    {r.classification}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-[11px] text-slate-700">{r.action}</td>
                <td className="px-5 py-3.5">
                  {r.autoSent ? (
                    <span className="inline-flex items-center text-emerald-600 font-bold text-[11px]">
                      ✓ Sent via Simulator
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px]">— Discarded</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-500 text-[11px]">{r.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
