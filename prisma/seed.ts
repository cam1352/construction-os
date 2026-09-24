import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function main() {
  console.log("=================================================");
  console.log("STARTING CONSTRUCTION OS DATABASE SEEDING");
  console.log("=================================================");

  // ---------------------------------------------------------------------------
  // STEP 1: TEARDOWN (Reverse Topological Order)
  // Ensures clean idempotency without FK constraint violations
  // ---------------------------------------------------------------------------
  console.log("\n[1/5] Purging existing records in reverse topological order...");
  await prisma.agentRun.deleteMany();
  await prisma.communicationLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.workOrderLineItem.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.projectSubcontractor.deleteMany();
  await prisma.projectMaterial.deleteMany();
  await prisma.estimateLineItem.deleteMany();
  await prisma.project.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.subcontractor.deleteMany();
  await prisma.material.deleteMany();
  await prisma.customer.deleteMany();
  console.log("  ✓ Database cleared successfully.");

  // ---------------------------------------------------------------------------
  // STEP 2: TIER 0 - ROOT CATALOGS (No Foreign Keys)
  // ---------------------------------------------------------------------------
  console.log("\n[2/5] Seeding Tier 0: Root Catalogs (Customers, Materials, Subcontractors)...");

  // Customers
  const customerSarah = await prisma.customer.create({
    data: {
      accountType: "INDIVIDUAL",
      firstName: "Sarah",
      lastName: "Jenkins",
      email: "sarah.jenkins@gmail.com",
      phone: "+1-555-987-6543",
      billingAddress: "742 Evergreen Terrace",
      billingCity: "Denver",
      billingState: "CO",
      billingZip: "80205",
      status: "ACTIVE",
      leadSource: "WEBSITE_INQUIRY",
      notes: "Homeowner requiring post-renovation cleaning and wall touch-ups for 1500 sqft residence.",
    },
  });

  const customerAcme = await prisma.customer.create({
    data: {
      accountType: "COMMERCIAL",
      firstName: "Marcus",
      lastName: "Vance",
      companyName: "Acme Commercial Realty",
      email: "marcus.vance@acmerealty.com",
      phone: "+1-555-234-8901",
      billingAddress: "400 Grand Ave, Suite 1200",
      billingCity: "Denver",
      billingState: "CO",
      billingZip: "80202",
      status: "ACTIVE",
      leadSource: "DIRECT_SALES",
      notes: "Commercial property owner managing 4 multi-tenant commercial lofts.",
    },
  });
  console.log(`  ✓ Created Customers: ${customerSarah.firstName} ${customerSarah.lastName}, ${customerAcme.companyName}`);

  // Materials Catalog
  const matCleaner = await prisma.material.create({
    data: {
      sku: "MAT-CLN-003",
      name: "Commercial Surface Cleaner & Disinfectant 5-Gal",
      description: "EPA-registered heavy-duty post-construction cleaning concentrate.",
      category: "CLEANING",
      unit: "GALLON",
      unitCost: new Prisma.Decimal(45.00),
      markupPercent: new Prisma.Decimal(35.0),
      unitPrice: new Prisma.Decimal(60.75),
      stockQuantity: 40.0,
      reorderThreshold: 10.0,
      supplierName: "ProClean Janitorial Supply",
      supplierSku: "PCJ-CLN-5G",
    },
  });

  const matDrywall = await prisma.material.create({
    data: {
      sku: "MAT-DRY-001",
      name: "1/2-in x 4-ft x 8-ft Sheetrock Drywall Panel",
      description: "Standard tapered edge gypsum board for interior walls.",
      category: "DRYWALL",
      unit: "SHEET",
      unitCost: new Prisma.Decimal(14.50),
      markupPercent: new Prisma.Decimal(25.0),
      unitPrice: new Prisma.Decimal(18.13),
      stockQuantity: 450.0,
      reorderThreshold: 50.0,
      supplierName: "US Gypsum Supply",
    },
  });

  const matLumber = await prisma.material.create({
    data: {
      sku: "MAT-LUM-002",
      name: "2-in x 4-in x 8-ft Kiln-Dried SPF Stud",
      description: "Construction grade framing lumber.",
      category: "LUMBER",
      unit: "PIECE",
      unitCost: new Prisma.Decimal(4.80),
      markupPercent: new Prisma.Decimal(30.0),
      unitPrice: new Prisma.Decimal(6.24),
      stockQuantity: 800.0,
      reorderThreshold: 100.0,
      supplierName: "Denver Forest Products",
    },
  });
  console.log(`  ✓ Created Materials: ${matCleaner.sku}, ${matDrywall.sku}, ${matLumber.sku}`);

  // Subcontractors
  const subPristineClean = await prisma.subcontractor.create({
    data: {
      companyName: "Pristine Post-Build Cleaners LLC",
      contactName: "Elena Rostova",
      trade: "CLEANING",
      licenseNumber: "CO-JAN-11029",
      insurancePolicy: "POL-JAN-5541",
      insuranceExpiry: new Date("2027-12-31"),
      email: "elena@pristineclean.com",
      phone: "+1-555-678-1234",
      address: "4820 Broadway, Denver, CO 80205",
      hourlyRate: new Prisma.Decimal(45.00),
      status: "ACTIVE",
      rating: 4.9,
    },
  });

  const subApexElectric = await prisma.subcontractor.create({
    data: {
      companyName: "Apex Electrical Contractors LLC",
      contactName: "David Kowalski",
      trade: "ELECTRICAL",
      licenseNumber: "CO-ELEC-99382",
      insurancePolicy: "POL-LIB-2026-9912",
      insuranceExpiry: new Date("2027-01-01"),
      email: "david@apexelectric.com",
      phone: "+1-555-345-6789",
      address: "1200 Industrial Way, Denver, CO 80216",
      hourlyRate: new Prisma.Decimal(85.00),
      status: "ACTIVE",
      rating: 4.8,
    },
  });
  console.log(`  ✓ Created Subcontractors: ${subPristineClean.companyName}, ${subApexElectric.companyName}`);

  // ---------------------------------------------------------------------------
  // STEP 3: TIER 1 - FIRST-DEGREE DEPENDENTS
  // ---------------------------------------------------------------------------
  console.log("\n[3/5] Seeding Tier 1: First-Degree Dependents (Leads, Estimates, Projects)...");

  // CRM Lead
  const leadSarah = await prisma.lead.create({
    data: {
      name: "Sarah Jenkins",
      email: "sarah.jenkins@gmail.com",
      phone: "+1-555-987-6543",
      source: "WEBSITE",
      status: "CONVERTED",
      score: 88,
      estimatedBudget: new Prisma.Decimal(4500.00),
      projectType: "RESIDENTIAL_CLEANING",
      city: "Denver",
      state: "CO",
      convertedCustomerId: customerSarah.id,
      convertedAt: new Date("2026-09-18T10:00:00Z"),
      notes: "Inquired online for 1500 sqft post-remodel deep cleaning service.",
    },
  });

  // Estimate
  const estimateResidential = await prisma.estimate.create({
    data: {
      estimateNumber: "EST-2026-001",
      title: "1500 sqft Residential Deep Cleaning & Wall Touchup",
      customerId: customerSarah.id,
      leadId: leadSarah.id,
      status: "APPROVED",
      sqft: 1500.0,
      scopeOfWork: "HEPA air scrubbing, vent deep clean, surface sanitization, and drywall touch-ups.",
      totalLaborCost: new Prisma.Decimal(1040.00),
      totalMaterialCost: new Prisma.Decimal(1007.25),
      totalEquipmentCost: new Prisma.Decimal(450.00),
      totalSubcontractorCost: new Prisma.Decimal(1000.00),
      overheadMarkup: new Prisma.Decimal(297.75),
      subtotal: new Prisma.Decimal(3795.00),
      taxRate: new Prisma.Decimal(8.0),
      taxAmount: new Prisma.Decimal(303.60),
      grandTotal: new Prisma.Decimal(4098.60),
      aiGenerated: true,
      aiConfidence: 0.94,
      metadata: JSON.stringify({
        roomCount: 4,
        hazardLevel: "LOW",
        generatedBy: "EstimatingAgent-v1",
      }),
    },
  });

  // Construction Job (Project)
  const jobSarah = await prisma.project.create({
    data: {
      projectNumber: "PRJ-2026-001",
      title: "1500 sqft Residential Deep Cleaning & Restoration",
      description: "Post-renovation multi-room turnover cleaning and wall touch-ups for Sarah Jenkins residence.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      jobType: "RESIDENTIAL",
      customerId: customerSarah.id,
      estimateId: estimateResidential.id,
      siteAddress: "742 Evergreen Terrace",
      siteCity: "Denver",
      siteState: "CO",
      siteZip: "80205",
      squareFootage: 1500.0,
      budgetAmount: new Prisma.Decimal(3795.00),
      contractValue: new Prisma.Decimal(4098.60),
      actualCost: new Prisma.Decimal(1222.25),
      startDate: new Date("2026-09-20"),
      targetEndDate: new Date("2026-10-05"),
    },
  });
  console.log(`  ✓ Created Project: ${jobSarah.projectNumber} ("${jobSarah.title}")`);

  // ---------------------------------------------------------------------------
  // STEP 4: TIER 2 - SECOND-DEGREE DEPENDENTS & JUNCTIONS
  // ---------------------------------------------------------------------------
  console.log("\n[4/5] Seeding Tier 2: Junctions & Operations (Line Items, Allocations, WorkOrders, Invoices)...");

  // Estimate Line Items (Reconciled to exact $3,795.00 subtotal)
  await prisma.estimateLineItem.createMany({
    data: [
      {
        estimateId: estimateResidential.id,
        category: "LABOR",
        description: "Surface preparation and HEPA air scrub (1500 sqft)",
        quantity: 16.0,
        unit: "HOURS",
        unitPrice: new Prisma.Decimal(65.00),
        totalPrice: new Prisma.Decimal(1040.00),
        orderIndex: 0,
      },
      {
        estimateId: estimateResidential.id,
        category: "MATERIAL",
        description: "Commercial Disinfectant and Microfiber Packs",
        quantity: 3.0,
        unit: "GALLON",
        unitPrice: new Prisma.Decimal(60.75),
        totalPrice: new Prisma.Decimal(182.25),
        materialId: matCleaner.id,
        orderIndex: 1,
      },
      {
        estimateId: estimateResidential.id,
        category: "SUBCONTRACTOR",
        description: "Specialized deep scrub crew dispatch",
        quantity: 1.0,
        unit: "LUMP_SUM",
        unitPrice: new Prisma.Decimal(1000.00),
        totalPrice: new Prisma.Decimal(1000.00),
        subcontractorId: subPristineClean.id,
        orderIndex: 2,
      },
      {
        estimateId: estimateResidential.id,
        category: "EQUIPMENT",
        description: "Commercial HEPA negative air scrubber rental & containment barrier setup",
        quantity: 2.0,
        unit: "UNIT",
        unitPrice: new Prisma.Decimal(225.00),
        totalPrice: new Prisma.Decimal(450.00),
        orderIndex: 3,
      },
      {
        estimateId: estimateResidential.id,
        category: "MATERIAL",
        description: "Hospital-grade antimicrobial fogging agent & aerosol containment supplies",
        quantity: 5.0,
        unit: "GALLON",
        unitPrice: new Prisma.Decimal(165.00),
        totalPrice: new Prisma.Decimal(825.00),
        orderIndex: 4,
      },
      {
        estimateId: estimateResidential.id,
        category: "OTHER",
        description: "Post-restoration air quality clearance testing & particulate verification",
        quantity: 1.0,
        unit: "LUMP_SUM",
        unitPrice: new Prisma.Decimal(297.75),
        totalPrice: new Prisma.Decimal(297.75),
        orderIndex: 5,
      },
    ],
  });

  // Project Material Allocation
  await prisma.projectMaterial.create({
    data: {
      projectId: jobSarah.id,
      materialId: matCleaner.id,
      quantityEstimated: 3.0,
      quantityUsed: 2.0,
      unitCostAtBooking: new Prisma.Decimal(45.00),
      totalCost: new Prisma.Decimal(90.00),
    },
  });

  // Project Subcontractor Assignment
  await prisma.projectSubcontractor.create({
    data: {
      projectId: jobSarah.id,
      subcontractorId: subPristineClean.id,
      agreedAmount: new Prisma.Decimal(1000.00),
      paidAmount: new Prisma.Decimal(500.00),
      startDate: new Date("2026-09-22"),
      status: "WORKING",
    },
  });

  // Work Order
  const wo1 = await prisma.workOrder.create({
    data: {
      workOrderNumber: "WO-2026-001",
      projectId: jobSarah.id,
      title: "Phase 1: Deep Floor Extraction & HVAC Duct Wipe",
      description: "Industrial HEPA vacuuming and sanitization of vents across 1500 sqft floor area.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assignedTo: "Elena Rostova (Crew Lead)",
      subcontractorId: subPristineClean.id,
      scheduledStart: new Date("2026-09-22T08:00:00Z"),
      scheduledEnd: new Date("2026-09-22T17:00:00Z"),
    },
  });

  // Invoice
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-001",
      customerId: customerSarah.id,
      projectId: jobSarah.id,
      status: "PARTIALLY_PAID",
      issueDate: new Date("2026-09-21"),
      dueDate: new Date("2026-10-21"),
      subtotal: new Prisma.Decimal(3795.00),
      taxRate: new Prisma.Decimal(8.0),
      taxAmount: new Prisma.Decimal(303.60),
      totalAmount: new Prisma.Decimal(4098.60),
      amountPaid: new Prisma.Decimal(2000.00),
      balanceDue: new Prisma.Decimal(2098.60),
      paymentTerms: "NET_30",
      notes: "Mobilization deposit received. Balance due upon punch-list signoff.",
    },
  });
  console.log(`  ✓ Created Invoice: ${invoice1.invoiceNumber} (Total: $${invoice1.totalAmount}, Balance: $${invoice1.balanceDue})`);

  // ---------------------------------------------------------------------------
  // STEP 5: TIER 3 - THIRD-DEGREE DEPENDENTS & AUDIT
  // ---------------------------------------------------------------------------
  console.log("\n[5/5] Seeding Tier 3: Work Items, Line Items, Payments, Comms & AI Audits...");

  // Work Order Line Items
  await prisma.workOrderLineItem.createMany({
    data: [
      {
        workOrderId: wo1.id,
        taskDescription: "Inspect attic intake dampers and seal floor vents",
        completed: true,
        hoursSpent: 2.5,
        orderIndex: 0,
      },
      {
        workOrderId: wo1.id,
        taskDescription: "Apply microbial neutralizer in basement crawlspace",
        completed: false,
        hoursSpent: 1.0,
        orderIndex: 1,
      },
    ],
  });

  // Invoice Line Items (2049.30 + 1745.70 = 3795.00 subtotal)
  await prisma.invoiceLineItem.createMany({
    data: [
      {
        invoiceId: invoice1.id,
        description: "Initial 50% Mobilization Deposit - 1500 sqft Restoration",
        quantity: 1.0,
        unitPrice: new Prisma.Decimal(2049.30),
        amount: new Prisma.Decimal(2049.30),
        orderIndex: 0,
      },
      {
        invoiceId: invoice1.id,
        description: "Phase 1 Specialized Cleaning & Debris Removal",
        quantity: 1.0,
        unitPrice: new Prisma.Decimal(1745.70),
        amount: new Prisma.Decimal(1745.70),
        materialId: matCleaner.id,
        orderIndex: 1,
      },
    ],
  });

  // Payment
  const payment1 = await prisma.payment.create({
    data: {
      paymentNumber: "PMT-2026-001",
      invoiceId: invoice1.id,
      customerId: customerSarah.id,
      amount: new Prisma.Decimal(2000.00),
      paymentDate: new Date("2026-09-21T14:30:00Z"),
      paymentMethod: "CREDIT_CARD",
      referenceNumber: "AUTH-STRIPE-994821",
      status: "COMPLETED",
      notes: "Mobilization deposit paid via customer portal.",
    },
  });
  console.log(`  ✓ Created Payment: ${payment1.paymentNumber} ($${payment1.amount})`);

  // Communication Logs (Omnichannel CRM)
  await prisma.communicationLog.create({
    data: {
      channel: "EMAIL",
      direction: "INBOUND",
      customerId: customerSarah.id,
      projectId: jobSarah.id,
      sender: "sarah.jenkins@gmail.com",
      recipient: "dispatch@constructionos.local",
      subject: "Schedule confirmation for deep clean",
      body: "Hi team, confirming that crew can access the property at 8 AM this Wednesday.",
      sentiment: "POSITIVE",
      status: "DELIVERED",
    },
  });

  await prisma.communicationLog.create({
    data: {
      channel: "EMAIL",
      direction: "OUTBOUND",
      customerId: customerSarah.id,
      projectId: jobSarah.id,
      sender: "sales-agent@constructionos.local",
      recipient: "sarah.jenkins@gmail.com",
      subject: "Re: Schedule confirmation for deep clean",
      body: "Hello Sarah, thank you for confirming access. Our lead supervisor Elena Rostova will arrive promptly at 8:00 AM.",
      sentiment: "POSITIVE",
      aiGenerated: true,
      agentId: "sales-agent-01",
      status: "SENT",
    },
  });

  // AI Agent Run Audit Log
  await prisma.agentRun.create({
    data: {
      agentType: "ESTIMATING",
      agentInstanceId: "estimator-worker-04",
      status: "COMPLETED",
      projectId: jobSarah.id,
      inputPayload: JSON.stringify({
        jobType: "RESIDENTIAL_CLEANING",
        sqft: 1500,
        condition: "POST_REMODEL",
      }),
      outputPayload: JSON.stringify({
        estimatedLaborHours: 16,
        estimatedTotal: 4098.60,
        suggestedMaterials: ["MAT-CLN-003"],
      }),
      executionDurationMs: 420,
      tokensUsed: 680,
    },
  });
  console.log("  ✓ Created Communications & AI AgentRun audit log.");

  console.log("\n=================================================");
  console.log("DATABASE SEEDING COMPLETED WITH ZERO FK ERRORS!");
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("\n❌ Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
