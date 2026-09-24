import React from "react";

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shadow">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Construction Business OS</h1>
            <p className="text-xs text-slate-500">Autonomous ERP & Multi-Agent Operations</p>
          </div>
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="flex items-center space-x-3">
        <div className="hidden md:flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Zero-API Active
          </span>

          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-2 h-2 mr-1.5 bg-sky-500 rounded-full"></span>
            Prisma Connected
          </span>

          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-2 h-2 mr-1.5 bg-purple-500 rounded-full"></span>
            100 Worker Pool
          </span>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

        {/* User Pill */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            AD
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">Admin Dispatcher</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Enterprise Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
