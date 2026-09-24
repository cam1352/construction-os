import { z } from "zod";
import {
  IAgent,
  AgentContext,
  AgentExecutionResult,
  AgentTelemetry,
  AgentExecutionError,
} from "./types.js";

export class AgentValidationError extends Error {
  public readonly code = "VALIDATION_ERROR";
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = "AgentValidationError";
  }
}

export class AgentAbortError extends Error {
  public readonly code = "TASK_ABORTED";
  constructor(message = "Agent execution was aborted") {
    super(message);
    this.name = "AgentAbortError";
  }
}

export class AgentTimeoutError extends Error {
  public readonly code = "TASK_TIMEOUT";
  constructor(timeoutMs: number) {
    super(`Agent execution timed out after ${timeoutMs}ms`);
    this.name = "AgentTimeoutError";
  }
}

/**
 * Abstract base class for all specialized agents.
 * Implements strict lifecycle orchestration, schema validation, telemetry tracking,
 * and error isolation boundaries.
 */
export abstract class BaseAgent<TInput, TOutput> implements IAgent<TInput, TOutput> {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly version: string;
  public abstract readonly description: string;
  public abstract readonly agentType: string;

  protected abstract readonly inputSchema: z.ZodSchema<TInput>;
  protected abstract readonly outputSchema: z.ZodSchema<TOutput>;

  protected telemetry: AgentTelemetry = {
    startTime: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    retryCount: 0,
  };

  /**
   * Optional pre-execution lifecycle hook.
   * Can be overridden by subclasses to initialize database connections, verify models, etc.
   */
  protected async initialize(_context: AgentContext): Promise<void> {
    // Default no-op
  }

  /**
   * Validates raw input against the agent's inputSchema.
   */
  public validateInput(rawInput: unknown): TInput {
    const result = this.inputSchema.safeParse(rawInput);
    if (!result.success) {
      const issueSummary = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new AgentValidationError(
        `[${this.id}] Input validation failed: ${issueSummary}`,
        result.error.format()
      );
    }
    return result.data;
  }

  /**
   * Core execution logic. Must be implemented by specialized subclasses.
   */
  protected abstract execute(input: TInput, context: AgentContext): Promise<TOutput>;

  /**
   * Validates raw output against the agent's outputSchema.
   */
  public validateOutput(rawOutput: unknown): TOutput {
    const result = this.outputSchema.safeParse(rawOutput);
    if (!result.success) {
      const issueSummary = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new AgentValidationError(
        `[${this.id}] Output validation failed: ${issueSummary}`,
        result.error.format()
      );
    }
    return result.data;
  }

  /**
   * Optional post-execution teardown hook.
   * Guaranteed to execute in a finally block regardless of success or failure.
   */
  protected async cleanup(
    _context: AgentContext,
    _success: boolean,
    _error?: Error
  ): Promise<void> {
    // Default no-op
  }

  /**
   * Records token usage into the current execution telemetry.
   */
  protected recordTokens(promptTokens: number, completionTokens: number): void {
    this.telemetry.promptTokens += promptTokens;
    this.telemetry.completionTokens += completionTokens;
    this.telemetry.totalTokens += promptTokens + completionTokens;
  }

  /**
   * Checks if the abort signal was triggered and throws an AgentAbortError.
   */
  protected checkAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw new AgentAbortError(
        typeof signal.reason === "string" ? signal.reason : "Task was aborted"
      );
    }
  }

  /**
   * Main execution workflow:
   * 1. Initialize telemetry
   * 2. Check AbortSignal
   * 3. Run initialize hook
   * 4. Validate input
   * 5. Run execute
   * 6. Validate output
   * 7. Populate telemetry
   * 8. Run cleanup in finally
   */
  public async run(
    rawInput: unknown,
    context: AgentContext
  ): Promise<AgentExecutionResult<TOutput>> {
    const startTime = Date.now();
    this.telemetry = {
      startTime,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      retryCount: 0,
    };

    let executionError: Error | undefined;
    let validatedOutput: TOutput | undefined;

    try {
      this.checkAborted(context.abortSignal);
      context.logger?.debug(`[${this.id}] Starting execution for task ${context.taskId}`);

      await this.initialize(context);
      this.checkAborted(context.abortSignal);

      const validatedInput = this.validateInput(rawInput);
      this.checkAborted(context.abortSignal);

      const rawOutput = await this.execute(validatedInput, context);
      this.checkAborted(context.abortSignal);

      validatedOutput = this.validateOutput(rawOutput);

      const endTime = Date.now();
      this.telemetry.endTime = endTime;
      this.telemetry.durationMs = endTime - startTime;

      context.logger?.info(
        `[${this.id}] Execution succeeded for task ${context.taskId} in ${this.telemetry.durationMs}ms`
      );

      return {
        success: true,
        taskId: context.taskId,
        agentType: this.agentType,
        data: validatedOutput,
        telemetry: { ...this.telemetry },
      };
    } catch (err: any) {
      executionError = err instanceof Error ? err : new Error(String(err));
      const endTime = Date.now();
      this.telemetry.endTime = endTime;
      this.telemetry.durationMs = endTime - startTime;

      let errorCode = "AGENT_EXECUTION_FAILED";
      if (err instanceof AgentValidationError) {
        errorCode = err.code;
      } else if (err instanceof AgentAbortError) {
        errorCode = err.code;
      } else if (err instanceof AgentTimeoutError) {
        errorCode = err.code;
      } else if (context.abortSignal?.aborted) {
        errorCode = "TASK_ABORTED";
      }

      const formattedError: AgentExecutionError = {
        code: errorCode,
        message: executionError.message || "Unknown agent execution error",
        stack: executionError.stack,
        recoverable: false,
        timestamp: new Date().toISOString(),
      };

      context.logger?.error(
        `[${this.id}] Execution failed for task ${context.taskId}: ${formattedError.message}`
      );

      return {
        success: false,
        taskId: context.taskId,
        agentType: this.agentType,
        error: formattedError,
        telemetry: { ...this.telemetry },
      };
    } finally {
      try {
        await this.cleanup(context, validatedOutput !== undefined, executionError);
      } catch (cleanupErr) {
        context.logger?.warn(
          `[${this.id}] Error during cleanup for task ${context.taskId}:`,
          cleanupErr
        );
      }
    }
  }
}
