import { z } from "zod";

/**
 * Priority levels for agent task execution.
 * Critical tasks are prioritized in the execution queue.
 */
export type AgentPriority = "critical" | "high" | "normal" | "low";

export const PRIORITY_WEIGHTS: Record<AgentPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export const AgentPrioritySchema = z.enum(["critical", "high", "normal", "low"]);

/**
 * Operational status of an agent execution.
 */
export type AgentStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "timed_out";

export const AgentStatusSchema = z.enum([
  "idle",
  "running",
  "completed",
  "failed",
  "cancelled",
  "timed_out",
]);

/**
 * Supported core agent types matching the Prisma AgentRun model.
 */
export type AgentType =
  | "SALES"
  | "ESTIMATING"
  | "PROJECT_MANAGEMENT"
  | "CUSTOMER_SERVICE"
  | "ADMIN"
  | "MARKETING";

export const AgentTypeSchema = z.enum([
  "SALES",
  "ESTIMATING",
  "PROJECT_MANAGEMENT",
  "CUSTOMER_SERVICE",
  "ADMIN",
  "MARKETING",
]);

/**
 * Structured logger interface passed into execution contexts.
 */
export interface AgentLogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

/**
 * Execution context provided to an agent during a run.
 */
export interface AgentContext {
  taskId: string;
  tenantId?: string;
  userId?: string;
  leadId?: string;
  projectId?: string;
  customerId?: string;
  priority: AgentPriority;
  abortSignal: AbortSignal;
  timeoutMs: number;
  metadata?: Record<string, unknown>;
  logger?: AgentLogger;
}

export const AgentContextSchema = z.object({
  taskId: z.string().min(1),
  tenantId: z.string().optional(),
  userId: z.string().optional(),
  leadId: z.string().optional(),
  projectId: z.string().optional(),
  customerId: z.string().optional(),
  priority: AgentPrioritySchema.default("normal"),
  timeoutMs: z.number().int().positive().default(30000),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Telemetry and token usage metrics recorded for every execution.
 */
export interface AgentTelemetry {
  startTime: number;
  endTime?: number;
  durationMs?: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  retryCount: number;
  memoryUsageMb?: number;
}

export const AgentTelemetrySchema = z.object({
  startTime: z.number(),
  endTime: z.number().optional(),
  durationMs: z.number().optional(),
  promptTokens: z.number().int().nonnegative().default(0),
  completionTokens: z.number().int().nonnegative().default(0),
  totalTokens: z.number().int().nonnegative().default(0),
  retryCount: z.number().int().nonnegative().default(0),
  memoryUsageMb: z.number().optional(),
});

/**
 * Error envelope returned when an agent execution fails.
 */
export interface AgentExecutionError {
  code: string;
  message: string;
  stack?: string;
  recoverable: boolean;
  timestamp: string;
}

export const AgentExecutionErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  stack: z.string().optional(),
  recoverable: z.boolean().default(false),
  timestamp: z.string(),
});

/**
 * Standardized result returned by all agent executions.
 */
export interface AgentExecutionResult<TOutput = unknown> {
  success: boolean;
  taskId: string;
  agentType: string;
  data?: TOutput;
  error?: AgentExecutionError;
  telemetry: AgentTelemetry;
}

export const AgentExecutionResultSchema = z.object({
  success: z.boolean(),
  taskId: z.string(),
  agentType: z.string(),
  data: z.unknown().optional(),
  error: AgentExecutionErrorSchema.optional(),
  telemetry: AgentTelemetrySchema,
});

/**
 * Representation of an enqueued task in the TaskPoolExecutor.
 */
export interface AgentTask<TInput = unknown> {
  id: string;
  agentType: string;
  input: TInput;
  priority: AgentPriority;
  timeoutMs: number;
  context?: Partial<AgentContext>;
  createdAt: Date;
}

/**
 * Primary interface that all agents in the framework must implement.
 */
export interface IAgent<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly agentType: string;

  run(rawInput: unknown, context: AgentContext): Promise<AgentExecutionResult<TOutput>>;
  validateInput(rawInput: unknown): TInput;
  validateOutput(rawOutput: unknown): TOutput;
}

/**
 * Metadata record for registered agents in AgentRegistry.
 */
export interface AgentMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  agentType: string;
  tags?: string[];
}

export type AgentFactory<T extends IAgent = IAgent> = () => T;
export type AgentConstructor<T extends IAgent = IAgent> = new (...args: any[]) => T;
