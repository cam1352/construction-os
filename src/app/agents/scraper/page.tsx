"use client";
import React, { useState } from "react";
import { Search, Copy, CheckCircle2, Globe, AlertCircle, RefreshCw } from "lucide-react";

export default function ScraperAgentPage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle, scraping, success, error
  const [results, setResults] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const handleScrape = async () => {
    if (!url.startsWith("http")) {
      setErrorMsg("Please enter a valid URL starting with http:// or https://");
      return;
    }
    
    setStatus("scraping");
    setErrorMsg("");
    setResults([]);

    try {
      const res = await fetch("/api/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to scrape URL");
      }

      setResults(data.emails || []);
      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(results.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
          AI Agent Control Center &bull; Live Scraper Engine
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Web Scraper Control Center</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enter a target directory or website URL. The engine will extract all valid email addresses for your campaigns.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Globe className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="https://example-directory.com/plumbers" 
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
            />
          </div>
          <button 
            onClick={handleScrape}
            disabled={status === 'scraping' || !url}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-2"
          >
            {status === 'scraping' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            {status === 'scraping' ? 'Scraping...' : 'Harvest Emails'}
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errorMsg}
          </div>
        )}
      </div>

      {status === 'success' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Found {results.length} Emails
            </div>
            <button 
              onClick={copyToClipboard}
              disabled={results.length === 0}
              className="text-xs font-bold px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors flex items-center gap-2 text-slate-700 disabled:opacity-50"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied to Clipboard!' : 'Copy All'}
            </button>
          </div>
          
          <div className="p-0">
            {results.length > 0 ? (
              <ul className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {results.map((email, idx) => (
                  <li key={idx} className="px-6 py-3 text-sm font-mono text-slate-600 hover:bg-slate-50">
                    {email}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-slate-500">
                No valid email addresses were found on this page.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
