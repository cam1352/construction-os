import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { BaseAgent } from "../core/BaseAgent.js";
import type { AgentContext } from "../core/types.js";

// =============================================================================
// 1. Zod Schemas & TypeScript Types
// =============================================================================

export const PortfolioSiteEnum = z.enum([
  "walker-general-contractors",
  "vancouver-cleaning",
  "vancouver-pharmacy",
]);

export type PortfolioSite = z.infer<typeof PortfolioSiteEnum>;

export const MarketingAgentInputSchema = z.object({
  targetPortfolioSite: PortfolioSiteEnum,
  topic: z.string().min(1, "Topic is required"),
  targetKeywords: z.array(z.string()).default([]),
  targetCity: z.string().default("Vancouver"),
  publishScheduleDays: z.number().int().min(0).default(0), // 0 = immediate, >0 = future schedule
  pushToLocalDisk: z.boolean().default(true),
  outputBaseDir: z.string().optional(),
});

export type MarketingAgentInput = z.infer<typeof MarketingAgentInputSchema>;

export const MarketingAgentOutputSchema = z.object({
  slug: z.string(),
  title: z.string(),
  metaDescription: z.string(),
  seoKeywords: z.array(z.string()),
  targetPortfolioSite: PortfolioSiteEnum,
  scheduledPublishDate: z.string(),
  status: z.enum(["PUBLISHED", "SCHEDULED", "DRAFT"]),
  readingTimeMinutes: z.number(),
  markdownContent: z.string(),
  htmlContent: z.string(),
  diskPushResult: z
    .object({
      pushed: z.boolean(),
      targetDirectory: z.string(),
      markdownFilePath: z.string(),
      htmlFilePath: z.string(),
      bytesWritten: z.number(),
      timestamp: z.string(),
    })
    .optional(),
});

export type MarketingAgentOutput = z.infer<typeof MarketingAgentOutputSchema>;

// =============================================================================
// 2. MarketingAgent Class Implementation
// =============================================================================

export class MarketingAgent extends BaseAgent<
  MarketingAgentInput,
  MarketingAgentOutput
