// scripts/test_ui.ts
import "dotenv/config";
import net from "node:net";
import { startServer, ServerInstance } from "../src/server/server";
import { NAVIGATION_CONFIG, getAllNavItems } from "../src/lib/navigation";

// =============================================================================
// TEST SUITE HARNESS & ASSERTION UTILITIES
// =============================================================================

interface TestStats {
  total: number;
  passed: number;
  failed: number;
  errors: string[];
}

const stats: TestStats = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

function assert(condition: boolean, testName: string, details?: string): void {
  stats.total++;
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    stats.passed++;
  } else {
    const errorMsg = `  ✗ [FAIL] ${testName}${details ? " — " + details : ""}`;
    console.error(errorMsg);
    stats.failed++;
    stats.errors.push(errorMsg);
  }
}

/**
 * Finds an available open port on localhost
 */
async function findAvailablePort(startPort: number = 3000): Promise<number> {
  return new Promise((resolve) => {
    const checkPort = (port: number) => {
      const tester = net.createServer();
      tester.once("error", () => {
        checkPort(port + 1);
      });
      tester.once("listening", () => {
        tester.close(() => resolve(port));
      });
      tester.listen(port, "127.0.0.1");
    };

    checkPort(startPort);
  });
}

/**
 * Polls the target URL until reachable or timeout
 */
