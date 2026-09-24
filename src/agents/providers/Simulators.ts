import { prisma } from "../../lib/prisma.js";

export interface SendEmailParams {
  to: string;
  from?: string;
  subject: string;
  body: string;
  customerId?: string;
  leadId?: string;
  projectId?: string;
  aiGenerated?: boolean;
  agentId?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId: string;
  communicationLogId?: string;
  timestamp: Date;
  recipient: string;
  subject: string;
}

export interface SendSmsParams {
  to: string;
  from?: string;
  body: string;
  customerId?: string;
  leadId?: string;
  projectId?: string;
  aiGenerated?: boolean;
  agentId?: string;
}

export interface SmsDeliveryResult {
  success: boolean;
  messageId: string;
  communicationLogId?: string;
  timestamp: Date;
  recipient: string;
}

export interface ProcessPaymentParams {
  invoiceId: string;
  customerId: string;
  amount: number;
  paymentMethod: "CREDIT_CARD" | "ACH" | "CHECK" | "WIRE" | "CASH";
  referenceNumber?: string;
  notes?: string;
}

export interface PaymentProcessResult {
  success: boolean;
  paymentId?: string;
  paymentNumber: string;
  authorizationCode: string;
  amount: number;
  updatedInvoiceBalance: number;
  invoiceStatus: string;
  timestamp: Date;
}

/**
 * Zero-API Outbound Email Simulator.
 * Logs email to console and persists directly to the Prisma CommunicationLog table.
 */
export class EmailSimulator {
  public static async sendEmail(params: SendEmailParams): Promise<EmailDeliveryResult> {
    const timestamp = new Date();
    const messageId = `msg_em_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const sender = params.from || "notifications@walkercontractors.com";

    console.log("===============================================================");
    console.log(" [ZERO-API EMAIL SIMULATOR] OUTBOUND DISPATCH");
    console.log(` To:        ${params.to}`);
    console.log(` From:      ${sender}`);
    console.log(` Subject:   ${params.subject}`);
    console.log(` Agent:     ${params.agentId || "sales_agent"}`);
    console.log(" Content Preview:");
    console.log(
      params.body
        .split("\n")
        .slice(0, 5)
        .map((l) => `   > ${l}`)
        .join("\n")
    );
    console.log("===============================================================");

    let logId: string | undefined;

    try {
      const record = await prisma.communicationLog.create({
        data: {
          channel: "EMAIL",
          direction: "OUTBOUND",
          sender,
          recipient: params.to,
          subject: params.subject,
          body: params.body,
          customerId: params.customerId,
          leadId: params.leadId,
          projectId: params.projectId,
          aiGenerated: params.aiGenerated ?? true,
          agentId: params.agentId || "sales_agent",
          status: "SENT",
        },
      });
      logId = record.id;
    } catch (err: any) {
      console.warn(
        `[EmailSimulator] Notice: Prisma CommunicationLog write skipped or failed (${err.message}). Continuing simulation.`
      );
    }

    return {
      success: true,
      messageId,
      communicationLogId: logId,
      timestamp,
      recipient: params.to,
      subject: params.subject,
    };
  }
}

/**
 * Zero-API Outbound SMS Simulator.
 * Logs SMS to console and persists directly to the Prisma CommunicationLog table.
 */
export class SmsSimulator {
  public static async sendSms(params: SendSmsParams): Promise<SmsDeliveryResult> {
    const timestamp = new Date();
    const messageId = `msg_sms_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const sender = params.from || "+1-555-0100";

    console.log("===============================================================");
    console.log(" [ZERO-API SMS SIMULATOR] OUTBOUND SMS");
    console.log(` To:        ${params.to}`);
    console.log(` From:      ${sender}`);
    console.log(` Body:      ${params.body}`);
    console.log("===============================================================");

    let logId: string | undefined;

    try {
      const record = await prisma.communicationLog.create({
        data: {
          channel: "SMS",
          direction: "OUTBOUND",
          sender,
          recipient: params.to,
          body: params.body,
          customerId: params.customerId,
          leadId: params.leadId,
          projectId: params.projectId,
          aiGenerated: params.aiGenerated ?? true,
          agentId: params.agentId || "sales_agent",
          status: "SENT",
        },
      });
      logId = record.id;
    } catch (err: any) {
      console.warn(
        `[SmsSimulator] Notice: Prisma CommunicationLog write skipped (${err.message}). Continuing simulation.`
      );
    }

    return {
      success: true,
      messageId,
      communicationLogId: logId,
      timestamp,
      recipient: params.to,
    };
  }
}

/**
 * Zero-API Payment Simulator.
 * Simulates Stripe/Card transactions, updates Invoice balances and creates Payment records.
 */
export class PaymentSimulator {
  public static async processPayment(
    params: ProcessPaymentParams
  ): Promise<PaymentProcessResult> {
    const timestamp = new Date();
    const paymentNumber = `PMT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const authCode = `AUTH-SIM-${Math.random().toString(16).substring(2, 8).toUpperCase()}`;

    console.log("===============================================================");
    console.log(" [ZERO-API PAYMENT SIMULATOR] TRANSACTION PROCESSED");
    console.log(` Payment #: ${paymentNumber}`);
    console.log(` Invoice:   ${params.invoiceId}`);
    console.log(` Amount:    $${params.amount.toFixed(2)}`);
    console.log(` Method:    ${params.paymentMethod}`);
    console.log(` Auth Code: ${authCode}`);
    console.log("===============================================================");

    let paymentId: string | undefined;
    let updatedBalance = 0;
    let updatedStatus = "PAID";

    try {
      const txResult = await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({
          where: { id: params.invoiceId },
        });

        if (invoice) {
          const totalAmount = Number(invoice.totalAmount);
          const currentPaid = Number(invoice.amountPaid);
          const newPaid = currentPaid + params.amount;
          const newBalance = Math.max(0, totalAmount - newPaid);
          const newStatus = newBalance <= 0.001 ? "PAID" : "PARTIALLY_PAID";

          await tx.invoice.update({
            where: { id: params.invoiceId },
            data: {
              amountPaid: newPaid,
              balanceDue: newBalance,
              status: newStatus,
            },
          });

          updatedBalance = newBalance;
          updatedStatus = newStatus;
        }

        const createdPayment = await tx.payment.create({
          data: {
            paymentNumber,
            invoiceId: params.invoiceId,
            customerId: params.customerId,
            amount: params.amount,
            paymentDate: timestamp,
            paymentMethod: params.paymentMethod,
            referenceNumber: params.referenceNumber || authCode,
            status: "COMPLETED",
            notes: params.notes || "Processed via Zero-API Payment Simulator",
          },
        });

        return createdPayment;
      });

      paymentId = txResult.id;
    } catch (err: any) {
      console.warn(
        `[PaymentSimulator] Notice: Transaction skipped in fallback mode (${err.message}).`
      );
    }

    return {
      success: true,
      paymentId,
      paymentNumber,
      authorizationCode: authCode,
      amount: params.amount,
      updatedInvoiceBalance: updatedBalance,
      invoiceStatus: updatedStatus,
      timestamp,
    };
  }
}
