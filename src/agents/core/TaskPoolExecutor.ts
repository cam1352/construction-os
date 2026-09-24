import {
  AgentContext,
  AgentExecutionResult,
  AgentPriority,
  PRIORITY_WEIGHTS,
} from "./types.js";
import { AgentRegistry } from "./AgentRegistry.js";

/**
 * Asynchronous counting semaphore for concurrency throttling.
 * Supports priority acquisition and non-blocking promise resolution.
 */
export class AsyncSemaphore {
  private permits: number;
  private readonly maxPermits: number;
  private readonly waitQueue: Array<{
    resolve: () => void;
    priority: number;
    enqueuedAt: number;
  }> = [];

  constructor(maxPermits: number) {
    this.maxPermits = maxPermits;
    this.permits = maxPermits;
  }

  public get availablePermits(): number {
    return this.permits;
  }

  public get queueLength(): number {
    return this.waitQueue.length;
  }

  public async acquire(priority = 2): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const waiter = { resolve, priority, enqueuedAt: Date.now() };

      // Sorted insert based on priority (lower number = higher priority)
      const index = this.waitQueue.findIndex((item) => item.priority > priority);
      if (index === -1) {
        this.waitQueue.push(waiter);
      } else {
        this.waitQueue.splice(index, 0, waiter);
      }
    });
  }

  public release(): void {
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      if (next) {
        next.resolve();
        return;
      }
    }
    if (this.permits < this.maxPermits) {
      this.permits++;
    }
  }
}

/**
 * Token bucket rate limiter preventing CPU saturation and simulating provider RPM/TPM limits.
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRatePerMs: number;

  constructor(tokensPerSecond = 500, maxBurst = 100) {
    this.capacity = maxBurst;
    this.tokens = maxBurst;
    this.refillRatePerMs = tokensPerSecond / 1000;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRatePerMs);
      this.lastRefill = now;
    }
  }

  public async acquire(cost = 1): Promise<void> {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return;
    }

    const deficit = cost - this.tokens;
    const waitMs = Math.ceil(deficit / this.refillRatePerMs);
    await new Promise((r) => setTimeout(r, waitMs));
    this.refill();
    this.tokens = Math.max(0, this.tokens - cost);
  }
}

export interface TaskSubmitOptions {
  priority?: AgentPriority;
  timeoutMs?: number;
  tenantId?: string;
  userId?: string;
  leadId?: string;
  projectId?: string;
  customerId?: string;
  metadata?: Record<string, unknown>;
}

interface InternalQueuedTask<TInput = unknown, TOutput = unknown> {
  taskId: string;
  agentType: string;
  input: TInput;
  priority: AgentPriority;
  numericPriority: number;
  timeoutMs: number;
  options?: TaskSubmitOptions;
  resolve: (value: AgentExecutionResult<TOutput>) => void;
  reject: (reason?: unknown) => void;
  enqueuedAt: number;
}

export interface PoolStats {
  activeCount: number;
  queuedCount: number;
  completedCount: number;
  failedCount: number;
  totalExecuted: number;
  maxConcurrency: number;
  availablePermits: number;
  queueCapacity: number;
  averageDurationMs: number;
}

/**
 * High-concurrency task pool engine engineered for 100+ concurrent agents.
 * Features an async Semaphore, priority queue, rate limiter, and total error isolation.
 */
export class TaskPoolExecutor {
  private activeCount = 0;
  private completedCount = 0;
  private failedCount = 0;
  private totalDurationMs = 0;
  private isDraining = false;
  private isShutdown = false;

  private readonly maxConcurrency: number;
  private readonly maxQueueCapacity: number;
  private readonly semaphore: AsyncSemaphore;
  private readonly rateLimiter: TokenBucketRateLimiter;
  private readonly registry: AgentRegistry;
  private readonly queue: InternalQueuedTask<any, any>[] = [];

  constructor(
    maxConcurrency = 100,
    options?: {
      maxQueueCapacity?: number;
      tokensPerSecond?: number;
      registry?: AgentRegistry;
    }
  ) {
    this.maxConcurrency = maxConcurrency;
    this.maxQueueCapacity = options?.maxQueueCapacity ?? 5000;
    this.semaphore = new AsyncSemaphore(maxConcurrency);
    this.rateLimiter = new TokenBucketRateLimiter(
      options?.tokensPerSecond ?? 1000,
      maxConcurrency
    );
    this.registry = options?.registry ?? AgentRegistry.getInstance();
  }

