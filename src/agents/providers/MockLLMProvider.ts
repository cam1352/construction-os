import { z } from "zod";
import {
  ILLMProvider,
  LLMChatMessage,
  LLMCompletionOptions,
  LLMChatOptions,
  LLMStructuredOptions,
  LLMCompletionResponse,
  LLMChatResponse,
  LLMStructuredResponse,
} from "./ILLMProvider.js";

/**
 * Strictly Zero-API deterministic offline LLM provider.
 * Implements trade heuristics, takeoff math, and intent parsing without external API keys.
 */
export class MockLLMProvider implements ILLMProvider {
  public readonly id = "mock-offline";
  public readonly name = "Deterministic Offline Heuristic Provider";
  public readonly isOffline = true;

  private readonly simulatedLatencyMs: number;

  constructor(simulatedLatencyMs = 5) {
    this.simulatedLatencyMs = simulatedLatencyMs;
  }

  private async simulateDelay(): Promise<void> {
    if (this.simulatedLatencyMs > 0) {
      await new Promise((r) => setTimeout(r, this.simulatedLatencyMs));
    }
  }

  public async generateCompletion(
    prompt: string,
    _options?: LLMCompletionOptions
  ): Promise<LLMCompletionResponse> {
    const startTime = Date.now();
    await this.simulateDelay();

    const cleanPrompt = prompt.trim();
    let text = `[Mock Offline Completion]: Generated response for request.`;

    if (/drywall|cleaning|painting|remodel/i.test(cleanPrompt)) {
      text = `Estimated scope identified in prompt: ${cleanPrompt.slice(0, 80)}. Project calculations verified.`;
    }

    const durationMs = Date.now() - startTime;
    return {
      text,
      usage: { promptTokens: 40, completionTokens: 30, totalTokens: 70 },
      model: "mock-trade-v1",
      provider: this.id,
      durationMs,
      finishReason: "stop",
    };
  }

  public async generateChatResponse(
    messages: LLMChatMessage[],
    _options?: LLMChatOptions
  ): Promise<LLMChatResponse> {
    const startTime = Date.now();
    await this.simulateDelay();

    const userMessage = messages.filter((m) => m.role === "user").pop()?.content || "";
    const responseText = `Thank you for your inquiry regarding our construction services. We have processed: "${userMessage.slice(0, 60)}" and are ready to assist.`;

    const durationMs = Date.now() - startTime;
    return {
      message: {
        role: "assistant",
        content: responseText,
      },
      usage: { promptTokens: 60, completionTokens: 40, totalTokens: 100 },
      model: "mock-trade-chat-v1",
      provider: this.id,
      durationMs,
      finishReason: "stop",
    };
  }

  public async extractStructuredData<T>(
    promptOrMessages: string | LLMChatMessage[],
    schema: z.ZodSchema<T>,
    _options?: LLMStructuredOptions
  ): Promise<LLMStructuredResponse<T>> {
    const startTime = Date.now();
    await this.simulateDelay();

    let combinedText = "";
    if (typeof promptOrMessages === "string") {
      combinedText = promptOrMessages;
    } else {
      combinedText = promptOrMessages.map((m) => `${m.role}: ${m.content}`).join("\n");
    }

    let rawData: unknown;

    // Route to specialized heuristic based on prompt keywords
    if (/cleaning|drywall|painting|flooring|sqft|takeoff|estimate/i.test(combinedText)) {
      rawData = this.generateEstimatingTakeoff(combinedText);
    } else if (/inbound|sales|lead|re:|\@|dear|quote request/i.test(combinedText)) {
      rawData = this.generateSalesDraft(combinedText);
    } else if (/spam|lottery|viagra|crypto|triage/i.test(combinedText)) {
      rawData = this.generateInboxTriage(combinedText);
    } else if (/seo|blog|post|article|keywords/i.test(combinedText)) {
      rawData = this.generateSEOBlog(combinedText);
    } else {
      rawData = {
        message: "Heuristic extraction completed",
        rawInputSummary: combinedText.slice(0, 100),
      };
    }

    // Strict validation against provided schema
    const parsed = schema.safeParse(rawData);
    if (!parsed.success) {
      throw new Error(
        `MockLLMProvider heuristic output failed schema validation: ${parsed.error.message}`
      );
    }

    const durationMs = Date.now() - startTime;
    return {
      data: parsed.data,
      rawText: JSON.stringify(parsed.data),
      usage: { promptTokens: 150, completionTokens: 250, totalTokens: 400 },
      model: "mock-heuristic-v1",
      provider: this.id,
      durationMs,
    };
  }

