import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { BaseAgent } from "../core/BaseAgent.js";
import type { AgentContext } from "../core/types.js";
import { EmailSimulator } from "../providers/Simulators.js";
import { prisma as defaultPrisma } from "../../lib/prisma.js";

// =============================================================================
// 1. Zod Schemas & TypeScript Types
// =============================================================================

export const SalesAgentInputSchema = z.object({
  senderEmail: z.string().email("Valid sender email is required"),
  senderName: z.string().min(1, "Sender name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  projectId: z.string().optional(),
  customerHistory: z
    .object({
      pastJobsCount: z.number().default(0),
      totalSpend: z.number().default(0),
      status: z.string().default("NEW_LEAD"),
      notes: z.array(z.string()).default([]),
    })
    .optional(),
  autonomousSend: z.boolean().default(true),
  channel: z.enum(["EMAIL", "SMS", "WEB_FORM"]).default("EMAIL"),
});

export type SalesAgentInput = z.infer<typeof SalesAgentInputSchema>;

export const SalesAgentOutputSchema = z.object({
  triage: z.object({
    isSpam: z.boolean(),
    spamReason: z.string().optional(),
    triageAction: z.enum(["PROCESS_LEAD", "PURGE_SPAM", "FLAG_REVIEW"]),
    leadPriority: z.enum(["HIGH_VALUE", "STANDARD", "LOW", "SPAM"]),
  }),
  analysis: z.object({
    intent: z.enum([
      "QUOTE_REQUEST",
      "SCHEDULE_SERVICE",
      "JOB_STATUS",
      "COMPLAINT",
      "GENERAL_INQUIRY",
      "SPAM",
    ]),
    urgency: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]),
    urgencyScore: z.number().min(1).max(10),
    sentiment: z.enum(["POSITIVE", "NEUTRAL", "URGENT", "FRUSTRATED", "NEGATIVE"]),
    projectScopeSummary: z.string(),
    identifiedRequirements: z.array(z.string()),
    leadScore: z.number().min(0).max(100),
  }),
  draftResponse: z.object({
    subject: z.string(),
    salutation: z.string(),
    body: z.string(),
    signOff: z.string(),
    fullEmailText: z.string(),
    requiresHumanReview: z.boolean(),
  }),
  proposedActions: z.array(
    z.object({
      type: z.enum([
        "UPDATE_LEAD_STATUS",
        "SCHEDULE_SITE_VISIT",
        "CREATE_TASK",
        "ASSIGN_SALES_REP",
        "TAG_CUSTOMER",
        "DISCARD_COMMUNICATION",
      ]),
      priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
      payload: z.record(z.any()),
      dueDate: z.string().optional(),
    })
  ),
  outboundDelivery: z
    .object({
      dispatched: z.boolean(),
      deliveryMethod: z.enum(["EMAIL_SIMULATOR", "NONE"]),
      messageId: z.string().optional(),
      communicationLogId: z.string().optional(),
      sentAt: z.string().optional(),
      error: z.string().optional(),
    })
    .optional(),
});

export type SalesAgentOutput = z.infer<typeof SalesAgentOutputSchema>;

// =============================================================================
// 2. SalesAgent Class Implementation
// =============================================================================

export class SalesAgent extends BaseAgent<SalesAgentInput, SalesAgentOutput> {
  public readonly id = "sales_agent";
  public readonly name = "Sales & Customer Communication Agent";
  public readonly version = "1.0.0";
  public readonly description =
    "Ingests inbound customer inquiries, performs inbox triage (spam filtration & lead prioritization), evaluates intent, drafts context-aware responses, autonomously dispatches emails via EmailSimulator, and generates structured CRM actions.";
  public readonly agentType = "SALES";

