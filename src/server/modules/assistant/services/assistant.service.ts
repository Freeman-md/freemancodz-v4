import "server-only";
import { DAILY_RATE_LIMIT_MAX, DAILY_RATE_LIMIT_WINDOW_MS, FALLBACK_ANSWER, SHORT_RATE_LIMIT_MAX, SHORT_RATE_LIMIT_WINDOW_MS } from "../assistant.constants";
import type { AssistantRateLimitResult, AssistantResponseInput, IAssistantService } from "../interfaces/assistant.service.interface";
import { encodeStreamEvent, formatContext } from "../mappers/assistant-stream.mapper";
import { CHAT_SYSTEM_PROMPT } from "../prompts/portfolio-assistant.prompt";
import type { IOpenAIProvider } from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import type { ISearchIndexService } from "@/server/modules/search-index/public";
type WindowCounter = { count: number; resetAt: number };

export class AssistantService implements IAssistantService {
  private readonly shortCounters = new Map<string, WindowCounter>();
  private readonly dailyCounters = new Map<string, WindowCounter>();
  constructor(private readonly openai: IOpenAIProvider, private readonly searchIndex: ISearchIndexService) {}
  checkRateLimit(clientIdentifier: string): AssistantRateLimitResult {
    const now = Date.now(); this.prune(this.shortCounters, now); this.prune(this.dailyCounters, now);
    const short = this.counter(this.shortCounters, clientIdentifier, now, SHORT_RATE_LIMIT_WINDOW_MS); const daily = this.counter(this.dailyCounters, clientIdentifier, now, DAILY_RATE_LIMIT_WINDOW_MS);
    if (short.count >= SHORT_RATE_LIMIT_MAX) return { allowed: false, error: "Too many messages. Please try again in a few minutes.", limit: SHORT_RATE_LIMIT_MAX, remaining: 0, resetAt: short.resetAt };
    if (daily.count >= DAILY_RATE_LIMIT_MAX) return { allowed: false, error: "Daily message limit reached. Please try again later.", limit: DAILY_RATE_LIMIT_MAX, remaining: 0, resetAt: daily.resetAt };
    short.count += 1; daily.count += 1; return { allowed: true };
  }
  createResponse({ message, previousResponseId, signal }: AssistantResponseInput) {
    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({ start: async (controller) => { const write = (event: import("@/contracts/assistant.contract").AssistantStreamEvent) => controller.enqueue(encoder.encode(encodeStreamEvent(event))); let didStreamText = false; let responseId: string | null = null; try { const { chunks, sources } = await this.retrieveContext(message); if (!chunks.length && !previousResponseId) { write({ type: "delta", delta: FALLBACK_ANSWER }); write({ type: "done" }); return; } const response = await this.openai.streamResponse(`Portfolio information:\n\n${chunks.length ? formatContext(chunks) : "No additional portfolio information is available for this message. Use prior conversation only if it contains enough relevant portfolio information."}\n\nCurrent user question:\n${message}`, CHAT_SYSTEM_PROMPT, previousResponseId, signal); for await (const event of response) { if (signal.aborted) return; if (event.type === "response.created" || event.type === "response.completed") responseId = event.response.id; if (event.type === "response.output_text.delta" && event.delta) { didStreamText = true; write({ type: "delta", delta: event.delta }); } if (event.type === "error") throw new Error(event.message); if (event.type === "response.failed") throw new Error(event.response.error?.message || "OpenAI response failed."); } write({ type: "sources", sources }); if (!didStreamText) write({ type: "delta", delta: FALLBACK_ANSWER }); if (responseId) write({ type: "response_id", responseId }); write({ type: "done" }); } catch (error) { if (!signal.aborted) { console.error("Assistant response failed", error); write({ type: "error", error: "The assistant could not respond. Please try again." }); } } finally { controller.close(); } } });
  }
  private counter(counters: Map<string, WindowCounter>, key: string, now: number, windowMs: number) { const current = counters.get(key); if (current && current.resetAt > now) return current; const next = { count: 0, resetAt: now + windowMs }; counters.set(key, next); return next; }
  private prune(counters: Map<string, WindowCounter>, now: number) { for (const [key, counter] of counters) if (counter.resetAt <= now) counters.delete(key); }
  private async retrieveContext(message: string) { const embedding = await this.openai.createEmbedding(`\nUser question:\n${message}\n\nRetrieve information about:\n- Freeman's projects and engineering work\n- technical experience and skills\n- systems, architectures and technologies built\n- professional background and achievements\n`); if (!embedding) throw new Error("Failed to create query embedding."); const chunks = await this.searchIndex.search(embedding); return { chunks, sources: chunks.map((chunk) => ({ id: chunk.id, title: chunk.title, url: chunk.url })) }; }
}