async function waitForServer(url: string, timeoutMs: number = 10000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) {
        return true;
      }
    } catch {
      // Server not ready yet, wait 100ms
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

async function runTestSuite() {
  console.log("===============================================================================");
  console.log("  MILESTONE 3: BUSINESS OS DASHBOARD UI VERIFICATION SUITE");
  console.log("===============================================================================\n");

  let serverInstance: ServerInstance | null = null;
  const targetPort = await findAvailablePort(3000);
  const baseUrl = `http://127.0.0.1:${targetPort}`;

  try {
    // -------------------------------------------------------------------------
    // SUITE 1: SERVER BOOT & HEALTH CHECK
    // -------------------------------------------------------------------------
    console.log(`[Suite 1] Booting Standalone UI Server on port ${targetPort}...`);
    serverInstance = await startServer(targetPort);

    const isReady = await waitForServer(`${baseUrl}/api/health`, 8000);
    assert(isReady, `Server boots and responds on ${baseUrl}`, `Server timed out waiting on port ${targetPort}`);

    // Test /api/health
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert(healthRes.status === 200, "GET /api/health returns HTTP 200 OK");
    const healthJson = await healthRes.json() as { status: string; zeroApiMode: boolean; workerPoolSlots: number };
    assert(healthJson.status === "ok", "GET /api/health reports status === 'ok'");
    assert(healthJson.zeroApiMode === true, "GET /api/health confirms Zero-API mode is active");
    assert(healthJson.workerPoolSlots === 100, "GET /api/health confirms 100 worker pool slots");

    // Test /api/stats
    const statsRes = await fetch(`${baseUrl}/api/stats`);
    assert(statsRes.status === 200, "GET /api/stats returns HTTP 200 OK");
    const statsJson = await statsRes.json() as Record<string, unknown>;
    assert(typeof statsJson.projectCount === "number", "GET /api/stats returns projectCount");
    assert(typeof statsJson.customerCount === "number", "GET /api/stats returns customerCount");
    assert(typeof statsJson.leadCount === "number", "GET /api/stats returns leadCount");

    // -------------------------------------------------------------------------
    // SUITE 2: ROOT DASHBOARD & DOMAIN HEADERS
    // -------------------------------------------------------------------------
    console.log("\n[Suite 2] Verifying Root Dashboard Route (/) & Domain Groups...");
    const rootRes = await fetch(`${baseUrl}/`);
    assert(rootRes.status === 200, "GET / returns HTTP 200 OK");
    
    const contentType = rootRes.headers.get("content-type") || "";
    assert(contentType.includes("text/html"), "GET / returns Content-Type text/html");

    const rootHtml = await rootRes.text();

    // Verify all 3 required domain headers are present in the HTML skeleton
    for (const group of NAVIGATION_CONFIG) {
      const hasDomainHeader = rootHtml.includes(group.title);
      assert(
        hasDomainHeader,
        `Dashboard HTML contains Domain Header: "${group.title}"`,
        `Expected "${group.title}" in rendered HTML`
      );
    }

    // -------------------------------------------------------------------------
    // SUITE 3: ALL 15 CENTRALIZED NAVIGATION ROUTE LINKS
    // -------------------------------------------------------------------------
    console.log("\n[Suite 3] Verifying All 15 Navigation Route Links...");
    const allNavItems = getAllNavItems();
    assert(allNavItems.length === 15, `Navigation registry contains exactly 15 routes (Found: ${allNavItems.length})`);

    for (const item of allNavItems) {
      const expectedHref = `href="${item.href}"`;
      const hasLink = rootHtml.includes(expectedHref);
      assert(
        hasLink,
        `Navigation link present for ${item.name} (${item.href})`,
        `Expected ${expectedHref} in rendered dashboard HTML`
      );
    }

    // -------------------------------------------------------------------------
    // SUITE 4: SUB-ROUTE RENDERING
    // -------------------------------------------------------------------------
    console.log("\n[Suite 4] Verifying Sub-Route Navigation Endpoints...");
    
    // Probe a representative route from each of the 3 domains
    const routesToTest = [
      { path: "/crm/leads", name: "CRM Leads", expectedKeyword: "Leads" },
      { path: "/construction/projects", name: "Construction Projects", expectedKeyword: "Projects" },
      { path: "/agents/estimating", name: "Estimating Calculator", expectedKeyword: "Estimating" },
      { path: "/agents/sales", name: "Sales Triage", expectedKeyword: "Sales" },
    ];

    for (const route of routesToTest) {
      const subRes = await fetch(`${baseUrl}${route.path}`);
      assert(subRes.status === 200, `GET ${route.path} returns HTTP 200 OK`);
      const subHtml = await subRes.text();
      assert(
        subHtml.includes(route.expectedKeyword),
        `GET ${route.path} rendered HTML contains "${route.expectedKeyword}"`,
        `Expected keyword "${route.expectedKeyword}" in sub-route output`
      );
    }

    // -------------------------------------------------------------------------
    // SUITE 5: 404 NOT FOUND HANDLING
    // -------------------------------------------------------------------------
    console.log("\n[Suite 5] Verifying 404 Error Boundary Handling...");
    const notFoundRes = await fetch(`${baseUrl}/unregistered-demo-route-xyz`);
    assert(notFoundRes.status === 404, "GET /unregistered-demo-route-xyz returns HTTP 404");
    const notFoundHtml = await notFoundRes.text();
    assert(notFoundHtml.includes("404"), "404 page body clearly communicates route not found");

  } catch (error) {
    console.error("\n[CRITICAL FAILURE] Test suite encountered an unhandled exception:", error);
    stats.failed++;
    stats.errors.push(String(error));
  } finally {
    // -------------------------------------------------------------------------
    // TEARDOWN: CLEAN SERVER SHUTDOWN
    // -------------------------------------------------------------------------
    if (serverInstance) {
      console.log("\n[Teardown] Gracefully terminating UI server instance...");
      try {
        await serverInstance.close();
        console.log("  ✓ [PASS] Server terminated cleanly without dangling sockets");
        stats.total++;
        stats.passed++;
      } catch (closeErr) {
        console.error("  ✗ [FAIL] Error terminating server instance:", closeErr);
        stats.total++;
        stats.failed++;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // FINAL TEST REPORT SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`  VERIFICATION SUMMARY: ${stats.passed} / ${stats.total} PASSED (${stats.failed} FAILED)`);
  console.log("===============================================================================");

  if (stats.failed > 0) {
    console.error("\nFailed Tests:");
    for (const err of stats.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  } else {
    console.log("\n🎉 ALL MILESTONE 3 DASHBOARD UI VERIFICATION TESTS PASSED SUCCESSFULLY!\n");
    process.exit(0);
  }
}

runTestSuite();