  protected readonly inputSchema = SalesAgentInputSchema;
  protected readonly outputSchema = SalesAgentOutputSchema;

  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    super();
    this.prisma = prismaClient ?? defaultPrisma;
  }

  /**
   * Framework execution hook conforming to BaseAgent lifecycle.
   */
  protected async execute(
    input: SalesAgentInput,
    context: AgentContext
  ): Promise<SalesAgentOutput> {
    const {
      senderEmail,
      senderName,
      subject,
      body,
      customerId,
      leadId,
      projectId,
      customerHistory,
      autonomousSend = true,
    } = input;

    // -------------------------------------------------------------------------
    // STEP 1: Inbox Triage & Spam Detection
    // -------------------------------------------------------------------------
    const spamCheck = this.evaluateSpam(senderEmail, subject, body);

    if (spamCheck.isSpam) {
      context.logger?.info(
        `[SalesAgent] Inbound message from ${senderEmail} flagged as SPAM: ${spamCheck.reason}`
      );

      const triageResult: SalesAgentOutput = {
        triage: {
          isSpam: true,
          spamReason: spamCheck.reason,
          triageAction: "PURGE_SPAM",
          leadPriority: "SPAM",
        },
        analysis: {
          intent: "SPAM",
          urgency: "LOW",
          urgencyScore: 1,
          sentiment: "NEGATIVE",
          projectScopeSummary: `Spam/Unwanted email: ${spamCheck.reason}`,
          identifiedRequirements: [],
          leadScore: 0,
        },
        draftResponse: {
          subject: "",
          salutation: "",
          body: "Email classified as spam or unwanted solicitation. Purged without outbound response.",
          signOff: "",
          fullEmailText: "",
          requiresHumanReview: false,
        },
        proposedActions: [
          {
            type: "DISCARD_COMMUNICATION",
            priority: "LOW",
            payload: {
              reason: spamCheck.reason,
              senderEmail,
              purgedAt: new Date().toISOString(),
            },
          },
        ],
        outboundDelivery: {
          dispatched: false,
          deliveryMethod: "NONE",
        },
      };

      // Persist purge audit in CommunicationLog if leadId or customerId exists
      if (this.prisma && (leadId || customerId)) {
        try {
          await this.prisma.communicationLog.create({
            data: {
              channel: "EMAIL",
              direction: "INBOUND",
              sender: senderEmail,
              recipient: "inbox@walkercontractors.com",
              subject: `[SPAM PURGED] ${subject}`,
              body,
              sentiment: "NEGATIVE",
              aiGenerated: true,
              agentId: this.id,
              status: "FAILED",
              leadId: leadId || undefined,
              customerId: customerId || undefined,
            },
          });
        } catch (dbErr: any) {
          context.logger?.warn(
            `[SalesAgent] Notice: CommunicationLog audit skipped (${dbErr.message})`
          );
        }
      }

      return triageResult;
    }

    // -------------------------------------------------------------------------
    // STEP 2: Intent, Sentiment & Urgency Analysis
    // -------------------------------------------------------------------------
    const combinedText = `${subject} ${body}`.toLowerCase();

    // Urgency heuristic
    const isUrgent =
      /\b(urgent|asap|emergency|by friday|by tomorrow|immediately|time-sensitive|rush|quick|tight deadline)\b/i.test(
        combinedText
      );
    const isEmergency = /\b(emergency|flooding|burst pipe|hazard|collapse)\b/i.test(
      combinedText
    );

    let urgency: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY" = "LOW";
    let urgencyScore = 3;
    if (isEmergency) {
      urgency = "EMERGENCY";
      urgencyScore = 10;
    } else if (isUrgent) {
      urgency = "HIGH";
      urgencyScore = 9;
    } else if (/\b(this week|next week|soon|schedule)\b/i.test(combinedText)) {
      urgency = "MEDIUM";
      urgencyScore = 6;
    }

    // Intent heuristic
    let intent:
      | "QUOTE_REQUEST"
      | "SCHEDULE_SERVICE"
      | "JOB_STATUS"
      | "COMPLAINT"
      | "GENERAL_INQUIRY" = "GENERAL_INQUIRY";

    if (
      /\b(quote|estimate|cost|pricing|how much|bid|proposal|walkthrough|takeoff|cleanup)\b/i.test(
        combinedText
      )
    ) {
      intent = "QUOTE_REQUEST";
    } else if (
      /\b(schedule|book|appointment|calendar|availability|start date)\b/i.test(
        combinedText
      )
    ) {
      intent = "SCHEDULE_SERVICE";
    } else if (
      /\b(status|progress|update on|invoice|payment|work order|delivery)\b/i.test(
        combinedText
      )
    ) {
      intent = "JOB_STATUS";
    } else if (
      /\b(unhappy|defect|issue|problem|delay|frustrated|refund|damage)\b/i.test(
        combinedText
      )
    ) {
      intent = "COMPLAINT";
    }

    // Sentiment heuristic
    let sentiment: "POSITIVE" | "NEUTRAL" | "URGENT" | "FRUSTRATED" | "NEGATIVE" =
      "NEUTRAL";
    if (intent === "COMPLAINT") {
      sentiment = "FRUSTRATED";
    } else if (urgency === "HIGH" || urgency === "EMERGENCY") {
      sentiment = "URGENT";
    } else if (
      /\b(thank|appreciate|great|looking forward|excited|pleased)\b/i.test(
        combinedText
      )
    ) {
      sentiment = "POSITIVE";
    }

    // Lead scoring (0 - 100)
    let leadScore = 50;
    if (intent === "QUOTE_REQUEST") leadScore += 25;
    if (intent === "SCHEDULE_SERVICE") leadScore += 20;
    if (urgency === "HIGH" || urgency === "EMERGENCY") leadScore += 15;
    if (/\b(\d+[\d,]*\s*(sqft|sq\s*ft|square\s*feet|rooms))\b/i.test(combinedText)) {
      leadScore += 10;
    }
    if ((customerHistory?.pastJobsCount ?? 0) > 0) {
      leadScore += 10;
    }
    leadScore = Math.min(100, Math.max(10, leadScore));

    const leadPriority: "HIGH_VALUE" | "STANDARD" | "LOW" =
      leadScore >= 75 ? "HIGH_VALUE" : leadScore >= 45 ? "STANDARD" : "LOW";

    const scopeSummary = this.extractScopeSummary(combinedText, intent);
    const requirements = this.extractRequirements(combinedText);

    // -------------------------------------------------------------------------
    // STEP 3: Context-Aware Draft Response Generation
    // -------------------------------------------------------------------------
    const firstName = senderName.trim().split(" ")[0] || senderName;
    const salutation = `Dear ${firstName},`;
    const draftSubject = subject.toLowerCase().startsWith("re:")
      ? subject
      : `Re: ${subject} — Consultation & Next Steps`;

    let responseBody = "";
    if (intent === "QUOTE_REQUEST") {
      responseBody =
        `Thank you for contacting Walker General Contractors regarding your upcoming project${
          scopeSummary ? ` (${scopeSummary})` : ""
        }.\n\n` +
        (urgency === "HIGH" || urgency === "EMERGENCY"
          ? `We note that you have an urgent timeline for this work, and we have prioritized your inquiry with our lead operations team.\n\n`
          : "") +
        `To ensure we provide an accurate, transparent, and itemized proposal, our project estimator would like to review the site dimensions and specifications.\n\n` +
        `Our senior team has openings for an on-site walkthrough or introductory scoping call this week. Please let us know if mornings or afternoons work best for you, or feel free to book directly at https://consult.walkercontractors.com.\n\n` +
        `We look forward to partnering with you on this project.`;
    } else if (intent === "SCHEDULE_SERVICE") {
      responseBody =
        `Thank you for reaching out to schedule your service with Walker General Contractors.\n\n` +
        `We have verified team availability for your requested timeframe and would be delighted to lock in your date.\n\n` +
        `Please confirm your preferred start time or call our direct dispatch line at (604) 555-0199 to finalize your booking.\n\n` +
        `We appreciate your business!`;
    } else {
      responseBody =
        `Thank you for reaching out to Walker General Contractors.\n\n` +
        `We have received your inquiry regarding "${subject}" and our operations team is actively reviewing your specifications.\n\n` +
        `One of our project specialists will follow up directly within one business day. For immediate assistance, please call us directly at (604) 555-0199.`;
    }

    const signOff = `Best regards,\nWalker General Contractors Sales & Project Management Team\nDirect: (604) 555-0199 | sales@walkercontractors.com`;
    const fullEmailText = `${salutation}\n\n${responseBody}\n\n${signOff}`;

    // -------------------------------------------------------------------------
    // STEP 4: Structured CRM Action Items
    // -------------------------------------------------------------------------
    const proposedActions: SalesAgentOutput["proposedActions"] = [
      {
        type: "UPDATE_LEAD_STATUS",
        priority: leadPriority === "HIGH_VALUE" ? "HIGH" : "MEDIUM",
        payload: {
          leadId: leadId ?? null,
          status: "QUALIFIED",
          score: leadScore,
          intent,
          urgency,
        },
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      },
      {
        type: "SCHEDULE_SITE_VISIT",
        priority: urgency === "HIGH" ? "HIGH" : "MEDIUM",
        payload: {
          senderName,
          senderEmail,
          scopeSummary,
          suggestedWindow: urgency === "HIGH" ? "Within 24-48 hours" : "Within 3-5 business days",
        },
        dueDate: new Date(Date.now() + (urgency === "HIGH" ? 86400000 : 172800000)).toISOString(),
      },
      {
        type: "CREATE_TASK",
        priority: "MEDIUM",
        payload: {
          title: `Prepare preliminary scope packet for ${senderName}`,
          assignedRole: "Estimator",
          details: `Requirements: ${requirements.join("; ")}`,
        },
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      },
    ];

    // -------------------------------------------------------------------------
    // STEP 5: Autonomous Outbound Sending (EmailSimulator)
    // -------------------------------------------------------------------------
    let outboundDelivery: SalesAgentOutput["outboundDelivery"] = {
      dispatched: false,
      deliveryMethod: "NONE",
    };

    if (autonomousSend) {
      try {
        const deliveryResult = await EmailSimulator.sendEmail({
          to: senderEmail,
          from: "sales@walkercontractors.com",
          subject: draftSubject,
          body: fullEmailText,
          customerId,
          leadId,
          projectId,
          aiGenerated: true,
          agentId: this.id,
        });

        outboundDelivery = {
          dispatched: deliveryResult.success,
          deliveryMethod: "EMAIL_SIMULATOR",
          messageId: deliveryResult.messageId,
          communicationLogId: deliveryResult.communicationLogId,
          sentAt: deliveryResult.timestamp.toISOString(),
        };
      } catch (sendErr: any) {
        context.logger?.warn(
          `[SalesAgent] EmailSimulator dispatch notice: ${sendErr.message}`
        );
        outboundDelivery = {
          dispatched: false,
          deliveryMethod: "EMAIL_SIMULATOR",
          error: sendErr.message,
        };
      }
    }

    return {
      triage: {
        isSpam: false,
        triageAction: "PROCESS_LEAD",
        leadPriority,
      },
      analysis: {
        intent,
        urgency,
        urgencyScore,
        sentiment,
        projectScopeSummary: scopeSummary || `Inquiry regarding ${subject}`,
        identifiedRequirements: requirements,
        leadScore,
      },
      draftResponse: {
        subject: draftSubject,
        salutation,
        body: responseBody,
        signOff,
        fullEmailText,
        requiresHumanReview: false,
      },
      proposedActions,
      outboundDelivery,
    };
  }

  // ---------------------------------------------------------------------------
  // Helper: Spam Evaluation
  // ---------------------------------------------------------------------------
  private evaluateSpam(
    email: string,
    subject: string,
    body: string
  ): { isSpam: boolean; reason?: string } {
    const text = `${subject} ${body}`.toLowerCase();

    const spamKeywords = [
      "lottery",
      "you won",
      "million dollar",
      "$1,000,000",
      "wire transfer",
      "crypto investment",
      "bitcoin investment",
      "unclaimed funds",
      "nigerian prince",
      "viagra",
      "cialis",
      "casino",
      "free gift card",
      "work from home $5000",
      "click here to claim",
      "inheritance funds",
    ];

    for (const kw of spamKeywords) {
      if (text.includes(kw)) {
        return {
          isSpam: true,
          reason: `Flagged by spam keyword heuristic: "${kw}"`,
        };
      }
    }

    if (
      (text.includes("guest post") || text.includes("backlinks")) &&
      text.includes("seo")
    ) {
      return {
        isSpam: true,
        reason: "Unsolicited SEO/Guest post commercial marketing solicitation",
      };
    }

    return { isSpam: false };
  }

  // ---------------------------------------------------------------------------
  // Helper: Scope & Requirement Extraction
  // ---------------------------------------------------------------------------
  private extractScopeSummary(text: string, intent: string): string {
    const sqftMatch = text.match(/(\d+[\d,]*)\s*(?:sqft|sq\s*ft|square\s*feet|sf)/i);
    const sqft = sqftMatch ? `${sqftMatch[1]} sqft` : "";

    const tradeKeywords = [
      "post-construction cleanup",
      "post-construction cleaning",
      "commercial cleaning",
      "office cleaning",
      "residential cleaning",
      "drywall installation",
      "drywall",
      "painting",
      "bathroom remodel",
      "kitchen remodel",
      "flooring",
    ];

    const matchedTrade = tradeKeywords.find((t) => text.includes(t));

    if (matchedTrade && sqft) {
      return `${sqft} ${matchedTrade}`;
    } else if (matchedTrade) {
      return matchedTrade;
    } else if (sqft) {
      return `${sqft} renovation scope`;
    }
    return "Construction / renovation project inquiry";
  }

  private extractRequirements(text: string): string[] {
    const reqs: string[] = [];
    if (/sqft|sq\s*ft|square\s*feet/i.test(text)) reqs.push("On-site dimensional takeoff verification");
    if (/commercial|office/i.test(text)) reqs.push("Commercial liability certificate & building access scheduling");
    if (/cleanup|cleaning/i.test(text)) reqs.push("Post-construction surface sanitization & debris removal");
    if (/drywall/i.test(text)) reqs.push("Gypsum board delivery, hanging, and Level 4 taping finish");
    if (/paint/i.test(text)) reqs.push("Color selection review & two-coat interior latex application");
    if (/urgent|by friday|timeline/i.test(text)) reqs.push("Expedited crew dispatch schedule");

    if (reqs.length === 0) {
      reqs.push("Detailed scope consultation & preliminary estimate preparation");
    }
    return reqs;
  }
}
