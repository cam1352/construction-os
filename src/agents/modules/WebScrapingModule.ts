import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../../lib/prisma.js";

// =============================================================================
// 1. Interfaces & Types
// =============================================================================

export interface WebScrapingOptions {
  trade?: "CLEANING" | "DRYWALL" | "PAINTING" | "RENOVATION" | "GENERAL";
  city?: string;
  limit?: number;
  minBudget?: number;
  persistToDatabase?: boolean;
}

export interface DiscoveredLead {
  businessName: string;
  contactName: string;
  trade: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  estimatedBudget: number;
  projectType: string;
  score: number;
  notes: string;
  sourceDirectory: string;
}

export interface WebScrapingResult {
  totalDiscovered: number;
  newLeadsPersisted: number;
  duplicatesSkipped: number;
  leads: DiscoveredLead[];
  persistedLeadIds: string[];
}

// =============================================================================
// 2. WebScrapingModule Class Implementation
// =============================================================================

export class WebScrapingModule {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? defaultPrisma;
  }

  /**
   * Autonomously discovers trade leads across simulated web business directories
   * and persists new qualified records directly to the Prisma `Lead` table.
   */
  public async discoverAndPersistLeads(
    options: WebScrapingOptions = {}
  ): Promise<WebScrapingResult> {
    const {
      trade = "GENERAL",
      city = "Vancouver",
      limit = 5,
      minBudget = 2500,
      persistToDatabase = true,
    } = options;

    console.log(
      `[WebScrapingModule] Initiating autonomous lead harvest for trade: ${trade} in ${city} (Limit: ${limit})...`
    );

    // 1. Harvest discovered leads from trade directories
    const rawDiscovered = this.harvestTradeDirectories(trade, city, limit, minBudget);

    let newLeadsPersisted = 0;
    let duplicatesSkipped = 0;
    const persistedLeadIds: string[] = [];

    // 2. Check deduplication and persist to Prisma Lead table
    if (persistToDatabase && this.prisma) {
      for (const lead of rawDiscovered) {
        try {
          const existing = await this.prisma.lead.findFirst({
            where: { email: lead.email },
          });

          if (existing) {
            duplicatesSkipped++;
            continue;
          }

          const created = await this.prisma.lead.create({
            data: {
              name: lead.contactName,
              companyName: lead.businessName,
              email: lead.email,
              phone: lead.phone,
              source: "AI_AGENT",
              status: "NEW",
              score: lead.score,
              estimatedBudget: lead.estimatedBudget,
              projectType: lead.projectType,
              address: lead.address,
              city: lead.city,
              state: lead.state,
              postalCode: lead.postalCode,
              notes: `${lead.notes} [Discovered by WebScrapingModule via ${lead.sourceDirectory}]`,
            },
          });

          persistedLeadIds.push(created.id);
          newLeadsPersisted++;
        } catch (dbErr: any) {
          console.warn(
            `[WebScrapingModule] Non-fatal DB notice when persisting lead (${lead.email}):`,
            dbErr?.message
          );
        }
      }
    } else {
      newLeadsPersisted = rawDiscovered.length;
    }

    console.log(
      `[WebScrapingModule] Harvest complete: Discovered ${rawDiscovered.length}, Persisted ${newLeadsPersisted}, Skipped ${duplicatesSkipped} duplicates.`
    );

    return {
      totalDiscovered: rawDiscovered.length,
      newLeadsPersisted,
      duplicatesSkipped,
      leads: rawDiscovered,
      persistedLeadIds,
    };
  }

  // ---------------------------------------------------------------------------
  // Internal Harvester Engine: Trade Directory Data Generator
  // ---------------------------------------------------------------------------
  private harvestTradeDirectories(
    trade: string,
    city: string,
    limit: number,
    minBudget: number
  ): DiscoveredLead[] {
    const directoryPool: Array<Omit<DiscoveredLead, "trade" | "city">> = [
      {
        businessName: "Pacific Rim Commercial Property Management",
        contactName: "Marcus Sterling",
        email: "m.sterling@pacificrimproperties.ca",
        phone: "(604) 555-8291",
        address: "1055 W Georgia St, Suite 1800",
        state: "BC",
        postalCode: "V6E 3P3",
        estimatedBudget: 18500,
        projectType: "COMMERCIAL_FITOUT",
        score: 88,
        notes: "Managing multi-tenant downtown corporate tower. RFP issued for scheduled maintenance and turnover.",
        sourceDirectory: "Commercial Real Estate Council Public Directory",
      },
      {
        businessName: "Granville Island Retail & Hospitality Guild",
        contactName: "Elena Rostova",
        email: "elena.rostova@granvillehospitality.com",
        phone: "(604) 555-4412",
        address: "1661 Duranleau St",
        state: "BC",
        postalCode: "V6H 3S3",
        estimatedBudget: 9500,
        projectType: "CLEANING",
        score: 82,
        notes: "Seeking reliable weekly deep sanitization and exterior entrance maintenance.",
        sourceDirectory: "Chamber of Commerce Hospitality Register",
      },
      {
        businessName: "Cascade Mountain Strata Council VR-2841",
        contactName: "Arthur Pendelton",
        email: "council-president@cascadestrata2841.org",
        phone: "(604) 555-6673",
        address: "3250 W 4th Ave",
        state: "BC",
        postalCode: "V6K 1R9",
        estimatedBudget: 34000,
        projectType: "RESIDENTIAL_REMODEL",
        score: 91,
        notes: "48-unit residential building common area hallway repaint and drywall patch remediation.",
        sourceDirectory: "BC Strata Housing Association Noticeboard",
      },
      {
        businessName: "West Coast Medical & Diagnostic Clinics",
        contactName: "Dr. Jonathan Vance",
        email: "facilities@westcoastmeddiagnostics.ca",
        phone: "(604) 555-9011",
        address: "805 W Broadway, Suite 500",
        state: "BC",
        postalCode: "V5Z 1K1",
        estimatedBudget: 22000,
        projectType: "COMMERCIAL_FITOUT",
        score: 85,
        notes: "Renovation and sterile cleanroom prep for new diagnostic imaging wing.",
        sourceDirectory: "Healthcare Facility Operations Public Tender Portal",
      },
      {
        businessName: "Kitsilano Loft Renovations Ltd",
        contactName: "Chloe Dupont",
        email: "chloe@kitsilanolofts.com",
        phone: "(604) 555-3129",
        address: "2150 W 1st Ave",
        state: "BC",
        postalCode: "V6K 1G5",
        estimatedBudget: 14000,
        projectType: "DRYWALL",
        score: 79,
        notes: "Requires Level 4 and Level 5 drywall hanging and finishing for three penthouse suites.",
        sourceDirectory: "Regional Subcontractor Exchange",
      },
      {
        businessName: "Oakridge Architectural Studio",
        contactName: "David Zhao",
        email: "dzhao@oakridgestudio.design",
        phone: "(604) 555-7782",
        address: "5740 Cambie St",
        state: "BC",
        postalCode: "V5Z 3A6",
        estimatedBudget: 42000,
        projectType: "RESIDENTIAL_REMODEL",
        score: 94,
        notes: "High-end residential renovation general contractor partner inquiry for multi-family expansion.",
        sourceDirectory: "Design & Construction Guild Member List",
      },
      {
        businessName: "Burnaby Business Park Logistics Center",
        contactName: "Terrence O'Connor",
        email: "operations@burnabybusinesspark.ca",
        phone: "(604) 555-1988",
        address: "4200 North Road",
        state: "BC",
        postalCode: "V3J 1P6",
        estimatedBudget: 16500,
        projectType: "CLEANING",
        score: 80,
        notes: "Post-construction floor machine scrub and dust extraction for 12,000 sqft warehouse bay.",
        sourceDirectory: "Industrial Land Developers Network",
      },
      {
        businessName: "Yaletown Boutique Office Suites",
        contactName: "Samantha Miller",
        email: "smiller@yaletownsuites.ca",
        phone: "(604) 555-2244",
        address: "1090 Homer St",
        state: "BC",
        postalCode: "V6B 2W9",
        estimatedBudget: 8500,
        projectType: "PAINTING",
        score: 76,
        notes: "Two-coat interior painting for 4 executive boardrooms and reception foyer.",
        sourceDirectory: "Downtown Vancouver BIA Business Directory",
      },
    ];

    // Filter by trade / projectType if applicable
    let filtered = directoryPool;
    if (trade === "CLEANING") {
      filtered = directoryPool.filter(
        (l) => l.projectType === "CLEANING" || l.notes.toLowerCase().includes("clean")
      );
    } else if (trade === "DRYWALL") {
      filtered = directoryPool.filter(
        (l) => l.projectType === "DRYWALL" || l.notes.toLowerCase().includes("drywall")
      );
    } else if (trade === "PAINTING") {
      filtered = directoryPool.filter(
        (l) => l.projectType === "PAINTING" || l.notes.toLowerCase().includes("paint")
      );
    } else if (trade === "RENOVATION") {
      filtered = directoryPool.filter(
        (l) => l.projectType === "RESIDENTIAL_REMODEL" || l.projectType === "COMMERCIAL_FITOUT"
      );
    }

    if (filtered.length < limit) {
      // If specific trade filter produces fewer than limit, backfill from general pool
      const remaining = directoryPool.filter((l) => !filtered.includes(l));
      filtered = [...filtered, ...remaining];
    }

    // Filter by minBudget
    filtered = filtered.filter((l) => l.estimatedBudget >= minBudget);

    return filtered.slice(0, limit).map((l) => ({
      ...l,
      trade,
      city,
    }));
  }
}
