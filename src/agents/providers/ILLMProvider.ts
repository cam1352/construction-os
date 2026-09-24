import { z } from "zod";

export type LLMChatRole = "system" | "user" | "assistant";

export interface LLMChatMessage {
  role: LLMChatRole;
  content: string;
  name?: string;
}

export interface LLMTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMOptionsBase {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  seed?: number;
  stop?: string[];
}

export interface LLMCompletionOptions extends LLMOptionsBase {}

export interface LLMChatOptions extends LLMOptionsBase {}

export interface LLMStructuredOptions extends LLMOptionsBase {
  schemaName?: string;
  schemaDescription?: string;
}

export interface LLMCompletionResponse {
  text: string;
  usage: LLMTokenUsage;
  model: string;
  provider: string;
  durationMs: number;
  finishReason?: string;
}

export interface LLMChatResponse {
  message: LLMChatMessage;
  usage: LLMTokenUsage;
  model: string;
  provider: string;
  durationMs: number;
  finishReason?: string;
}

export interface LLMStructuredResponse<T> {
  data: T;
  rawText: string;
  usage: LLMTokenUsage;
  model: string;
  provider: string;
  durationMs: number;
}

/**
 * Universal interface for pluggable LLM providers (Mock offline, OpenAI, LangChain).
 */
export interface ILLMProvider {
  readonly id: string;
  readonly name: string;
  readonly isOffline: boolean;

  generateCompletion(
    prompt: string,
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResponse>;

  generateChatResponse(
    messages: LLMChatMessage[],
    options?: LLMChatOptions
  ): Promise<LLMChatResponse>;

  extractStructuredData<T>(
    promptOrMessages: string | LLMChatMessage[],
    schema: z.ZodSchema<T>,
    options?: LLMStructuredOptions
  ): Promise<LLMStructuredResponse<T>>;
}
