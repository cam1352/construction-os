import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { configureSqlitePragmas } from "../src/lib/prisma";

const prisma = new PrismaClient();

async function runVerification() {
  console.log("=================================================");
  console.log("RUNNING DATABASE ARCHITECTURE & RELATIONAL CHECKS");
  console.log("=================================================");

  let testPassed = true;

  try {
    // -------------------------------------------------------------------------
    // STEP 0: CONFIGURE SQLITE PRAGMAS (WAL MODE & BUSY TIMEOUT HARDENING)
    // -------------------------------------------------------------------------
    await configureSqlitePragmas(prisma);
    console.log("  ✓ Storage Engine: SQLite WAL mode and busy_timeout (10,000ms) verified.");
    // -------------------------------------------------------------------------
    // TEST 1: CUSTOMER -> JOB -> INVOICE DEEP RELATIONAL TRAVERSAL
    // -------------------------------------------------------------------------
    console.log("\n[Test 1/5] Deep relational traversal (Customer -> Projects -> Invoices)...");
    const targetEmail = "sarah.jenkins@gmail.com";
    const customer = await prisma.customer.findUnique({
      where: { email: targetEmail },
      include: {
        projects: {
          include: {
            materialAssignments: { include: { material: true } },
            subcontractorAssignments: { include: { subcontractor: true } },
            workOrders: { include: { checklistItems: true } },
            estimate: { include: { lineItems: true } },
          },
        },
        invoices: {
          include: {
            lineItems: { include: { material: true } },
            payments: true,
          },
        },
        communications: true,
      },
    });

    if (!customer) {
      throw new Error(`Customer with email '${targetEmail}' not found in database!`);
    }
    if (!customer.projects || customer.projects.length === 0) {
      throw new Error(`Customer '${customer.email}' has no linked projects!`);
    }
    if (!customer.invoices || customer.invoices.length === 0) {
      throw new Error(`Customer '${customer.email}' has no linked invoices!`);
    }

    console.log(`  ✓ Customer Found: ${customer.firstName} ${customer.lastName} (${customer.email})`);
    console.log(`  ✓ Linked Projects: ${customer.projects.length} project(s) [First: "${customer.projects[0].title}" (${customer.projects[0].projectNumber})]`);
    console.log(`  ✓ Linked Invoices: ${customer.invoices.length} invoice(s) [First: "${customer.invoices[0].invoiceNumber}"]`);
    console.log(`  ✓ Linked Communications: ${customer.communications.length} log(s)`);

    // -------------------------------------------------------------------------
    // TEST 2: FINANCIAL INTEGRITY & MATHEMATICAL PARITY (EXACT DECIMAL MATH)
    // -------------------------------------------------------------------------
    console.log("\n[Test 2/5] Verifying financial integrity and balance parity with exact Decimal arithmetic...");
    const invoice = customer.invoices[0];
    const project = customer.projects[0];
    const estimate = project?.estimate;

    if (!estimate) {
      throw new Error(`Project '${project.projectNumber}' has no linked estimate for financial verification!`);
    }

    // Check 2a: Invoice line items sum == invoice.subtotal (Exact Decimal Match)
    const invoiceLineItemsSum = invoice.lineItems.reduce(
      (acc, item) => acc.plus(item.amount),
      new Prisma.Decimal(0)
    );
    if (!invoiceLineItemsSum.equals(invoice.subtotal)) {
      throw new Error(
        `Invoice line item sum mismatch: items total $${invoiceLineItemsSum.toFixed(2)}, subtotal is $${invoice.subtotal.toFixed(2)}`
      );
    }
    console.log(`  ✓ Check 2a: Invoice line items sum: $${invoiceLineItemsSum.toFixed(2)} === Subtotal: $${invoice.subtotal.toFixed(2)} [EXACT MATCH]`);

    // Check 2b: Estimate line items sum == estimate.subtotal (Exact Decimal Match)
    if (!estimate.lineItems || estimate.lineItems.length === 0) {
      throw new Error(`Estimate '${estimate.estimateNumber}' has no itemized line items!`);
    }
    const estimateLineItemsSum = estimate.lineItems.reduce(
      (acc, item) => {
        // Handle both totalPrice (Prisma schema column) and totalCost (canonical domain alias)
        const rawAmount = (item as any).totalCost ?? item.totalPrice;
        const itemAmount = rawAmount instanceof Prisma.Decimal ? rawAmount : new Prisma.Decimal(rawAmount);
        return acc.plus(itemAmount);
      },
      new Prisma.Decimal(0)
    );
    if (!estimateLineItemsSum.equals(estimate.subtotal)) {
      throw new Error(
        `Estimate line item sum mismatch: items total $${estimateLineItemsSum.toFixed(2)}, subtotal is $${estimate.subtotal.toFixed(2)}`
      );
    }
    console.log(`  ✓ Check 2b: Estimate line items sum: $${estimateLineItemsSum.toFixed(2)} === Subtotal: $${estimate.subtotal.toFixed(2)} [EXACT MATCH]`);

    // Check 2c: Invoice tax formula: subtotal + taxAmount == totalAmount (Exact Decimal Match)
    const expectedInvoiceTotal = invoice.subtotal.plus(invoice.taxAmount);
    if (!expectedInvoiceTotal.equals(invoice.totalAmount)) {
      throw new Error(
        `Invoice total amount formula failure: subtotal ($${invoice.subtotal.toFixed(2)}) + tax ($${invoice.taxAmount.toFixed(2)}) = $${expectedInvoiceTotal.toFixed(2)}, but totalAmount is $${invoice.totalAmount.toFixed(2)}`
      );
    }
    console.log(`  ✓ Check 2c: Invoice tax formula: $${invoice.subtotal.toFixed(2)} + $${invoice.taxAmount.toFixed(2)} === $${invoice.totalAmount.toFixed(2)} [EXACT MATCH]`);

    // Check 2d: Invoice balance formula: totalAmount - amountPaid == balanceDue (Exact Decimal Match)
    const expectedInvoiceBalance = invoice.totalAmount.minus(invoice.amountPaid);
    if (!expectedInvoiceBalance.equals(invoice.balanceDue)) {
      throw new Error(
        `Invoice balance formula failure: total ($${invoice.totalAmount.toFixed(2)}) - paid ($${invoice.amountPaid.toFixed(2)}) = $${expectedInvoiceBalance.toFixed(2)}, but balanceDue is $${invoice.balanceDue.toFixed(2)}`
      );
    }
    console.log(`  ✓ Check 2d: Invoice balance formula: $${invoice.totalAmount.toFixed(2)} - $${invoice.amountPaid.toFixed(2)} === $${invoice.balanceDue.toFixed(2)} [EXACT MATCH]`);

    // Check 2e: Payment ledger sum == amountPaid (Exact Decimal Match)
    const completedPaymentsSum = invoice.payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((acc, p) => acc.plus(p.amount), new Prisma.Decimal(0));
    if (!completedPaymentsSum.equals(invoice.amountPaid)) {
      throw new Error(
        `Payment ledger mismatch: completed payments total $${completedPaymentsSum.toFixed(2)}, invoice amountPaid is $${invoice.amountPaid.toFixed(2)}`
      );
    }
    console.log(`  ✓ Check 2e: Payment ledger check: $${completedPaymentsSum.toFixed(2)} collected === amountPaid: $${invoice.amountPaid.toFixed(2)} [EXACT MATCH]`);

    // Check 2f: Estimate tax and grand total formula: subtotal + taxAmount == grandTotal
    const expectedEstimateGrandTotal = estimate.subtotal.plus(estimate.taxAmount);
    if (!expectedEstimateGrandTotal.equals(estimate.grandTotal)) {
      throw new Error(
        `Estimate grand total formula failure: subtotal ($${estimate.subtotal.toFixed(2)}) + tax ($${estimate.taxAmount.toFixed(2)}) = $${expectedEstimateGrandTotal.toFixed(2)}, but grandTotal is $${estimate.grandTotal.toFixed(2)}`
      );
    }
    console.log(`  ✓ Check 2f: Estimate tax formula: $${estimate.subtotal.toFixed(2)} + $${estimate.taxAmount.toFixed(2)} === $${estimate.grandTotal.toFixed(2)} [EXACT MATCH]`);

    // -------------------------------------------------------------------------
    // TEST 3: CONSTRUCTION JOB ALLOCATION & WORK ORDER INTEGRITY
    // -------------------------------------------------------------------------
    console.log("\n[Test 3/5] Verifying Construction Job allocations & operational entities...");
    const job = customer.projects[0];

    // Check 3a: Material assignments
    if (!job.materialAssignments || job.materialAssignments.length === 0) {
      throw new Error(`Project '${job.projectNumber}' has no material allocations!`);
    }
    const matAlloc = job.materialAssignments[0];
    if (!matAlloc.material) {
      throw new Error("Material assignment relation did not load parent Material catalog entity!");
    }
    console.log(`  ✓ Material Allocated: ${matAlloc.material.name} (SKU: ${matAlloc.material.sku}, Used: ${matAlloc.quantityUsed}/${matAlloc.quantityEstimated})`);

    // Check 3b: Subcontractor assignments
    if (!job.subcontractorAssignments || job.subcontractorAssignments.length === 0) {
      throw new Error(`Project '${job.projectNumber}' has no subcontractor assignments!`);
    }
    const subAlloc = job.subcontractorAssignments[0];
    if (!subAlloc.subcontractor) {
      throw new Error("Subcontractor assignment relation did not load parent Subcontractor entity!");
    }
    console.log(`  ✓ Subcontractor Assigned: ${subAlloc.subcontractor.companyName} (${subAlloc.subcontractor.trade}, Agreed: $${new Prisma.Decimal(subAlloc.agreedAmount).toFixed(2)})`);

    // Check 3c: Work Orders & Checklists
    if (!job.workOrders || job.workOrders.length === 0) {
      throw new Error(`Project '${job.projectNumber}' has no associated Work Orders!`);
    }
    const wo = job.workOrders[0];
    if (!wo.checklistItems || wo.checklistItems.length === 0) {
      throw new Error(`WorkOrder '${wo.workOrderNumber}' has no checklist items!`);
    }
    console.log(`  ✓ Work Order Verified: ${wo.workOrderNumber} ("${wo.title}") with ${wo.checklistItems.length} checklist items.`);

    // Check 3d: Estimate Linkage
    if (!job.estimate) {
      throw new Error(`Project '${job.projectNumber}' is missing linked Estimate!`);
    }
    console.log(`  ✓ Linked Estimate: ${job.estimate.estimateNumber} (Grand Total: $${new Prisma.Decimal(job.estimate.grandTotal).toFixed(2)})`);

    // -------------------------------------------------------------------------
    // TEST 4: CRM OMNICHANNEL & AI AGENT AUDIT LOG VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\n[Test 4/5] Verifying CRM communications and AI AgentRun audit log...");
    const hasInbound = customer.communications.some((c) => c.direction === "INBOUND");
    const hasAiOutbound = customer.communications.some((c) => c.direction === "OUTBOUND" && c.aiGenerated);
    if (!hasInbound) {
      throw new Error("Missing INBOUND customer communication in communicationLog!");
    }
    if (!hasAiOutbound) {
      throw new Error("Missing AI-generated OUTBOUND communication draft in communicationLog!");
    }
    console.log("  ✓ CRM Communications Verified: Inbound inquiry and outbound AI draft confirmed.");

    const agentRuns = await prisma.agentRun.findMany({
      where: { projectId: job.id },
    });
    if (agentRuns.length === 0) {
      throw new Error(`No AgentRun audit logs found for project ID '${job.id}'!`);
    }
    const run = agentRuns[0];
    if (!run.inputPayload || !run.outputPayload) {
      throw new Error(`AgentRun '${run.id}' is missing structured input/output JSON payloads!`);
    }
    console.log(`  ✓ AI AgentRun Verified: Type=${run.agentType}, Status=${run.status}, Tokens=${run.tokensUsed}, Duration=${run.executionDurationMs}ms`);

    // -------------------------------------------------------------------------
    // TEST 5: NON-DESTRUCTIVE CASCADE ISOLATION VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\n[Test 5/5] Verifying cascade isolation on ephemeral test records...");
    const tempCustomer = await prisma.customer.create({
      data: {
        firstName: "CascadeTest",
        lastName: "Ephemeral",
        email: `cascade.test.${Date.now()}@example.com`,
        phone: "+1-555-000-0000",
        billingAddress: "100 Test St",
        billingCity: "TestCity",
        billingState: "CO",
        billingZip: "80000",
      },
    });

    const tempProject = await prisma.project.create({
      data: {
        projectNumber: `TEMP-PRJ-${Date.now()}`,
        title: "Ephemeral Cascade Project",
        customerId: tempCustomer.id,
        siteAddress: "100 Test St",
        siteCity: "TestCity",
        siteState: "CO",
        siteZip: "80000",
      },
    });

    const tempWorkOrder = await prisma.workOrder.create({
      data: {
        workOrderNumber: `TEMP-WO-${Date.now()}`,
        projectId: tempProject.id,
        title: "Ephemeral WorkOrder",
      },
    });

    // Delete temp project -> workOrder must cascade delete
    await prisma.project.delete({ where: { id: tempProject.id } });
    const checkWo = await prisma.workOrder.findUnique({ where: { id: tempWorkOrder.id } });
    if (checkWo !== null) {
      throw new Error("Cascade delete failed: WorkOrder was not purged when parent Project was deleted!");
    }

    // Clean up temp customer
    await prisma.customer.delete({ where: { id: tempCustomer.id } });
    console.log("  ✓ Cascade isolation verified: Child WorkOrder purged cleanly upon parent Project deletion.");

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log("\n=================================================");
    console.log("🎉 ALL 5 DATABASE VERIFICATION CHECKS PASSED!");
    console.log("=================================================");
  } catch (err) {
    console.error("\n❌ Database Verification Failed with error:", err);
    testPassed = false;
  } finally {
    await prisma.$disconnect();
    if (!testPassed) {
      process.exit(1);
    }
    process.exit(0);
  }
}

runVerification();
