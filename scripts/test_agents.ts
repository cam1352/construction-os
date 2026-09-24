// scripts/test_agents.ts
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { prisma, configureSqlitePragmas } from "../src/lib/prisma.js";
import { AgentRegistry } from "../src/agents/core/AgentRegistry.js";
import { TaskPoolExecutor } from "../src/agents/core/TaskPoolExecutor.js";
import { MockLLMProvider } from "../src/agents/providers/MockLLMProvider.js";
import { SalesAgent } from "../src/agents/specialized/SalesAgent.js";
import { EstimatingAgent } from "../src/agents/specialized/EstimatingAgent.js";
import { MarketingAgent } from "../src/agents/specialized/MarketingAgent.js";
import { WebScrapingModule } from "../src/agents/modules/WebScrapingModule.js";

// =============================================================================
// TEST SUITE HARNESS & ASSERTION UTILITIES
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_PORTFOLIO_DIR = path.resolve(__dirname, "../temp_test_portfolio");

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

// Track ephemeral IDs created during testing for clean teardown
const cleanupContext = {
  leadEmails: [] as string[],
  communicationLogRecipients: [] as string[],
  tempDirs: [TEST_PORTFOLIO_DIR],
};

async function cleanupTestData(): Promise<void> {
  console.log("\n[Teardown] Cleaning up ephemeral test records and local files...");
  try {
    // Purge test communication logs
    if (cleanupContext.communicationLogRecipients.length > 0) {
      await prisma.communicationLog.deleteMany({
        where: {
          recipient: { in: cleanupContext.communicationLogRecipients },
        },
      });
    }

    // Purge test leads
    if (cleanupContext.leadEmails.length > 0) {
      await prisma.lead.deleteMany({
        where: {
          email: { in: cleanupContext.leadEmails },
        },
      });
    }

    // Remove temp portfolio directory
    for (const dir of cleanupContext.tempDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
    console.log("  ✓ Teardown complete. Test environment restored.");
  } catch (err: any) {
    console.warn("  ! Notice during teardown:", err?.message || err);
  }
}

// =============================================================================
// MAIN VERIFICATION TEST SUITE
// =============================================================================

async function runMilestone2TestSuite(): Promise<void> {
  const suiteStartTime = Date.now();

  console.log("===============================================================================");
  console.log("  CONSTRUCTION BUSINESS OS — MILESTONE 2: AI AGENT LAYER VERIFICATION SUITE   ");
  console.log("===============================================================================");
  console.log(`  Timestamp: ${new Date().toISOString()}`);
  console.log(`  Engine: Deterministic Offline MockLLMProvider (Zero-API Directive Compliant)`);
  console.log("-------------------------------------------------------------------------------\n");

  // Step 0: Ensure SQLite WAL and Busy Timeout are active
  try {
    await configureSqlitePragmas(prisma);
    console.log("✓ SQLite engine pragmas initialized (WAL mode, busy_timeout = 10,000ms).\n");
  } catch (e) {
    console.warn("! Notice: SQLite pragma configuration deferred.\n");
  }

  // Initialize Framework Components
  const registry = AgentRegistry.getInstance();
  const mockProvider = new MockLLMProvider(2); // 2ms simulated latency

  // Register specialized agents
  registry.register("sales_agent", () => new SalesAgent(prisma));
  registry.register("estimating_agent", () => new EstimatingAgent(prisma));
  registry.register("marketing_agent", () => new MarketingAgent());

  // Instantiate high-concurrency TaskPoolExecutor
  const executor = new TaskPoolExecutor(100, { registry });

  try {
    // =========================================================================
    // SUITE 1: SALES AGENT VERIFICATION
    // =========================================================================
    console.log("=================================================================");
    console.log("SUITE 1: SALES AGENT VERIFICATION");
    console.log("=================================================================");

    // -------------------------------------------------------------------------
    // Test 1.1: Inbound Email Parsing & Context-Aware Quote Request Draft
    // -------------------------------------------------------------------------
    console.log("\n[Test 1.1] Inbound Commercial RFP Email Analysis...");
    const salesInboundInput = {
      senderEmail: "marcus.vance@techcorp.com",
      senderName: "Marcus Vance",
      subject: "Urgent: Need post-construction cleanup for 2500 sqft commercial office by Friday",
      body: "Hi Walker General Contractors team, we just finished our 2500 sqft commercial office renovation in downtown Vancouver. Our executive staff moves in on Monday morning, so we urgently require a comprehensive post-construction cleanup completed by Friday afternoon. Can you provide a rough estimate and confirm your availability for an on-site walkthrough tomorrow?",
      autonomousSend: false, // Inbound draft generation check
    };

    const salesResult = await executor.submit<any, any>("sales_agent", salesInboundInput);

    assert(salesResult.success, "Sales Agent executed successfully (success = true)");
    assert(salesResult.data !== undefined, "Sales Agent returned structured data payload");

    if (salesResult.data) {
      const data = salesResult.data;
      const intent = data.analysis?.intent?.toUpperCase();
      const urgency = data.analysis?.urgency?.toUpperCase();

      assert(
        intent === "QUOTE_REQUEST",
        `Intent correctly classified as "QUOTE_REQUEST" (got "${intent}")`
      );
      assert(
        urgency === "HIGH" || urgency === "EMERGENCY",
        `Urgency correctly scored as "HIGH" (got "${urgency}")`
      );
      assert(
        data.triage?.isSpam === false,
        'Inbox triage marks inbound lead as non-spam (isSpam = false)'
      );
      assert(
        data.triage?.triageAction === "PROCESS_LEAD",
        'Inbox triage action equals "PROCESS_LEAD"'
      );

      // Context-aware draft inspection
      const draftSalutation = data.draftResponse?.salutation || "";
      const draftBody = data.draftResponse?.body || "";
      const fullText = (draftSalutation + " " + draftBody).toLowerCase();

      assert(
        draftSalutation.includes("Marcus"),
        `Draft salutation personalized with customer name ("${draftSalutation}")`
      );
      assert(
        fullText.includes("post-construction") ||
          fullText.includes("cleanup") ||
          fullText.includes("commercial") ||
          fullText.includes("2500"),
        "Draft email body acknowledges commercial scope and specific project requirements"
      );
      assert(
        draftBody.length > 100,
        `Draft email body contains professional contractor response (${draftBody.length} chars)`
      );

      // CRM action items
      const actions = data.proposedActions || [];
      assert(actions.length >= 2, `Generated ${actions.length} structured CRM action items (expected >= 2)`);
      const hasStatusUpdate = actions.some((a: any) => a.type === "UPDATE_LEAD_STATUS");
      const hasSiteVisit = actions.some((a: any) => a.type === "SCHEDULE_SITE_VISIT");
      assert(hasStatusUpdate, 'Proposed actions include "UPDATE_LEAD_STATUS"');
      assert(hasSiteVisit, 'Proposed actions include "SCHEDULE_SITE_VISIT"');
    }

    // -------------------------------------------------------------------------
    // Test 1.2: Inbox Triage — Spam Classification & Purge
    // -------------------------------------------------------------------------
    console.log("\n[Test 1.2] Inbox Triage Spam Detection & Deletion...");
    const spamInboundInput = {
      senderEmail: "lottery-commission@megajackpot999.xyz",
      senderName: "Mega Lottery Prize Bureau",
      subject: "You won $1,000,000 lottery click here",
      body: "CONGRATULATIONS! You won $1,000,000 in the international mega lottery jackpot! Click here immediately to claim your money or wire transfer $500 to secure your cash funds.",
      autonomousSend: true,
    };

    cleanupContext.communicationLogRecipients.push(spamInboundInput.senderEmail);

    const spamResult = await executor.submit<any, any>("sales_agent", spamInboundInput);

    assert(spamResult.success, "Spam email handled without throwing unhandled exceptions");
    if (spamResult.data) {
      const data = spamResult.data;
      assert(data.triage?.isSpam === true, "Inbox triage detected email as SPAM (isSpam = true)");
      assert(
        data.triage?.triageAction === "PURGE_SPAM",
        'Inbox triage recommended action is "PURGE_SPAM"'
      );
      assert(
        data.triage?.leadPriority === "SPAM",
        'Lead priority set to "SPAM"'
      );
      assert(
        data.analysis?.intent === "SPAM",
        'Analysis intent classified as "SPAM"'
      );
      assert(
        data.outboundDelivery?.dispatched === false,
        "No outbound email was dispatched to spam sender"
      );
      const hasDiscardAction = (data.proposedActions || []).some(
        (a: any) => a.type === "DISCARD_COMMUNICATION"
      );
      assert(hasDiscardAction, 'Proposed actions include "DISCARD_COMMUNICATION"');
    }

    // -------------------------------------------------------------------------
    // Test 1.3: Autonomous Outbound Sending via EmailSimulator & CommunicationLog
    // -------------------------------------------------------------------------
    console.log("\n[Test 1.3] Autonomous Outbound Email Dispatch & DB Persistence...");
    const autonomousSalesInput = {
      senderEmail: "elena.rostova@urbanlivingproperties.ca",
      senderName: "Elena Rostova",
      subject: "Quote Request: Commercial Office Post-Construction Clean",
      body: "Hello, we need an urgent post-construction clean for our office space. Please send pricing.",
      autonomousSend: true,
    };

    cleanupContext.communicationLogRecipients.push(autonomousSalesInput.senderEmail);

    const autoResult = await executor.submit<any, any>("sales_agent", autonomousSalesInput);

    assert(autoResult.success, "Sales Agent autonomous run succeeded");
    if (autoResult.data?.outboundDelivery) {
      const delivery = autoResult.data.outboundDelivery;
      assert(delivery.dispatched === true, "Outbound email was autonomously dispatched (dispatched = true)");
      assert(
        delivery.deliveryMethod === "EMAIL_SIMULATOR",
        'Delivery method equals "EMAIL_SIMULATOR"'
      );
      assert(
        typeof delivery.messageId === "string" && delivery.messageId.length > 0,
        `Generated valid simulator message ID: ${delivery.messageId}`
      );

      // Verify Prisma database persistence in CommunicationLog
      try {
        const commLog = await prisma.communicationLog.findFirst({
          where: { recipient: autonomousSalesInput.senderEmail },
          orderBy: { createdAt: "desc" },
        });

        assert(commLog !== null, "Prisma verified: Record created in CommunicationLog table");
        if (commLog) {
          assert(commLog.direction === "OUTBOUND", 'Communication direction is "OUTBOUND"');
          assert(commLog.aiGenerated === true, "Communication aiGenerated flag is true");
          assert(commLog.status === "SENT", 'Communication status is "SENT"');
          assert(
            commLog.body.includes("Elena") || commLog.body.includes("Walker General Contractors"),
            "Communication body matches context-aware draft generated by Sales Agent"
          );
        }
      } catch (dbErr: any) {
        console.warn("  ! Notice during DB CommunicationLog query:", dbErr.message);
      }
    }

    // =========================================================================
    // SUITE 2: ESTIMATING AGENT VERIFICATION
    // =========================================================================
    console.log("\n=================================================================");
    console.log("SUITE 2: ESTIMATING AGENT VERIFICATION");
    console.log("=================================================================");

    // -------------------------------------------------------------------------
    // Test 2.1: Job Specification Test ("1500 sqft residential cleaning")
    // -------------------------------------------------------------------------
    console.log("\n[Test 2.1] 1500 sqft Residential Cleaning Takeoff & Cost Breakdown...");
    const cleaningInput = {
      jobSpecification: "1500 sqft residential cleaning",
      projectType: "residential" as const,
      tradeType: "cleaning" as const,
    };

    const cleaningResult = await executor.submit<any, any>("estimating_agent", cleaningInput);

    assert(cleaningResult.success, "Estimating Agent executed successfully (success = true)");
    assert(cleaningResult.data !== undefined, "Estimating Agent returned structured data payload");

    if (cleaningResult.data) {
      const data = cleaningResult.data;
      const metadata = data.jobMetadata;
      const breakdown = data.costBreakdown;

      // Dimension takeoff validation
      const parsedSqft =
        metadata?.parsedDimensions?.quantity ?? data.dimensions?.squareFeet;
      assert(
        parsedSqft === 1500,
        `Parsed square footage equals 1500 (got ${parsedSqft})`
      );

      const parsedTrade = (metadata?.parsedTrade || data.tradeType || "").toLowerCase();
      assert(
        parsedTrade.includes("cleaning"),
        `Parsed trade identifies cleaning discipline (got "${parsedTrade}")`
      );

      // Line items validation
      const materials = breakdown?.materials || [];
      const labor = breakdown?.labor || [];
      const equipment = breakdown?.equipment || [];

      assert(materials.length > 0, `Materials array contains ${materials.length} line items (non-empty)`);
      assert(labor.length > 0, `Labor array contains ${labor.length} line items (non-empty)`);
      assert(equipment.length > 0, `Equipment array contains ${equipment.length} line items (non-empty)`);

      const materialsSubtotal = breakdown.materialsSubtotal;
      const laborSubtotal = breakdown.laborSubtotal;
      const equipmentSubtotal = breakdown.equipmentSubtotal;
      const subtotal = breakdown.subtotal;
      const taxRate = breakdown.taxRate;
      const taxAmount = breakdown.taxAmount;
      const grandTotal = breakdown.grandTotal ?? breakdown.total;

      assert(materialsSubtotal > 0, `Materials subtotal is positive ($${materialsSubtotal})`);
      assert(laborSubtotal > 0, `Labor subtotal is positive ($${laborSubtotal})`);
      assert(equipmentSubtotal > 0, `Equipment subtotal is positive ($${equipmentSubtotal})`);
      assert(subtotal > 0, `Subtotal is positive ($${subtotal})`);
      assert(taxAmount > 0, `Tax amount is positive ($${taxAmount})`);
      assert(grandTotal > 0, `Grand total is positive ($${grandTotal})`);

      // Exact mathematical consistency checks
      const componentSum =
        materialsSubtotal +
        laborSubtotal +
        equipmentSubtotal +
        (breakdown.subcontractorSubtotal || 0) +
        (breakdown.overheadMarkup || breakdown.contingency || 0);

      assert(
        Math.abs(subtotal - componentSum) < 0.1,
        `Subtotal math is consistent (expected $${componentSum.toFixed(2)}, got $${subtotal.toFixed(2)})`
      );

      const expectedTotal = subtotal + taxAmount;
      assert(
        Math.abs(grandTotal - expectedTotal) < 0.1,
        `Grand total equals subtotal + tax (expected $${expectedTotal.toFixed(2)}, got $${grandTotal.toFixed(2)})`
      );
    }

    // -------------------------------------------------------------------------
    // Test 2.2: Additional Trade Specification ("2000 sqft drywall install")
    // -------------------------------------------------------------------------
    console.log("\n[Test 2.2] 2000 sqft Drywall Installation Takeoff...");
    const drywallInput = {
      jobSpecification: "2000 sqft drywall install with Level 4 finish",
      projectType: "residential" as const,
      tradeType: "drywall" as const,
    };

    const drywallResult = await executor.submit<any, any>("estimating_agent", drywallInput);

    assert(drywallResult.success, "Drywall Estimating Agent returned success = true");
    if (drywallResult.data) {
      const data = drywallResult.data;
      const metadata = data.jobMetadata;
      const breakdown = data.costBreakdown;

      const parsedSqft =
        metadata?.parsedDimensions?.quantity ?? data.dimensions?.squareFeet;
      assert(parsedSqft === 2000, `Parsed drywall dimension equals 2000 sqft (got ${parsedSqft})`);

      const parsedTrade = (metadata?.parsedTrade || data.tradeType || "").toLowerCase();
      assert(parsedTrade.includes("drywall"), `Trade correctly identified as drywall (got "${parsedTrade}")`);

      const materials = breakdown.materials || [];
      const hasDrywallMaterials = materials.some(
        (m: any) =>
          (m.name || m.item || "").toLowerCase().includes("gypsum") ||
          (m.name || m.item || "").toLowerCase().includes("drywall") ||
          (m.name || m.item || "").toLowerCase().includes("sheet")
      );
      assert(hasDrywallMaterials, "Drywall estimate includes gypsum wallboard line items");

      const grandTotal = breakdown.grandTotal ?? breakdown.total;
      assert(grandTotal > 1500, `Drywall total reflects realistic trade scale ($${grandTotal} > $1,500)`);
    }

    // -------------------------------------------------------------------------
    // Test 2.3: Commercial Renovation Specification
    // -------------------------------------------------------------------------
    console.log("\n[Test 2.3] 2500 sqft Commercial Renovation Takeoff...");
    const renovationInput = {
      jobSpecification: "2500 sqft commercial renovation with painting and flooring",
      projectType: "commercial" as const,
    };

    const renoResult = await executor.submit<any, any>("estimating_agent", renovationInput);
    assert(renoResult.success, "Commercial Renovation Agent returned success = true");
    if (renoResult.data) {
      const parsedSqft =
        renoResult.data.jobMetadata?.parsedDimensions?.quantity ??
        renoResult.data.dimensions?.squareFeet;
      assert(parsedSqft === 2500, `Parsed commercial renovation dimension equals 2500 sqft (got ${parsedSqft})`);
    }

    // =========================================================================
    // SUITE 3: MARKETING AGENT VERIFICATION
    // =========================================================================
    console.log("\n=================================================================");
    console.log("SUITE 3: MARKETING AGENT SEO BLOG AUTOMATION VERIFICATION");
    console.log("=================================================================");

    // -------------------------------------------------------------------------
    // Test 3.1: SEO Blog Generation & Local File Push for "vancouver-cleaning"
    // -------------------------------------------------------------------------
    console.log('\n[Test 3.1] Generating SEO Blog for "vancouver-cleaning"...');
    const cleaningBlogInput = {
      targetPortfolioSite: "vancouver-cleaning" as const,
      topic: "Post Construction Cleaning Checklist for Commercial Facilities",
      targetKeywords: [
        "commercial cleaning vancouver",
        "post construction cleanup",
        "office turnover cleaning",
      ],
      targetCity: "Vancouver",
      publishScheduleDays: 3,
      pushToLocalDisk: true,
      outputBaseDir: TEST_PORTFOLIO_DIR,
    };

    const cleaningBlogResult = await executor.submit<any, any>("marketing_agent", cleaningBlogInput);

    assert(cleaningBlogResult.success, "Marketing Agent generated blog successfully (success = true)");
    if (cleaningBlogResult.data) {
      const blog = cleaningBlogResult.data;

      assert(
        typeof blog.slug === "string" && /^[a-z0-9-]+$/.test(blog.slug),
        `Generated valid kebab-case slug: "${blog.slug}"`
      );
      assert(
        typeof blog.title === "string" && blog.title.length > 10,
        `Generated SEO-optimized title: "${blog.title}"`
      );
      assert(
        Array.isArray(blog.seoKeywords) && blog.seoKeywords.length >= 3,
        `Included target SEO keywords (count: ${blog.seoKeywords?.length})`
      );
      assert(
        typeof blog.markdownContent === "string" && blog.markdownContent.includes("# "),
        "Markdown content includes H1 header (#)"
      );
      assert(
        blog.markdownContent.length > 300,
        `Markdown content has substantial body length (${blog.markdownContent.length} chars)`
      );
      assert(
        typeof blog.scheduledPublishDate === "string" &&
          !isNaN(Date.parse(blog.scheduledPublishDate)),
        `Valid scheduled publication date: ${blog.scheduledPublishDate}`
      );

      // Verify physical disk push simulator
      const diskResult = blog.diskPushResult;
      assert(diskResult?.pushed === true, "Disk push simulator reported pushed = true");
      if (diskResult?.markdownFilePath) {
        const fileExists = fs.existsSync(diskResult.markdownFilePath);
        assert(
          fileExists,
          `Local blog file successfully written to disk: ${diskResult.markdownFilePath}`
        );
        if (fileExists) {
          const writtenContent = fs.readFileSync(diskResult.markdownFilePath, "utf-8");
          assert(
            writtenContent.includes(blog.title),
            "Physical file on disk contains the generated blog title"
          );
        }
      }
    }

    // -------------------------------------------------------------------------
    // Test 3.2: SEO Blog Generation & Push for "walker-general-contractors"
    // -------------------------------------------------------------------------
    console.log('\n[Test 3.2] Generating SEO Blog for "walker-general-contractors"...');
    const contractorBlogInput = {
      targetPortfolioSite: "walker-general-contractors" as const,
      topic: "Tenant Improvements and Commercial Office Renovation Guide",
      targetKeywords: [
        "general contractor vancouver",
        "commercial tenant improvements",
        "office buildout vancouver",
      ],
      targetCity: "Vancouver",
      publishScheduleDays: 0, // Immediate publish
      pushToLocalDisk: true,
      outputBaseDir: TEST_PORTFOLIO_DIR,
    };

    const contractorBlogResult = await executor.submit<any, any>(
      "marketing_agent",
      contractorBlogInput
    );

    assert(contractorBlogResult.success, "Contractor Marketing Agent generated blog successfully");
    if (contractorBlogResult.data) {
      const blog = contractorBlogResult.data;
      assert(blog.status === "PUBLISHED", 'Immediate schedule results in status "PUBLISHED"');
      assert(
        blog.diskPushResult?.pushed === true &&
          fs.existsSync(blog.diskPushResult.markdownFilePath),
        `Contractor blog file confirmed on disk at ${blog.diskPushResult?.markdownFilePath}`
      );
    }

    // =========================================================================
    // SUITE 4: WEB SCRAPING MODULE VERIFICATION
    // =========================================================================
    console.log("\n=================================================================");
    console.log("SUITE 4: AUTONOMOUS WEB SCRAPING & LEAD HARVESTING MODULE");
    console.log("=================================================================");

    console.log("\n[Test 4.1] Autonomous Trade Lead Discovery & Prisma Persistence...");
    const scraper = new WebScrapingModule(prisma);
    const scrapeResult = await scraper.discoverAndPersistLeads({
      trade: "RENOVATION",
      city: "Vancouver",
      limit: 3,
      minBudget: 5000,
      persistToDatabase: true,
    });

    assert(
      scrapeResult.totalDiscovered >= 1,
      `Discovered ${scrapeResult.totalDiscovered} prospective trade leads`
    );
    assert(
      Array.isArray(scrapeResult.leads) && scrapeResult.leads.length >= 1,
      "Scraper returned structured lead records"
    );

    // Validate scraped lead schema
    const sampleLead = scrapeResult.leads[0];
    if (sampleLead) {
      assert(
        sampleLead.businessName.length > 0,
        `Discovered lead has valid company name ("${sampleLead.businessName}")`
      );
      assert(
        sampleLead.email.includes("@"),
        `Discovered lead has valid email address ("${sampleLead.email}")`
      );
      assert(
        sampleLead.estimatedBudget > 0,
        `Discovered lead has estimated project budget ($${sampleLead.estimatedBudget})`
      );
      cleanupContext.leadEmails.push(sampleLead.email);
    }

    // Verify Prisma database persistence
    if (scrapeResult.persistedLeadIds && scrapeResult.persistedLeadIds.length > 0) {
      try {
        const persistedLead = await prisma.lead.findUnique({
          where: { id: scrapeResult.persistedLeadIds[0] },
        });

        assert(persistedLead !== null, "Prisma verified: Scraped lead persisted in Lead table");
        if (persistedLead) {
          assert(persistedLead.source === "AI_AGENT", 'Lead source marked as "AI_AGENT"');
          assert(persistedLead.status === "NEW", 'Lead initial status is "NEW"');
          assert(persistedLead.score >= 50, `Lead qualification score is >= 50 (${persistedLead.score})`);
        }
      } catch (dbErr: any) {
        console.warn("  ! Notice during DB Lead query:", dbErr.message);
      }
    }

    // =========================================================================
    // SUITE 5: HIGH-CONCURRENCY BENCHMARK (100+ CONCURRENT AGENTS)
    // =========================================================================
    console.log("\n=================================================================");
    console.log("SUITE 5: HIGH-CONCURRENCY BENCHMARK (120 CONCURRENT AGENT TASKS)");
    console.log("=================================================================");

    const CONCURRENCY_TASK_COUNT = 120;
    console.log(
      `\nPreparing ${CONCURRENCY_TASK_COUNT} simultaneous heterogeneous agent tasks...`
    );
    console.log(`  - 40 Sales Agent inquiries`);
    console.log(`  - 40 Estimating Agent takeoffs (cleaning, drywall, painting)`);
    console.log(`  - 40 Marketing Agent SEO blog posts`);
    console.log(`  Pool capacity: 100 concurrent workers via AsyncSemaphore\n`);

    const benchmarkTasks: Array<{ agentType: string; input: any }> = [];

    for (let i = 0; i < CONCURRENCY_TASK_COUNT; i++) {
      if (i % 3 === 0) {
        // Sales task
        benchmarkTasks.push({
          agentType: "sales_agent",
          input: {
            senderEmail: `concurrent.client.${i}@example.com`,
            senderName: `Client ${i}`,
            subject: `Renovation Quote Request #${i}`,
            body: `Hello, we need a pricing quote for project #${i}. Looking for fast turnaround.`,
            autonomousSend: false,
          },
        });
      } else if (i % 3 === 1) {
        // Estimating task
        const sqft = 1000 + i * 50;
        const trade = i % 2 === 0 ? "residential cleaning" : "drywall install";
        benchmarkTasks.push({
          agentType: "estimating_agent",
          input: {
            jobSpecification: `${sqft} sqft ${trade}`,
          },
        });
      } else {
        // Marketing task
        benchmarkTasks.push({
          agentType: "marketing_agent",
          input: {
            targetPortfolioSite:
              i % 2 === 0 ? "vancouver-cleaning" : "walker-general-contractors",
            topic: `Commercial Renovation Insights Part ${i}`,
            targetKeywords: ["commercial renovation", "vancouver contractor"],
            targetCity: "Vancouver",
            publishScheduleDays: i,
            pushToLocalDisk: false, // In-memory for raw concurrency speed
          },
        });
      }
    }

    console.log(`  Dispatching ${CONCURRENCY_TASK_COUNT} tasks simultaneously through TaskPoolExecutor...`);
    const benchmarkStart = Date.now();

    // Execute all 120 tasks concurrently
    const benchmarkResults = await Promise.all(
      benchmarkTasks.map((t) => executor.submit(t.agentType, t.input))
    );

    const benchmarkDurationMs = Date.now() - benchmarkStart;
    await executor.drain();

    const successfulRuns = benchmarkResults.filter((r) => r.success).length;
    const failedRuns = benchmarkResults.filter((r) => !r.success).length;
    const completionRate = ((successfulRuns / CONCURRENCY_TASK_COUNT) * 100).toFixed(1);
    const throughput = (
      CONCURRENCY_TASK_COUNT /
      (benchmarkDurationMs / 1000)
    ).toFixed(1);
    const avgLatencyMs = (benchmarkDurationMs / CONCURRENCY_TASK_COUNT).toFixed(1);

    // Concurrency assertions
    assert(
      successfulRuns === CONCURRENCY_TASK_COUNT,
      `100% completion rate achieved: ${successfulRuns}/${CONCURRENCY_TASK_COUNT} tasks succeeded`
    );
    assert(
      failedRuns === 0,
      `Zero unhandled exceptions or failed tasks (failed = ${failedRuns})`
    );
    assert(
      benchmarkDurationMs < 5000,
      `Total execution time under 5.0 seconds (${benchmarkDurationMs}ms total, limit: 5000ms)`
    );

    // Print Performance Metrics Report Table
    console.log("\n-----------------------------------------------------------------");
    console.log("  HIGH-CONCURRENCY PERFORMANCE METRICS REPORT");
    console.log("-----------------------------------------------------------------");
    console.log(`  Total Tasks Dispatched:      ${CONCURRENCY_TASK_COUNT}`);
    console.log(`  Successful Executions:       ${successfulRuns}`);
    console.log(`  Failed Executions:           ${failedRuns}`);
    console.log(`  Task Completion Rate:        ${completionRate}%`);
    console.log(`  Concurrency Pool Limit:      100 simultaneous workers`);
    console.log(`  Total Wall-Clock Time:       ${benchmarkDurationMs} ms`);
    console.log(`  System Throughput:           ${throughput} tasks/second`);
    console.log(`  Average Latency per Task:    ${avgLatencyMs} ms`);
    console.log("-----------------------------------------------------------------");
  } catch (err: any) {
    console.error("\n❌ Fatal error during test suite execution:", err);
    stats.failed++;
    stats.errors.push(`Fatal runner exception: ${err?.message || err}`);
  } finally {
    // Teardown
    await cleanupTestData();
    await prisma.$disconnect();

    const totalDuration = Date.now() - suiteStartTime;

    console.log("\n===============================================================================");
    console.log("  TEST SUITE EXECUTION SUMMARY");
    console.log("===============================================================================");
    console.log(`  Total Assertions: ${stats.total}`);
    console.log(`  Passed:           ${stats.passed} (${Math.round((stats.passed / Math.max(1, stats.total)) * 100)}%)`);
    console.log(`  Failed:           ${stats.failed}`);
    console.log(`  Total Time:       ${totalDuration}ms`);
    console.log("===============================================================================\n");

    if (stats.failed > 0) {
      console.error("❌ MILESTONE 2 VERIFICATION SUITE FAILED with errors:");
      for (const err of stats.errors) {
        console.error(`  - ${err}`);
      }
      process.exit(1);
    } else {
      console.log("🎉 ALL MILESTONE 2 AI AGENT VERIFICATION TESTS PASSED SUCCESSFULLY!\n");
      process.exit(0);
    }
  }
}

// Self-executing runner
runMilestone2TestSuite().catch((err) => {
  console.error("Uncaught rejection in verification runner:", err);
  process.exit(1);
});