  /**
   * Submits a task for asynchronous execution through the pool.
   */
  public async submit<TInput, TOutput>(
    agentType: string,
    input: TInput,
    options?: TaskSubmitOptions
  ): Promise<AgentExecutionResult<TOutput>> {
    if (this.isShutdown) {
      throw new Error("TaskPoolExecutor is shut down. Submissions rejected.");
    }

    if (this.queue.length >= this.maxQueueCapacity) {
      throw new Error(
        `TaskPoolExecutor queue overflow: capacity of ${this.maxQueueCapacity} exceeded.`
      );
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const priority = options?.priority ?? "normal";
    const numericPriority = PRIORITY_WEIGHTS[priority];
    const timeoutMs = options?.timeoutMs ?? 30000;

    return new Promise<AgentExecutionResult<TOutput>>((resolve, reject) => {
      const task: InternalQueuedTask<TInput, TOutput> = {
        taskId,
        agentType,
        input,
        priority,
        numericPriority,
        timeoutMs,
        options,
        resolve,
        reject,
        enqueuedAt: Date.now(),
      };

      this.enqueue(task);
      this.dispatchNext();
    });
  }

  /**
   * Submits a batch of tasks concurrently and returns all results.
   */
  public async submitBatch<TInput, TOutput>(
    tasks: Array<{ agentType: string; input: TInput; options?: TaskSubmitOptions }>
  ): Promise<AgentExecutionResult<TOutput>[]> {
    return Promise.all(
      tasks.map((task) => this.submit<TInput, TOutput>(task.agentType, task.input, task.options))
    );
  }

  private enqueue(task: InternalQueuedTask<any, any>): void {
    const index = this.queue.findIndex((t) => t.numericPriority > task.numericPriority);
    if (index === -1) {
      this.queue.push(task);
    } else {
      this.queue.splice(index, 0, task);
    }
  }

  private async dispatchNext(): Promise<void> {
    if (this.isShutdown || this.queue.length === 0) {
      return;
    }

    if (this.activeCount >= this.maxConcurrency) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.activeCount++;

    // Asynchronously execute worker slot
    (async () => {
      const abortController = new AbortController();
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

      if (task.timeoutMs > 0) {
        timeoutHandle = setTimeout(() => {
          abortController.abort(new Error(`Execution timed out after ${task.timeoutMs}ms`));
        }, task.timeoutMs);
      }

      const context: AgentContext = {
        taskId: task.taskId,
        priority: task.priority,
        abortSignal: abortController.signal,
        timeoutMs: task.timeoutMs,
        tenantId: task.options?.tenantId,
        userId: task.options?.userId,
        leadId: task.options?.leadId,
        projectId: task.options?.projectId,
        customerId: task.options?.customerId,
        metadata: task.options?.metadata,
        logger: {
          info: (msg, ...args) => console.log(`[INFO][${task.taskId}] ${msg}`, ...args),
          warn: (msg, ...args) => console.warn(`[WARN][${task.taskId}] ${msg}`, ...args),
          error: (msg, ...args) => console.error(`[ERROR][${task.taskId}] ${msg}`, ...args),
          debug: () => {},
        },
      };

      try {
        await this.semaphore.acquire(task.numericPriority);
        await this.rateLimiter.acquire(1);

        const agent = this.registry.create(task.agentType);
        const result = await agent.run(task.input, context);

        if (timeoutHandle) clearTimeout(timeoutHandle);

        if (result.success) {
          this.completedCount++;
        } else {
          this.failedCount++;
        }

        if (result.telemetry?.durationMs) {
          this.totalDurationMs += result.telemetry.durationMs;
        }

        task.resolve(result);
      } catch (err: any) {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        this.failedCount++;

        // Ensure errors never crash the pool; wrap as a failed AgentExecutionResult
        const errorResult: AgentExecutionResult<any> = {
          success: false,
          taskId: task.taskId,
          agentType: task.agentType,
          error: {
            code: "TASK_POOL_WORKER_ERROR",
            message: err.message || "Unhandled worker execution error",
            stack: err.stack,
            recoverable: false,
            timestamp: new Date().toISOString(),
          },
          telemetry: {
            startTime: task.enqueuedAt,
            endTime: Date.now(),
            durationMs: Date.now() - task.enqueuedAt,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            retryCount: 0,
          },
        };

        task.resolve(errorResult);
      } finally {
        this.semaphore.release();
        this.activeCount--;

        // Schedule next queued item on the next tick
        queueMicrotask(() => this.dispatchNext());
      }
    })();
  }

  /**
   * Returns current executor health and performance metrics.
   */
  public getStats(): PoolStats {
    const totalExecuted = this.completedCount + this.failedCount;
    return {
      activeCount: this.activeCount,
      queuedCount: this.queue.length,
      completedCount: this.completedCount,
      failedCount: this.failedCount,
      totalExecuted,
      maxConcurrency: this.maxConcurrency,
      availablePermits: this.semaphore.availablePermits,
      queueCapacity: this.maxQueueCapacity,
      averageDurationMs:
        totalExecuted > 0 ? Math.round(this.totalDurationMs / totalExecuted) : 0,
    };
  }

  /**
   * Waits until all currently active and queued tasks finish execution.
   */
  public async drain(): Promise<void> {
    if (this.activeCount === 0 && this.queue.length === 0) {
      return;
    }
    this.isDraining = true;
    while (this.activeCount > 0 || this.queue.length > 0) {
      await new Promise((r) => setTimeout(r, 50));
    }
    this.isDraining = false;
  }

  /**
   * Shuts down the executor, optionally cancelling any pending queued tasks.
   */
  public async shutdown(options?: { force?: boolean }): Promise<void> {
    this.isShutdown = true;
    if (options?.force) {
      while (this.queue.length > 0) {
        const task = this.queue.shift();
        if (task) {
          task.reject(new Error("Task cancelled due to executor shutdown"));
        }
      }
    }
    await this.drain();
  }
}