> {
  public readonly id = "marketing_agent";
  public readonly name = "Autonomous SEO Blog & Portfolio Marketing Agent";
  public readonly version = "1.0.0";
  public readonly description =
    "Autonomously generates high-ranking SEO blog articles, manages publication scheduling, and programmatically pushes markdown/HTML deliverables to external portfolio website codebases (walker-general-contractors, vancouver-cleaning, vancouver-pharmacy).";
  public readonly agentType = "MARKETING";

  protected readonly inputSchema = MarketingAgentInputSchema;
  protected readonly outputSchema = MarketingAgentOutputSchema;

  /**
   * Framework execution hook conforming to BaseAgent lifecycle.
   */
  protected async execute(
    input: MarketingAgentInput,
    context: AgentContext
  ): Promise<MarketingAgentOutput> {
    const {
      targetPortfolioSite,
      topic,
      targetKeywords,
      targetCity = "Vancouver",
      publishScheduleDays = 0,
      pushToLocalDisk = true,
      outputBaseDir,
    } = input;

    context.logger?.info(
      `[MarketingAgent] Generating SEO blog for portfolio site "${targetPortfolioSite}" on topic: "${topic}"`
    );

    // -------------------------------------------------------------------------
    // STEP 1: SEO Keyword & Metadata Formulation
    // -------------------------------------------------------------------------
    const siteConfig = this.getSiteConfig(targetPortfolioSite, targetCity);

    const mergedKeywords = Array.from(
      new Set([
        ...targetKeywords,
        ...siteConfig.defaultKeywords,
        `${targetCity} ${siteConfig.coreTrade}`,
      ])
    );

    const slug = this.generateSlug(topic, targetCity);
    const title = this.generateCatchyTitle(topic, siteConfig.brandName, targetCity);
    const metaDescription = this.generateMetaDescription(
      topic,
      siteConfig.brandName,
      targetCity,
      mergedKeywords
    );

    // -------------------------------------------------------------------------
    // STEP 2: Publication Scheduling
    // -------------------------------------------------------------------------
    const scheduledDateObj =
      publishScheduleDays === 0
        ? new Date()
        : new Date(Date.now() + publishScheduleDays * 86400000);
    const scheduledPublishDate = scheduledDateObj.toISOString();
    const status: "PUBLISHED" | "SCHEDULED" =
      publishScheduleDays === 0 ? "PUBLISHED" : "SCHEDULED";

    // -------------------------------------------------------------------------
    // STEP 3: Content Generation (Markdown & HTML)
    // -------------------------------------------------------------------------
    const readingTimeMinutes = 5;
    const markdownContent = this.generateMarkdownContent({
      title,
      slug,
      metaDescription,
      keywords: mergedKeywords,
      scheduledPublishDate,
      siteConfig,
      topic,
      targetCity,
      readingTimeMinutes,
    });

    const htmlContent = this.generateHtmlContent({
      title,
      metaDescription,
      keywords: mergedKeywords,
      markdownContent,
      siteConfig,
    });

    // -------------------------------------------------------------------------
    // STEP 4: Local File Push Simulator
    // -------------------------------------------------------------------------
    let diskPushResult: MarketingAgentOutput["diskPushResult"];

    if (pushToLocalDisk) {
      diskPushResult = this.pushBlogToLocalDisk({
        targetPortfolioSite,
        slug,
        markdownContent,
        htmlContent,
        customBaseDir: outputBaseDir,
      });
      context.logger?.info(
        `[MarketingAgent] File push complete: ${diskPushResult.markdownFilePath}`
      );
    }

    return {
      slug,
      title,
      metaDescription,
      seoKeywords: mergedKeywords,
      targetPortfolioSite,
      scheduledPublishDate,
      status,
      readingTimeMinutes,
      markdownContent,
      htmlContent,
      diskPushResult,
    };
  }

  // ---------------------------------------------------------------------------
  // Helper: Site Configuration Profiles
  // ---------------------------------------------------------------------------
  private getSiteConfig(site: PortfolioSite, city: string) {
    switch (site) {
      case "walker-general-contractors":
        return {
          brandName: "Walker General Contractors",
          coreTrade: "general contracting & commercial renovation",
          ctaPhone: "(604) 555-0199",
          ctaUrl: "https://consult.walkercontractors.com",
          ctaText: "Schedule a Consultation with our Lead Estimator",
          defaultKeywords: [
            "commercial general contractor",
            "residential renovation",
            "building contractor",
            "tenant improvements",
          ],
        };
      case "vancouver-cleaning":
        return {
          brandName: "Vancouver Elite Cleaning & Janitorial",
          coreTrade: "post-construction & commercial janitorial",
          ctaPhone: "(604) 555-0144",
          ctaUrl: "https://vancouvercleaning.ca/book",
          ctaText: "Book Your Certified Commercial Cleaning Crew",
          defaultKeywords: [
            "post-construction cleaning",
            "commercial cleaning services",
            "janitorial contractor",
            "office sanitization",
          ],
        };
      case "vancouver-pharmacy":
        return {
          brandName: "Vancouver Healthcare & Pharmacy Facility Services",
          coreTrade: "cleanroom sterilization & healthcare clinic hygiene",
          ctaPhone: "(604) 555-0188",
          ctaUrl: "https://vancouverpharmacyfacilities.ca/consult",
          ctaText: "Request a Cleanroom Compliance Audit",
          defaultKeywords: [
            "pharmacy cleanroom maintenance",
            "USP 797 compliance cleaning",
            "medical clinic sanitization",
            "healthcare facility maintenance",
          ],
        };
    }
  }

  // ---------------------------------------------------------------------------
  // Helper: Slug Generator
  // ---------------------------------------------------------------------------
  private generateSlug(topic: string, city: string): string {
    const raw = `${topic} ${city}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return raw.slice(0, 80);
  }

  // ---------------------------------------------------------------------------
  // Helper: SEO Title & Meta Description Formulation
  // ---------------------------------------------------------------------------
  private generateCatchyTitle(topic: string, brand: string, city: string): string {
    return `The Complete Guide to ${topic} in ${city} | ${brand}`;
  }

  private generateMetaDescription(
    topic: string,
    brand: string,
    city: string,
    keywords: string[]
  ): string {
    const topKeywords = keywords.slice(0, 2).join(" & ");
    return `Discover expert recommendations for ${topic} in ${city}. Explore ${topKeywords} with industry-leading insights from ${brand}.`;
  }

  // ---------------------------------------------------------------------------
  // Helper: Formatted Markdown Generator with Frontmatter
  // ---------------------------------------------------------------------------
  private generateMarkdownContent(params: {
    title: string;
    slug: string;
    metaDescription: string;
    keywords: string[];
    scheduledPublishDate: string;
    siteConfig: ReturnType<MarketingAgent["getSiteConfig"]>;
    topic: string;
    targetCity: string;
    readingTimeMinutes: number;
  }): string {
    const {
      title,
      slug,
      metaDescription,
      keywords,
      scheduledPublishDate,
      siteConfig,
      topic,
      targetCity,
      readingTimeMinutes,
    } = params;

    const keywordsFormatted = JSON.stringify(keywords);

    return `---
title: "${title}"
slug: "${slug}"
date: "${scheduledPublishDate}"
author: "${siteConfig.brandName} Editorial Team"
metaDescription: "${metaDescription}"
keywords: ${keywordsFormatted}
readingTimeMinutes: ${readingTimeMinutes}
targetCity: "${targetCity}"
---

# ${title}

*Published by **${siteConfig.brandName}** on ${new Date(scheduledPublishDate).toLocaleDateString("en-CA")} • ${readingTimeMinutes} min read*

---

## Overview

In today's fast-paced commercial and residential property landscape across **${targetCity}**, maintaining uncompromising quality, regulatory compliance, and architectural precision is essential. Whether executing a multi-stage project or managing ongoing facilities, understanding the fundamentals of **${topic}** can save your organization significant time, capital, and operational disruption.

---

## 1. Key Objectives & Scope Breakdown

When approaching **${topic}**, industry leaders prioritize a systematic, three-phase framework:

1. **Pre-Project Assessment & Scoping**
   - Conduct thorough on-site inspections to determine structural, environmental, and spatial parameters.
   - Verify local building codes, trade licenses, and municipal requirements in ${targetCity}.

2. **Methodology & Trade Execution**
   - Deploy dedicated trade specialists using commercial-grade materials and calibrated equipment.
   - Maintain continuous safety protocols, dust suppression, and air filtration.

3. **Final Quality Assurance & Sign-Off**
   - Execute an exhaustive punch-list walkthrough with facility managers and owners.
   - Ensure documented compliance with local environmental and health standards.

---

## 2. Contractor Pro-Tips: Avoiding Costly Pitfalls

> **Expert Insight:** Many property owners underestimate the timeline impact of delayed permit submissions and supply chain lead times. Partnering with an established team like **${siteConfig.brandName}** ensures proactive material procurement and seamless project management.

- **Check Manufacturer Certifications:** Always insist on verified commercial warranties for all installed components.
- **Plan for Phased Turnover:** On large facilities, staging section handovers keeps business operations running without total shutdowns.
- **Insist on Detailed Takeoffs:** Unitemized lump-sum bids frequently lead to unexpected change orders. Insist on itemized labor, material, and equipment transparency.

---

## 3. Frequently Asked Questions (FAQ)

### What makes ${siteConfig.brandName} the preferred choice in ${targetCity}?
Our specialized team combines decades of field expertise, verified safety records, and state-of-the-art tools tailored specifically to the ${targetCity} market.

### How quickly can a team be deployed?
We offer flexible scheduling, including expedited dispatch for urgent and time-sensitive project requirements.

---

## Ready to Elevate Your Property?

Don't leave critical project details to chance. Partner with **${siteConfig.brandName}** for unparalleled reliability, safety, and craft.

- **Direct Phone:** [${siteConfig.ctaPhone}](tel:${siteConfig.ctaPhone.replace(/[^0-9]/g, "")})
- **Online Booking:** [${siteConfig.ctaText}](${siteConfig.ctaUrl})
- **Service Area:** ${targetCity} and surrounding Greater Metro Municipalities.
`;
  }

  // ---------------------------------------------------------------------------
  // Helper: HTML Generator
  // ---------------------------------------------------------------------------
  private generateHtmlContent(params: {
    title: string;
    metaDescription: string;
    keywords: string[];
    markdownContent: string;
    siteConfig: ReturnType<MarketingAgent["getSiteConfig"]>;
  }): string {
    const { title, metaDescription, keywords, siteConfig } = params;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${metaDescription}">
  <meta name="keywords" content="${keywords.join(", ")}">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #222; }
    h1 { color: #1e3a8a; }
    h2 { color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    blockquote { background: #f8fafc; border-left: 4px solid #3b82f6; margin: 20px 0; padding: 15px; }
    .cta-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin-top: 40px; }
  </style>
</head>
<body>
  <article>
    <h1>${title}</h1>
    <p><em>Published by ${siteConfig.brandName}</em></p>
    <div class="content">
      <p>${metaDescription}</p>
      <div class="cta-box">
        <h3>Need Professional Assistance?</h3>
        <p>Contact <strong>${siteConfig.brandName}</strong> at ${siteConfig.ctaPhone} or <a href="${siteConfig.ctaUrl}">${siteConfig.ctaText}</a>.</p>
      </div>
    </div>
  </article>
</body>
</html>`;
  }

  // ---------------------------------------------------------------------------
  // Helper: Local File Push Simulator
  // ---------------------------------------------------------------------------
  private pushBlogToLocalDisk(params: {
    targetPortfolioSite: PortfolioSite;
    slug: string;
    markdownContent: string;
    htmlContent: string;
    customBaseDir?: string;
  }): NonNullable<MarketingAgentOutput["diskPushResult"]> {
    const {
      targetPortfolioSite,
      slug,
      markdownContent,
      htmlContent,
      customBaseDir,
    } = params;

    const targetDirectory =
      customBaseDir ||
      path.join(process.cwd(), "portfolio_sites", targetPortfolioSite, "blogs");

    fs.mkdirSync(targetDirectory, { recursive: true });

    const markdownFilePath = path.join(targetDirectory, `${slug}.md`);
    const htmlFilePath = path.join(targetDirectory, `${slug}.html`);

    fs.writeFileSync(markdownFilePath, markdownContent, "utf-8");
    fs.writeFileSync(htmlFilePath, htmlContent, "utf-8");

    const bytesWritten =
      Buffer.byteLength(markdownContent, "utf-8") +
      Buffer.byteLength(htmlContent, "utf-8");

    console.log(
      `[MarketingAgent] Successfully pushed blog "${slug}" to portfolio path: ${markdownFilePath} (${bytesWritten} bytes)`
    );

    return {
      pushed: true,
      targetDirectory,
      markdownFilePath,
      htmlFilePath,
      bytesWritten,
      timestamp: new Date().toISOString(),
    };
  }
}
