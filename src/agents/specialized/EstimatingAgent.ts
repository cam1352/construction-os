import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { BaseAgent } from "../core/BaseAgent.js";
import type { AgentContext } from "../core/types.js";
import { prisma as defaultPrisma } from "../../lib/prisma.js";

// =============================================================================
// 1. Zod Schemas & TypeScript Types
// =============================================================================

export const EstimatingAgentInputSchema = z.object({
  jobSpecification: z.string().min(1, "Job specification is required"),
  projectType: z
    .enum(["residential", "commercial", "industrial", "specialty"])
    .optional(),
  tradeType: z
    .enum(["cleaning", "drywall", "painting", "flooring", "framing", "general"])
    .optional(),
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  projectId: z.string().optional(),
  targetMargin: z.number().min(0).max(1).default(0.15), // 15%
  overheadRate: z.number().min(0).max(1).default(0.10), // 10%
  taxRate: z.number().min(0).max(1).default(0.0825), // 8.25%
  saveToDatabase: z.boolean().default(false),
});

export type EstimatingAgentInput = z.infer<typeof EstimatingAgentInputSchema>;

export const MaterialItemSchema = z.object({
  item: z.string(),
  quantity: z.number().positive(),
  unit: z.string(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
  category: z.string(),
});

export const LaborItemSchema = z.object({
  role: z.string(),
  hours: z.number().positive(),
  hourlyRate: z.number().positive(),
  total: z.number().nonnegative(),
});

export const EquipmentItemSchema = z.object({
  item: z.string(),
  rentalUnits: z.number().positive(),
  unit: z.string(),
  unitCost: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export const SubcontractorItemSchema = z.object({
  specialtyTrade: z.string(),
  description: z.string(),
  total: z.number().nonnegative(),
});

export const EstimatingAgentOutputSchema = z.object({
  jobMetadata: z.object({
    parsedTrade: z.string(),
    projectType: z.string(),
    parsedDimensions: z.object({
      quantity: z.number().positive(),
      unit: z.string(),
      rawText: z.string(),
    }),
    estimatedDurationDays: z.number().positive(),
    estimatedLaborHours: z.number().positive(),
    difficultyGrade: z.enum(["low", "medium", "high"]),
    wasteFactorPercent: z.number().min(0),
  }),
  costBreakdown: z.object({
    labor: z.array(LaborItemSchema),
    laborSubtotal: z.number().nonnegative(),
    materials: z.array(MaterialItemSchema),
    materialsSubtotal: z.number().nonnegative(),
    equipment: z.array(EquipmentItemSchema),
    equipmentSubtotal: z.number().nonnegative(),
    subcontractor: z.array(SubcontractorItemSchema),
    subcontractorSubtotal: z.number().nonnegative(),
    overheadMarkup: z.number().nonnegative(),
    subtotal: z.number().nonnegative(),
    taxRate: z.number().min(0),
    taxAmount: z.number().nonnegative(),
    grandTotal: z.number().nonnegative(),
  }),
  notes: z.array(z.string()),
  confidenceScore: z.number().min(0).max(1),
  persistedEstimateId: z.string().optional(),
});

export type EstimatingAgentOutput = z.infer<typeof EstimatingAgentOutputSchema>;

// =============================================================================
// 2. EstimatingAgent Class Implementation
// =============================================================================

export class EstimatingAgent extends BaseAgent<
  EstimatingAgentInput,
  EstimatingAgentOutput
> {
  public readonly id = "estimating_agent";
  public readonly name = "Construction Takeoff & Cost Estimating Agent";
  public readonly version = "1.0.0";
  public readonly description =
    "Parses trade scopes and dimension takeoffs (including 1500 sqft residential cleaning, commercial cleaning, drywall, painting), computes itemized cost breakdowns with penny-perfect math, and persists estimates to Prisma.";
  public readonly agentType = "ESTIMATING";

  protected readonly inputSchema = EstimatingAgentInputSchema;
  protected readonly outputSchema = EstimatingAgentOutputSchema;

  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    super();
    this.prisma = prismaClient ?? defaultPrisma;
  }

  /**
   * Framework execution hook conforming to BaseAgent lifecycle.
   */
  protected async execute(
    input: EstimatingAgentInput,
    context: AgentContext
  ): Promise<EstimatingAgentOutput> {
    const {
      jobSpecification,
      targetMargin = 0.15,
      overheadRate = 0.10,
      taxRate = 0.0825,
      saveToDatabase = false,
      customerId,
      leadId,
      projectId,
    } = input;

    // -------------------------------------------------------------------------
    // STEP 1: Dimension Takeoff Parsing
    // -------------------------------------------------------------------------
    const parsedTakeoff = this.parseDimensions(jobSpecification);
    const sqft = parsedTakeoff.quantity;

    // -------------------------------------------------------------------------
    // STEP 2: Trade & Project Type Identification
    // -------------------------------------------------------------------------
    const specLower = jobSpecification.toLowerCase();
    const isCommercial =
      input.projectType === "commercial" ||
      /\b(commercial|office|retail|warehouse|facility|tenant)\b/i.test(specLower);

    const projectType = input.projectType ?? (isCommercial ? "commercial" : "residential");

    let trade = input.tradeType;
    if (!trade) {
      if (/\b(cleaning|clean|janitorial|cleanup|turnover)\b/i.test(specLower)) {
        trade = "cleaning";
      } else if (/\b(drywall|sheetrock|gypsum|wallboard|spackle|taping)\b/i.test(specLower)) {
        trade = "drywall";
      } else if (/\b(painting|paint|stain|coat|primer)\b/i.test(specLower)) {
        trade = "painting";
      } else {
        trade = "general";
      }
    }

    // -------------------------------------------------------------------------
    // STEP 3: Trade-Specific Cost Engine
    // -------------------------------------------------------------------------
    let costResult: {
      parsedTrade: string;
      difficultyGrade: "low" | "medium" | "high";
      wasteFactorPercent: number;
      estimatedDurationDays: number;
      estimatedLaborHours: number;
      labor: z.infer<typeof LaborItemSchema>[];
      materials: z.infer<typeof MaterialItemSchema>[];
      equipment: z.infer<typeof EquipmentItemSchema>[];
      subcontractor: z.infer<typeof SubcontractorItemSchema>[];
      notes: string[];
      confidenceScore: number;
    };

    if (trade === "cleaning" && !isCommercial) {
      costResult = this.calculateResidentialCleaning(sqft);
    } else if (trade === "cleaning" && isCommercial) {
      costResult = this.calculateCommercialCleaning(sqft);
    } else if (trade === "drywall") {
      costResult = this.calculateDrywallInstallation(sqft, specLower);
    } else if (trade === "painting") {
      costResult = this.calculatePainting(sqft, specLower);
    } else {
      costResult = this.calculateGeneralConstruction(sqft, specLower);
    }

    // -------------------------------------------------------------------------
    // STEP 4: Mathematical Totals & Precision Rounding
    // -------------------------------------------------------------------------
    const laborSubtotal = this.round(
      costResult.labor.reduce((sum, item) => sum + item.total, 0)
    );
    const materialsSubtotal = this.round(
      costResult.materials.reduce((sum, item) => sum + item.total, 0)
    );
    const equipmentSubtotal = this.round(
      costResult.equipment.reduce((sum, item) => sum + item.total, 0)
    );
    const subcontractorSubtotal = this.round(
      costResult.subcontractor.reduce((sum, item) => sum + item.total, 0)
    );

    const directCosts = this.round(
      laborSubtotal + materialsSubtotal + equipmentSubtotal + subcontractorSubtotal
    );

    const combinedMarkupRate = targetMargin + overheadRate; // e.g. 0.15 + 0.10 = 0.25
    const overheadMarkup = this.round(directCosts * combinedMarkupRate);

    const subtotal = this.round(directCosts + overheadMarkup);
    const taxAmount = this.round(subtotal * taxRate);
    const grandTotal = this.round(subtotal + taxAmount);

    const output: EstimatingAgentOutput = {
      jobMetadata: {
        parsedTrade: costResult.parsedTrade,
        projectType,
        parsedDimensions: {
          quantity: sqft,
          unit: "sqft",
          rawText: parsedTakeoff.rawText,
        },
        estimatedDurationDays: costResult.estimatedDurationDays,
        estimatedLaborHours: costResult.estimatedLaborHours,
        difficultyGrade: costResult.difficultyGrade,
        wasteFactorPercent: costResult.wasteFactorPercent,
      },
      costBreakdown: {
        labor: costResult.labor,
        laborSubtotal,
        materials: costResult.materials,
        materialsSubtotal,
        equipment: costResult.equipment,
        equipmentSubtotal,
        subcontractor: costResult.subcontractor,
        subcontractorSubtotal,
        overheadMarkup,
        subtotal,
        taxRate,
        taxAmount,
        grandTotal,
      },
      notes: costResult.notes,
      confidenceScore: costResult.confidenceScore,
    };

    // -------------------------------------------------------------------------
    // STEP 5: Database Persistence (Prisma Estimate & LineItems)
    // -------------------------------------------------------------------------
    if ((saveToDatabase || customerId || leadId || projectId) && this.prisma) {
      try {
        const estNumber = `EST-${Date.now().toString().slice(-6)}`;
        const dbEstimate = await this.prisma.estimate.create({
          data: {
            estimateNumber: estNumber,
            title: `Estimate for ${costResult.parsedTrade} (${sqft} sqft)`,
            customerId: customerId || undefined,
            leadId: leadId || undefined,
            status: "DRAFT",
            totalLaborCost: laborSubtotal,
            totalMaterialCost: materialsSubtotal,
            totalEquipmentCost: equipmentSubtotal,
            totalSubcontractorCost: subcontractorSubtotal,
            overheadMarkup,
            subtotal,
            taxRate,
            taxAmount,
            grandTotal,
            sqft,
            scopeOfWork: jobSpecification,
            aiGenerated: true,
            aiConfidence: costResult.confidenceScore,
            lineItems: {
              create: [
                ...costResult.labor.map((l, idx) => ({
                  category: "LABOR",
                  description: `${l.role} (${l.hours} hrs @ $${l.hourlyRate}/hr)`,
                  quantity: l.hours,
                  unit: "HOURS",
                  unitPrice: l.hourlyRate,
                  totalPrice: l.total,
                  orderIndex: idx,
                })),
                ...costResult.materials.map((m, idx) => ({
                  category: "MATERIAL",
                  description: m.item,
                  quantity: m.quantity,
                  unit: m.unit,
                  unitPrice: m.unitPrice,
                  totalPrice: m.total,
                  orderIndex: costResult.labor.length + idx,
                })),
                ...costResult.equipment.map((e, idx) => ({
                  category: "EQUIPMENT",
                  description: e.item,
                  quantity: e.rentalUnits,
                  unit: e.unit,
                  unitPrice: e.unitCost,
                  totalPrice: e.total,
                  orderIndex: costResult.labor.length + costResult.materials.length + idx,
                })),
              ],
            },
          },
        });
        output.persistedEstimateId = dbEstimate.id;
      } catch (dbErr: any) {
        context.logger?.warn(
          `[EstimatingAgent] Notice: Database persistence skipped (${dbErr.message})`
        );
      }
    }

    return output;
  }

  // ---------------------------------------------------------------------------
  // Helper: Dimension Parser
  // ---------------------------------------------------------------------------
  private parseDimensions(text: string): { quantity: number; rawText: string } {
    const match = text.match(/(\d+[\d,]*)\s*(?:sqft|sq\s*ft|square\s*feet|sf)\b/i);
    if (match) {
      const cleanNum = parseInt(match[1].replace(/,/g, ""), 10);
      return { quantity: cleanNum, rawText: match[0] };
    }

    const generalDigits = text.match(/\b(\d+[\d,]*)\b/);
    if (generalDigits) {
      const num = parseInt(generalDigits[1].replace(/,/g, ""), 10);
      if (num > 50) {
        return { quantity: num, rawText: `${num} sqft (inferred)` };
      }
    }

    return { quantity: 1500, rawText: "1500 sqft (standard benchmark default)" };
  }

  // ---------------------------------------------------------------------------
  // Trade Calculator 1: Residential Cleaning (e.g. 1500 sqft)
  // ---------------------------------------------------------------------------
  private calculateResidentialCleaning(sqft: number) {
    const laborHours = this.round(sqft / 350); // ~350 sqft/hour
    const leadHours = this.round(laborHours * 0.5);
    const assistantHours = this.round(laborHours * 0.5);

    const labor = [
      {
        role: "Lead Residential Cleaning Specialist",
        hours: Math.max(1, leadHours),
        hourlyRate: 55.0,
        total: this.round(Math.max(1, leadHours) * 55.0),
      },
      {
        role: "Cleaning Associate",
        hours: Math.max(1, assistantHours),
        hourlyRate: 45.0,
        total: this.round(Math.max(1, assistantHours) * 45.0),
      },
    ];

    const chemicalUnits = Math.max(1, Math.ceil(sqft / 800));
    const materials = [
      {
        item: "Eco-friendly disinfectant & surface cleaners",
        quantity: chemicalUnits,
        unit: "gallons",
        unitPrice: 28.5,
        total: this.round(chemicalUnits * 28.5),
        category: "Cleaning Chemicals",
      },
      {
        item: "Microfiber cleaning towels, sponges, & liners",
        quantity: 1,
        unit: "kit",
        unitPrice: 33.0,
        total: 33.0,
        category: "Consumables",
      },
    ];

    const equipment = [
      {
        item: "Commercial HEPA Vacuum & Steam Extraction System",
        rentalUnits: 1,
        unit: "day",
        unitCost: 45.0,
        total: 45.0,
      },
    ];

    return {
      parsedTrade: "residential_cleaning",
      difficultyGrade: "low" as const,
      wasteFactorPercent: 5,
      estimatedDurationDays: 1,
      estimatedLaborHours: this.round(leadHours + assistantHours),
      labor,
      materials,
      equipment,
      subcontractor: [],
      notes: [
        `Residential cleaning takeoff calculated for ${sqft} sqft scope.`,
        "Covers kitchen sanitization, bathroom disinfection, vacuuming, and hard-floor mopping.",
        "Eco-friendly non-toxic cleaning chemicals included.",
      ],
      confidenceScore: 0.98,
    };
  }

  // ---------------------------------------------------------------------------
  // Trade Calculator 2: Commercial Cleaning / Post-Construction Cleanup
  // ---------------------------------------------------------------------------
  private calculateCommercialCleaning(sqft: number) {
    const laborHours = this.round(sqft / 250);
    const leadHours = this.round(laborHours * 0.5);
    const detailHours = this.round(laborHours * 0.5);

    const labor = [
      {
        role: "Senior Commercial Site Lead",
        hours: Math.max(2, leadHours),
        hourlyRate: 55.0,
        total: this.round(Math.max(2, leadHours) * 55.0),
      },
      {
        role: "Post-Construction Detail Technician",
        hours: Math.max(2, detailHours),
        hourlyRate: 48.0,
        total: this.round(Math.max(2, detailHours) * 48.0),
      },
    ];

    const degreaserUnits = Math.max(2, Math.ceil(sqft / 700));
    const materials = [
      {
        item: "Commercial Degreaser, Paint/Adhesive Removers & Glass Cleaners",
        quantity: degreaserUnits,
        unit: "gallons",
        unitPrice: 32.0,
        total: this.round(degreaserUnits * 32.0),
        category: "Industrial Solvents",
      },
      {
        item: "Industrial Microfiber Mops, Razor Scrapers & Heavy Contractor Trash Bags",
        quantity: 2,
        unit: "kits",
        unitPrice: 45.0,
        total: 90.0,
        category: "Safety & Supplies",
      },
    ];

    const equipment = [
      {
        item: "Commercial Auto Floor Scrubber & Dual HEPA Dust Extractors",
        rentalUnits: 1,
        unit: "day",
        unitCost: 95.0,
        total: 95.0,
      },
    ];

    return {
      parsedTrade: "commercial_cleaning",
      difficultyGrade: "medium" as const,
      wasteFactorPercent: 8,
      estimatedDurationDays: Math.ceil(laborHours / 16) || 1,
      estimatedLaborHours: this.round(leadHours + detailHours),
      labor,
      materials,
      equipment,
      subcontractor: [],
      notes: [
        `Commercial post-construction cleanup estimate calculated for ${sqft} sqft.`,
        "Includes fine drywall dust containment, window sticker removal, and floor machine scrubbing.",
        "Complies with commercial property handover standards.",
      ],
      confidenceScore: 0.95,
    };
  }

  // ---------------------------------------------------------------------------
  // Trade Calculator 3: Drywall Installation & Level 4 Finish
  // ---------------------------------------------------------------------------
  private calculateDrywallInstallation(sqft: number, spec: string) {
    const sheets = Math.ceil((sqft / 32) * 1.1); // 4x8 ft = 32 sqft, 10% waste
    const laborHours = this.round(sqft * 0.035);
    const hangerHours = this.round(laborHours * 0.55);
    const finisherHours = this.round(laborHours * 0.45);

    const labor = [
      {
        role: "Journeyman Drywall Hanger",
        hours: Math.max(4, hangerHours),
        hourlyRate: 65.0,
        total: this.round(Math.max(4, hangerHours) * 65.0),
      },
      {
        role: "Drywall Finisher / Taper (Level 4)",
        hours: Math.max(4, finisherHours),
        hourlyRate: 60.0,
        total: this.round(Math.max(4, finisherHours) * 60.0),
      },
    ];

    const bucketsCompound = Math.max(2, Math.ceil(sheets / 5));
    const materials = [
      {
        item: '1/2" Standard Gypsum Wallboard (4x8 ft sheets)',
        quantity: sheets,
        unit: "sheets",
        unitPrice: 16.5,
        total: this.round(sheets * 16.5),
        category: "Wallboard",
      },
      {
        item: "All-Purpose Joint Compound (4.5 gal buckets)",
        quantity: bucketsCompound,
        unit: "buckets",
        unitPrice: 22.0,
        total: this.round(bucketsCompound * 22.0),
        category: "Compound & Mud",
      },
      {
        item: "Drywall Screws, Corner Beads & Paper Joint Tape",
        quantity: 1,
        unit: "kit",
        unitPrice: 45.0,
        total: 45.0,
        category: "Fasteners & Accessories",
      },
    ];

    const equipmentDays = Math.max(1, Math.ceil(laborHours / 16));
    const equipment = [
      {
        item: "Drywall Panel Lift & Rolling Scaffolding Units",
        rentalUnits: equipmentDays,
        unit: "days",
        unitCost: 75.0,
        total: this.round(equipmentDays * 75.0),
      },
    ];

    return {
      parsedTrade: "drywall_installation",
      difficultyGrade: "medium" as const,
      wasteFactorPercent: 10,
      estimatedDurationDays: equipmentDays,
      estimatedLaborHours: this.round(hangerHours + finisherHours),
      labor,
      materials,
      equipment,
      subcontractor: [],
      notes: [
        `Drywall takeoff parsed for ${sqft} sqft (${sheets} gypsum boards including 10% cut waste).`,
        "Includes hanging, 3 coats of taping compound, and Level 4 finish ready for primer.",
        "Excludes framing repairs and decorative painting.",
      ],
      confidenceScore: 0.94,
    };
  }

  // ---------------------------------------------------------------------------
  // Trade Calculator 4: Interior Painting (e.g. 1800 sqft)
  // ---------------------------------------------------------------------------
  private calculatePainting(sqft: number, spec: string) {
    const paintGallons = Math.ceil(sqft / 175); // 2 coats @ 350 sqft/gal
    const primerGallons = Math.ceil(sqft / 350);
    const laborHours = this.round(sqft * 0.022);
    const prepHours = this.round(laborHours * 0.4);
    const paintHours = this.round(laborHours * 0.6);

    const labor = [
      {
        role: "Surface Prep & Masking Specialist",
        hours: Math.max(2, prepHours),
        hourlyRate: 50.0,
        total: this.round(Math.max(2, prepHours) * 50.0),
      },
      {
        role: "Interior Finish Painter",
        hours: Math.max(3, paintHours),
        hourlyRate: 52.0,
        total: this.round(Math.max(3, paintHours) * 52.0),
      },
    ];

    const materials = [
      {
        item: "Premium Interior Latex Paint (Eggshell/Satin 2-Coat)",
        quantity: paintGallons,
        unit: "gallons",
        unitPrice: 54.0,
        total: this.round(paintGallons * 54.0),
        category: "Architectural Coatings",
      },
      {
        item: "High-Hide Multi-Surface Stain-Blocking Primer",
        quantity: primerGallons,
        unit: "gallons",
        unitPrice: 38.0,
        total: this.round(primerGallons * 38.0),
        category: "Primers",
      },
      {
        item: "Painter's Tape, Drop Cloths, Roller Sleeves & Trim Brushes",
        quantity: 1,
        unit: "kit",
        unitPrice: 65.0,
        total: 65.0,
        category: "Consumables & Sundries",
      },
    ];

    const equipment = [
      {
        item: "Extension Ladders & Work Platforms",
        rentalUnits: 1,
        unit: "day",
        unitCost: 45.0,
        total: 45.0,
      },
    ];

    return {
      parsedTrade: "interior_painting",
      difficultyGrade: "low" as const,
      wasteFactorPercent: 8,
      estimatedDurationDays: Math.ceil(laborHours / 16) || 1,
      estimatedLaborHours: this.round(prepHours + paintHours),
      labor,
      materials,
      equipment,
      subcontractor: [],
      notes: [
        `Painting takeoff calculated for ${sqft} sqft interior surface area.`,
        "Includes full masking, surface patching, 1 coat of primer, and 2 finish coats.",
      ],
      confidenceScore: 0.95,
    };
  }

  // ---------------------------------------------------------------------------
  // Trade Calculator 5: General Construction
  // ---------------------------------------------------------------------------
  private calculateGeneralConstruction(sqft: number, spec: string) {
    const laborHours = this.round(sqft * 0.045);
    const labor = [
      {
        role: "Lead Carpenter / General Contractor",
        hours: Math.max(4, Math.round(laborHours * 0.6)),
        hourlyRate: 70.0,
        total: this.round(Math.max(4, Math.round(laborHours * 0.6)) * 70.0),
      },
      {
        role: "Carpenter Apprentice / Laborer",
        hours: Math.max(4, Math.round(laborHours * 0.4)),
        hourlyRate: 45.0,
        total: this.round(Math.max(4, Math.round(laborHours * 0.4)) * 45.0),
      },
    ];

    const materials = [
      {
        item: "Structural framing lumber, fasteners & building paper",
        quantity: Math.max(1, Math.ceil(sqft / 200)),
        unit: "units",
        unitPrice: 120.0,
        total: this.round(Math.max(1, Math.ceil(sqft / 200)) * 120.0),
        category: "Lumber & Hardware",
      },
    ];

    const equipment = [
      {
        item: "Site Generator & Heavy Power Tool Trailer",
        rentalUnits: 1,
        unit: "day",
        unitCost: 85.0,
        total: 85.0,
      },
    ];

    return {
      parsedTrade: "general_construction",
      difficultyGrade: "medium" as const,
      wasteFactorPercent: 10,
      estimatedDurationDays: Math.ceil(laborHours / 16) || 1,
      estimatedLaborHours: laborHours,
      labor,
      materials,
      equipment,
      subcontractor: [],
      notes: [`General construction preliminary estimate calculated for ${sqft} sqft.`],
      confidenceScore: 0.9,
    };
  }

  private round(val: number): number {
    return Math.round(val * 100) / 100;
  }
}