  // ---------------------------------------------------------------------------
  // CONSTRUCTION ESTIMATING HEURISTIC (1500 sqft cleaning, drywall, painting)
  // ---------------------------------------------------------------------------
  public generateEstimatingTakeoff(text: string): Record<string, unknown> {
    const sqftMatch = text.match(/(\d+[\d,]*)\s*(?:sqft|sq\s*ft|square\s*feet|SF)/i);
    const sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, ""), 10) : 1500;

    const isCleaning = /cleaning|clean|janitorial|turnover|sanitiz/i.test(text);
    const isDrywall = /drywall|sheetrock|gypsum/i.test(text);
    const isPainting = /painting|paint|stain/i.test(text);

    if (isCleaning) {
      const laborHours = Math.round((sqft / 350) * 10) / 10;
      const leadHours = Math.round(laborHours * 0.5 * 10) / 10;
      const cleanerHours = Math.round(laborHours * 0.5 * 10) / 10;
      const leadCost = Math.round(leadHours * 55.0 * 100) / 100;
      const cleanerCost = Math.round(cleanerHours * 45.0 * 100) / 100;
      const laborSubtotal = Math.round((leadCost + cleanerCost) * 100) / 100;

      const chemicalsCost = Math.round(Math.max(1, Math.ceil(sqft / 1000)) * 28.5 * 100) / 100;
      const consumablesCost = 25.0;
      const materialsSubtotal = Math.round((chemicalsCost + consumablesCost) * 100) / 100;

      const equipmentSubtotal = 45.0;
      const contingency = Math.round((laborSubtotal + materialsSubtotal) * 0.05 * 100) / 100;
      const subtotal =
        Math.round((laborSubtotal + materialsSubtotal + equipmentSubtotal + contingency) * 100) /
        100;
      const taxRate = 0.0825;
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
      const total = Math.round((subtotal + taxAmount) * 100) / 100;

      return {
        jobMetadata: {
          parsedTrade: "residential_cleaning",
          parsedDimensions: {
            quantity: sqft,
            unit: "sqft",
            rawText: `${sqft} sqft`,
          },
          estimatedDurationDays: Math.max(1, Math.ceil(laborHours / 8)),
          estimatedLaborHours: laborHours,
          difficultyGrade: "medium",
          wasteFactorPercent: 5,
        },
        costBreakdown: {
          materials: [
            {
              name: "Eco-friendly disinfectant & surface cleaners",
              quantity: Math.max(1, Math.ceil(sqft / 1000)),
              unit: "gallons",
              unitCost: 28.5,
              totalCost: chemicalsCost,
              category: "Chemicals",
            },
            {
              name: "Microfiber cloths, sponges & trash liners",
              quantity: 1,
              unit: "kit",
              unitCost: consumablesCost,
              totalCost: consumablesCost,
              category: "Consumables",
            },
          ],
          materialsSubtotal,
          labor: [
            {
              role: "Lead Cleaning Specialist",
              hours: leadHours,
              hourlyRate: 55.0,
              totalCost: leadCost,
            },
            {
              role: "General Cleaner",
              hours: cleanerHours,
              hourlyRate: 45.0,
              totalCost: cleanerCost,
            },
          ],
          laborSubtotal,
          equipment: [
            {
              item: "Commercial HEPA Vacuum & Steam Cleaning Kit",
              rentalDaysOrHours: 1,
              unitRate: 45.0,
              totalCost: 45.0,
            },
          ],
          equipmentSubtotal,
          contingency,
          subtotal,
          taxRate,
          taxAmount,
          total,
        },
        notes: [
          `Estimated based on ${sqft} sqft residential deep cleaning scope.`,
          "Includes interior window sills, baseboards, kitchens, and sanitized bathrooms.",
          "Excludes hazardous material abatement and exterior pressure washing.",
        ],
        confidenceScore: 0.95,
      };
    } else if (isDrywall) {
      const sheets = Math.ceil((sqft / 32) * 1.1);
      const sheetCost = Math.round(sheets * 16.5 * 100) / 100;
      const compoundBuckets = Math.max(2, Math.ceil(sheets / 5));
      const compoundCost = Math.round(compoundBuckets * 22.0 * 100) / 100;
      const screwsCost = 35.0;
      const materialsSubtotal = Math.round((sheetCost + compoundCost + screwsCost) * 100) / 100;

      const laborHours = Math.round(sqft * 0.035 * 10) / 10;
      const hangerHours = Math.round(laborHours * 0.55 * 10) / 10;
      const taperHours = Math.round(laborHours * 0.45 * 10) / 10;
      const hangerCost = Math.round(hangerHours * 65.0 * 100) / 100;
      const taperCost = Math.round(taperHours * 60.0 * 100) / 100;
      const laborSubtotal = Math.round((hangerCost + taperCost) * 100) / 100;

      const equipmentSubtotal = 75.0;
      const contingency = Math.round((materialsSubtotal + laborSubtotal) * 0.08 * 100) / 100;
      const subtotal =
        Math.round((materialsSubtotal + laborSubtotal + equipmentSubtotal + contingency) * 100) /
        100;
      const taxRate = 0.0825;
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
      const total = Math.round((subtotal + taxAmount) * 100) / 100;

      return {
        jobMetadata: {
          parsedTrade: "drywall_installation",
          parsedDimensions: {
            quantity: sqft,
            unit: "sqft",
            rawText: `${sqft} sqft`,
          },
          estimatedDurationDays: Math.max(1, Math.ceil(laborHours / 16)),
          estimatedLaborHours: laborHours,
          difficultyGrade: "medium",
          wasteFactorPercent: 10,
        },
        costBreakdown: {
          materials: [
            {
              name: '1/2" Standard Gypsum Wallboard (4x8 ft)',
              quantity: sheets,
              unit: "sheets",
              unitCost: 16.5,
              totalCost: sheetCost,
              category: "Sheetrock",
            },
            {
              name: "All-Purpose Joint Compound (4.5 gal bucket)",
              quantity: compoundBuckets,
              unit: "buckets",
              unitCost: 22.0,
              totalCost: compoundCost,
              category: "Compound & Tape",
            },
            {
              name: "Drywall Screws & Paper Joint Tape Kit",
              quantity: 1,
              unit: "kit",
              unitCost: screwsCost,
              totalCost: screwsCost,
              category: "Fasteners",
            },
          ],
          materialsSubtotal,
          labor: [
            {
              role: "Journeyman Drywall Hanger",
              hours: hangerHours,
              hourlyRate: 65.0,
              totalCost: hangerCost,
            },
            {
              role: "Drywall Finisher / Taper (Level 4)",
              hours: taperHours,
              hourlyRate: 60.0,
              totalCost: taperCost,
            },
          ],
          laborSubtotal,
          equipment: [
            {
              item: "Drywall Panel Lift & Scaffolding Rental",
              rentalDaysOrHours: Math.max(1, Math.ceil(laborHours / 16)),
              unitRate: 75.0,
              totalCost: equipmentSubtotal,
            },
          ],
          equipmentSubtotal,
          contingency,
          subtotal,
          taxRate,
          taxAmount,
          total,
        },
        notes: [
          `Estimate includes hanging, taping, and Level 4 finish ready for primer.`,
          `Includes 10% waste factor for ${sheets} total sheets.`,
          "Excludes framing repairs and final decorative painting.",
        ],
        confidenceScore: 0.94,
      };
    } else {
      // General construction default
      const materialsSubtotal = Math.round(sqft * 0.75 * 100) / 100;
      const laborHours = Math.round(sqft * 0.025 * 10) / 10;
      const laborSubtotal = Math.round(laborHours * 55.0 * 100) / 100;
      const equipmentSubtotal = 50.0;
      const contingency = Math.round((materialsSubtotal + laborSubtotal) * 0.05 * 100) / 100;
      const subtotal =
        Math.round((materialsSubtotal + laborSubtotal + equipmentSubtotal + contingency) * 100) /
        100;
      const taxRate = 0.0825;
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
      const total = Math.round((subtotal + taxAmount) * 100) / 100;

      return {
        jobMetadata: {
          parsedTrade: isPainting ? "interior_painting" : "general_construction",
          parsedDimensions: {
            quantity: sqft,
            unit: "sqft",
            rawText: `${sqft} sqft`,
          },
          estimatedDurationDays: Math.max(1, Math.ceil(laborHours / 8)),
          estimatedLaborHours: laborHours,
          difficultyGrade: "standard",
          wasteFactorPercent: 8,
        },
        costBreakdown: {
          materials: [
            {
              name: "Standard Trade Materials & Supplies",
              quantity: 1,
              unit: "lot",
              unitCost: materialsSubtotal,
              totalCost: materialsSubtotal,
              category: "Materials",
            },
          ],
          materialsSubtotal,
          labor: [
            {
              role: "Lead Field Technician",
              hours: laborHours,
              hourlyRate: 55.0,
              totalCost: laborSubtotal,
            },
          ],
          laborSubtotal,
          equipment: [
            {
              item: "Trade Tools & Support Equipment",
              rentalDaysOrHours: 1,
              unitRate: equipmentSubtotal,
              totalCost: equipmentSubtotal,
            },
          ],
          equipmentSubtotal,
          contingency,
          subtotal,
          taxRate,
          taxAmount,
          total,
        },
        notes: [`Standard trade takeoff calculation for ${sqft} sqft.`],
        confidenceScore: 0.9,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // SALES AGENT HEURISTICS
  // ---------------------------------------------------------------------------
  public generateSalesDraft(text: string): Record<string, unknown> {
    const customerNameMatch =
      text.match(/(?:customerName|name|from)\s*["':=]+\s*([^"',\n]+)/i) ||
      text.match(/(?:Sarah\s+Jenkins|John\s+Doe|Michael\s+Smith)/i);
    const customerName = customerNameMatch ? customerNameMatch[1].trim() : "Valued Customer";

    const subjectMatch = text.match(/(?:subject)\s*["':=]+\s*([^"',\n]+)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : "Project Consultation";

    const isUrgent = /urgent|emergency|asap|immediately|by friday/i.test(text);
    const isCommercial = /commercial|office|warehouse|facility/i.test(text);

    return {
      analysis: {
        intent: "quote_request",
        urgency: isUrgent ? "high" : "medium",
        sentiment: "positive",
        projectScopeSummary: `Inquiry regarding ${isCommercial ? "commercial facility" : "residential"} scope from ${customerName}.`,
        identifiedRequirements: [
          "Detailed dimensional takeoff assessment",
          "Schedule consultation walkthrough",
          "Itemized proposal delivery",
        ],
        leadScore: isUrgent ? 90 : 85,
      },
      draftResponse: {
        subject: `Re: ${subject} — Consultation & Next Steps`,
        salutation: `Dear ${customerName},`,
        body: `Thank you for reaching out to Walker General Contractors regarding your upcoming project. We would be delighted to assist you with your requirements.\n\nTo ensure we provide an accurate, transparent, and comprehensive estimate, we would love to schedule a quick on-site walkthrough or scoping call.\n\nPlease let us know if you have availability this week, or feel free to book directly using our online scheduler.`,
        signOff: "Best regards,\nWalker General Contractors Team",
        suggestedSendTime: new Date(Date.now() + 3600000).toISOString(),
        requiresHumanReview: false,
      },
      crmActionItems: [
        {
          type: "update_lead_status",
          priority: "high",
          details: { status: "QUALIFIED_PROSPECT", previousStatus: "NEW" },
          dueDate: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          type: "schedule_site_visit",
          priority: isUrgent ? "high" : "medium",
          details: { suggestedDate: "Within 2 business days" },
          dueDate: new Date(Date.now() + 172800000).toISOString(),
        },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // INBOX TRIAGE HEURISTICS (Spam vs Legitimate Lead)
  // ---------------------------------------------------------------------------
  public generateInboxTriage(text: string): Record<string, unknown> {
    const isSpam = /lottery|won \$|claim prize|crypto|wire transfer|viagra|click here/i.test(
      text
    );
    return {
      isSpam,
      spamScore: isSpam ? 0.98 : 0.04,
      classification: isSpam ? "SPAM" : "LEGITIMATE",
      detectedSignals: isSpam
        ? ["Unsolicited monetary claim", "Suspicious link / call-to-action"]
        : ["Valid trade project inquiry"],
      recommendedAction: isSpam ? "DELETE" : "PROCESS_INBOX",
    };
  }

  // ---------------------------------------------------------------------------
  // SEO BLOG GENERATOR HEURISTICS
  // ---------------------------------------------------------------------------
  public generateSEOBlog(text: string): Record<string, unknown> {
    const topicMatch = text.match(/(?:topic|subject)\s*["':=]+\s*([^"',\n]+)/i);
    const rawTopic = topicMatch ? topicMatch[1].trim() : "Commercial Cleaning Excellence";

    const cityMatch = text.match(/(?:city|location)\s*["':=]+\s*([^"',\n]+)/i);
    const city = cityMatch ? cityMatch[1].trim() : "Vancouver";

    const slug = `${rawTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${city.toLowerCase()}`.replace(
      /^-|-$/g,
      ""
    );
    const title = `${rawTopic} in ${city}: The Complete 2026 Guide`;
    const metaDescription = `Looking for premier ${rawTopic.toLowerCase()} services in ${city}? Discover expert tips, trade insights, and comprehensive solutions.`;

    const markdownContent = `# ${title}

## Introduction
Maintaining exceptional standards in construction and facility maintenance is critical for businesses and property owners in ${city}. Whether you are coordinating a large-scale commercial fitout, managing an active renovation, or seeking scheduled turnover services, professional execution guarantees longevity and safety.

## Key Considerations for ${city} Properties
1. **Compliance with Local Standards**: Ensure all operations conform to regional safety codes and environmental standards.
2. **Quality Material Selection**: Utilizing commercial-grade consumables and verified installation techniques ensures lasting durability.
3. **Transparent Estimating**: Accurate dimensional takeoffs and itemized cost breakdowns prevent costly schedule delays and mid-project budget overruns.

## Frequently Asked Questions
### How quickly can a consultation or estimate be scheduled?
Our team typically schedules on-site assessments within 24 to 48 hours throughout ${city} and surrounding areas.

### Are all contractors licensed and insured?
Yes, all trade specialists adhere strictly to comprehensive liability and safety protocols.

## Contact Us Today
Get in touch with our team today to discuss your next project in ${city}.
`;

    return {
      slug,
      title,
      metaDescription,
      markdownContent,
      targetFilePath: `content/blogs/${slug}.md`,
      scheduledPublishDate: new Date(Date.now() + 86400000).toISOString(),
      status: "generated",
    };
  }
}
