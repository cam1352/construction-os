import { NAVIGATION_CONFIG, getAllNavItems, findNavItemByHref } from "../lib/navigation";

export interface DashboardStats {
  customerCount: number;
  leadCount: number;
  projectCount: number;
  agentCount: number;
  monthlyRevenue?: string;
  workerPoolSlots?: number;
}

/**
 * Renders the complete HTML shell with sidebar, header, and route content
 */
export function renderDashboardHtml(
  currentPath: string = "/",
  stats: DashboardStats = {
    customerCount: 3,
    leadCount: 34,
    projectCount: 12,
    agentCount: 4,
    monthlyRevenue: "$48,250",
    workerPoolSlots: 100,
  }
): string {
  const currentNavItem = findNavItemByHref(currentPath);

  // Render Sidebar navigation HTML
  const sidebarNavHtml = NAVIGATION_CONFIG.map((group) => {
    const itemsHtml = group.items
      .map((item) => {
        const isActive = currentPath === item.href;
        const activeClass = isActive
          ? "bg-sky-600 text-white shadow-sm"
          : "text-slate-300 hover:text-white hover:bg-slate-800/60";
        const badgeHtml = item.badge
          ? `<span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
              isActive ? "bg-sky-700 text-white" : "bg-slate-800 text-slate-400"
            }">${item.badge}</span>`
          : "";

        return `
          <a href="${item.href}" title="${item.description}" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${activeClass}">
            <div class="flex items-center space-x-2.5 truncate">
              <span class="w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : "bg-slate-500"}"></span>
              <span class="truncate">${item.name}</span>
            </div>
            ${badgeHtml}
          </a>
        `;
      })
      .join("\n");

    return `
      <div class="space-y-1">
        <div class="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          ${group.title}
        </div>
        <div class="space-y-0.5">
          ${itemsHtml}
        </div>
      </div>
    `;
  }).join("\n");

  // Render Page Content Body
  let contentHtml = "";

  if (currentPath === "/" || currentPath === "") {
    // Root Overview Dashboard
    contentHtml = `
      <div class="space-y-6">
        <!-- Top Status Banner -->
        <div class="bg-gradient-to-r from-slate-900 via-sky-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center space-x-2 text-sky-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Zero-API Mode • Self-Contained PoC</span>
            </div>
            <h2 class="text-2xl font-bold tracking-tight">Construction Business OS Dashboard</h2>
            <p class="text-slate-300 text-sm mt-1 max-w-2xl">
              Centralized ERP control center orchestrating CRM pipelines, construction field operations, and autonomous AI agents.
            </p>
          </div>

          <div class="flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10 self-start md:self-auto">
            <div class="text-right">
              <div class="text-xs font-semibold text-white">Task Worker Pool</div>
              <div class="text-[11px] text-sky-300 font-mono">${stats.workerPoolSlots || 100} Concurrency Slots</div>
            </div>
            <div class="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold">
              ${stats.workerPoolSlots || 100}
            </div>
          </div>
        </div>

        <!-- KPI Metrics Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Projects</span>
              <span class="text-sky-600 font-bold">🏗️</span>
            </div>
            <div class="flex items-baseline space-x-2">
              <span class="text-2xl font-bold text-slate-900 tracking-tight">${stats.projectCount}</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium border text-emerald-600 bg-emerald-50 border-emerald-200">+2 this mo</span>
            </div>
            <p class="mt-2 text-xs text-slate-500">6 in progress, 4 planning, 2 bid phase</p>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoiced Revenue</span>
              <span class="text-emerald-600 font-bold">💵</span>
            </div>
            <div class="flex items-baseline space-x-2">
              <span class="text-2xl font-bold text-slate-900 tracking-tight">${stats.monthlyRevenue || "$48,250"}</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium border text-emerald-600 bg-emerald-50 border-emerald-200">+18.4%</span>
            </div>
            <p class="mt-2 text-xs text-slate-500">Total accounts receivable for current period</p>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">CRM Leads Qualified</span>
              <span class="text-purple-600 font-bold">👥</span>
            </div>
            <div class="flex items-baseline space-x-2">
              <span class="text-2xl font-bold text-slate-900 tracking-tight">${stats.leadCount}</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium border text-emerald-600 bg-emerald-50 border-emerald-200">84% score</span>
            </div>
            <p class="mt-2 text-xs text-slate-500">AI auto-triaged & scored inquiries</p>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Autonomous AI Agents</span>
              <span class="text-amber-600 font-bold">🤖</span>
            </div>
            <div class="flex items-baseline space-x-2">
              <span class="text-2xl font-bold text-slate-900 tracking-tight">${stats.agentCount}</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium border text-slate-600 bg-slate-50 border-slate-200">Healthy</span>
            </div>
            <p class="mt-2 text-xs text-slate-500">Sales, Estimating, Marketing, Scraper</p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 class="text-sm font-bold text-slate-900 mb-3">⚡ Quick Actions & AI Automation</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <a href="/agents/estimating" class="block p-3.5 rounded-lg border transition-all text-left border-sky-200 hover:border-sky-400 bg-sky-50/50 text-sky-800">
              <div class="font-semibold text-xs text-slate-900">New Estimate Takeoff &rarr;</div>
              <div class="text-[11px] text-slate-500 mt-1">Auto-parse specs and calculate job costs</div>
            </a>
            <a href="/agents/sales" class="block p-3.5 rounded-lg border transition-all text-left border-purple-200 hover:border-purple-400 bg-purple-50/50 text-purple-800">
              <div class="font-semibold text-xs text-slate-900">Triage Inbound Leads &rarr;</div>
              <div class="text-[11px] text-slate-500 mt-1">Purge spam and dispatch autonomous replies</div>
            </a>
            <a href="/agents/marketing" class="block p-3.5 rounded-lg border transition-all text-left border-emerald-200 hover:border-emerald-400 bg-emerald-50/50 text-emerald-800">
              <div class="font-semibold text-xs text-slate-900">Publish SEO Blog &rarr;</div>
              <div class="text-[11px] text-slate-500 mt-1">Generate and push articles to portfolio sites</div>
            </a>
            <a href="/agents/scraper" class="block p-3.5 rounded-lg border transition-all text-left border-amber-200 hover:border-amber-400 bg-amber-50/50 text-amber-800">
              <div class="font-semibold text-xs text-slate-900">Crawl Trade Leads &rarr;</div>
              <div class="text-[11px] text-slate-500 mt-1">Harvest construction contacts into CRM</div>
            </a>
          </div>
        </div>

        <!-- Domain Directory Navigation Grid (Showing all 15 routes) -->
        <div class="space-y-4">
          <h3 class="text-base font-bold text-slate-900">Enterprise Module Directory</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${NAVIGATION_CONFIG.map((group) => `
              <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                <div class="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span class="font-bold text-sm text-slate-800">${group.title}</span>
                  <span class="text-[11px] font-mono font-medium text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                    ${group.items.length} Modules
                  </span>
                </div>
                <div class="p-4 flex-1 space-y-2">
                  ${group.items.map((item) => `
                    <a href="${item.href}" class="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                      <div>
                        <div class="font-semibold text-xs text-slate-800 hover:text-sky-600 transition-colors">${item.name}</div>
                        <div class="text-[11px] text-slate-500">${item.description}</div>
                      </div>
                      ${item.badge ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium">${item.badge}</span>` : ""}
                    </a>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  } else if (currentNavItem) {
    // Specific Sub-Route View
    contentHtml = `
      <div class="space-y-6">
        <!-- Sub-route Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
              Construction OS &bull; Module
            </div>
            <h1 class="text-2xl font-bold text-slate-900">${currentNavItem.name}</h1>
            <p class="text-sm text-slate-500">${currentNavItem.description}</p>
          </div>
          <div class="flex items-center space-x-2">
            <a href="/" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition">
              &larr; Back to Dashboard
            </a>
          </div>
        </div>

        <!-- Content Card for this Route -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                ${currentNavItem.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 class="font-bold text-base text-slate-900">${currentNavItem.name} Workspace</h3>
                <p class="text-xs text-slate-500 font-mono">Route: ${currentNavItem.href}</p>
              </div>
            </div>
            ${currentNavItem.badge ? `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">${currentNavItem.badge}</span>` : ""}
          </div>

          <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-2">
            <div class="font-semibold text-slate-900">Module Capabilities:</div>
            <ul class="list-disc list-inside space-y-1 text-slate-600">
              <li>Direct integration with Prisma ORM data layer</li>
              <li>Autonomous background agent synchronization</li>
              <li>Zero-API offline operation mode active</li>
            </ul>
          </div>

          <div class="pt-2 text-right">
            <span class="inline-flex items-center text-xs text-emerald-600 font-medium">
              <span class="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Live Sync Active
            </span>
          </div>
        </div>
      </div>
    `;
  } else {
    // 404 Not Found Page
    contentHtml = `
      <div class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
        <h2 class="text-3xl font-bold text-slate-900">404 - Route Not Found</h2>
        <p class="text-sm text-slate-500 max-w-md mx-auto">
          The requested route <code class="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">${currentPath}</code> does not exist in the Construction OS registry.
        </p>
        <div class="pt-4">
          <a href="/" class="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium transition shadow-sm">
            Return to Dashboard Overview
          </a>
        </div>
      </div>
    `;
  }

  // Full semantic HTML output with responsive styles
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Construction Business OS & ERP Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    /* Fallback styles in case CDN is unreachable in offline air-gapped environments */
    .bg-slate-50 { background-color: #f8fafc; }
    .bg-slate-900 { background-color: #0f172a; }
    .text-slate-900 { color: #0f172a; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 antialiased min-h-screen">
  <div class="flex h-screen overflow-hidden">
    <!-- Main Navigation Sidebar -->
    <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800 select-none">
      <!-- Brand Header -->
      <div class="h-16 flex items-center px-5 border-b border-slate-800 bg-slate-950/40">
        <a href="/" class="flex items-center space-x-3 group">
          <div class="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/20">
            ⚡
          </div>
          <div class="flex flex-col">
            <span class="font-bold text-white text-sm tracking-wide">CONSTRUCTION OS</span>
            <span class="text-[10px] text-sky-400 font-mono">ERP & AGENT MGR</span>
          </div>
        </a>
      </div>

      <!-- Overview Home Link -->
      <div class="px-3 pt-4 pb-2">
        <a href="/" class="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          currentPath === "/" || currentPath === ""
            ? "bg-sky-600 text-white shadow-sm"
            : "text-slate-400 hover:text-white hover:bg-slate-800/60"
        }">
          <span>🏠</span>
          <span>Dashboard Overview</span>
        </a>
      </div>

      <!-- Navigation Domains & Links -->
      <nav class="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
        ${sidebarNavHtml}
      </nav>

      <!-- Footer System Status -->
      <div class="p-3 border-t border-slate-800 bg-slate-950/30 text-[11px] text-slate-500">
        <div class="flex items-center justify-between">
          <span>Engine Status</span>
          <span class="text-emerald-400 font-mono flex items-center">
            <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1"></span>
            Operational
          </span>
        </div>
        <div class="mt-1 text-[10px] text-slate-600">
          Construction OS v1.0.0 (Zero-API)
        </div>
      </div>
    </aside>

    <!-- Application Content Shell -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shadow">
            🏗️
          </div>
          <div>
            <h1 class="text-base font-bold text-slate-900 leading-tight">Construction Business OS</h1>
            <p class="text-xs text-slate-500">Autonomous ERP & Multi-Agent Operations</p>
          </div>
        </div>

        <!-- System Badges -->
        <div class="flex items-center space-x-3">
          <div class="hidden md:flex items-center space-x-2">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span class="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full"></span>
              Zero-API Active
            </span>
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
              <span class="w-2 h-2 mr-1.5 bg-sky-500 rounded-full"></span>
              Prisma Connected
            </span>
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
              <span class="w-2 h-2 mr-1.5 bg-purple-500 rounded-full"></span>
              100 Worker Pool
            </span>
          </div>
          <div class="h-6 w-px bg-slate-200 hidden md:block"></div>
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              AD
            </div>
            <div class="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-none">Admin Dispatcher</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Enterprise Admin</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div class="max-w-7xl mx-auto space-y-6">
          ${contentHtml}
        </div>
      </main>
    </div>
  </div>
</body>
</html>`;
}
