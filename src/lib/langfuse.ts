/**
 * Langfuse Client — LLM Observability for Cruxo
 *
 * Traces every Bedrock call: prompt, response, tokens, latency, cost.
 * Sends async — never blocks the user request.
 *
 * @see https://langfuse.com/docs/sdk/typescript
 */

import { Langfuse } from "langfuse";

let instance: Langfuse | null = null;

function isEnabled(): boolean {
  return !!(
    process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY
  );
}

export function getLangfuse(): Langfuse | null {
  if (!isEnabled()) return null;

  if (!instance) {
    instance = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
      secretKey: process.env.LANGFUSE_SECRET_KEY!,
      baseUrl: process.env.LANGFUSE_BASE_URL || "https://us.cloud.langfuse.com",
      flushAt: 10,
      flushInterval: 5000,
    });
  }

  return instance;
}

/**
 * Create a session trace for one full Cruxo decision flow
 */
export function createSessionTrace(question: string) {
  const lf = getLangfuse();
  if (!lf) return null;

  return lf.trace({
    name: "cruxo-session",
    input: { question },
    metadata: {
      source: "cruxo",
      promptVersion: "iter-4",
    },
    tags: ["cruxo", "decision"],
  });
}

/**
 * Log a generation (LLM call) under a trace
 */
export function logGeneration(
  trace: ReturnType<Langfuse["trace"]>,
  opts: {
    name: string;
    model: string;
    input: string;
    output: string;
    durationMs: number;
  }
) {
  if (!trace) return;

  trace.generation({
    name: opts.name,
    model: opts.model,
    input: opts.input,
    output: opts.output,
    metadata: {
      durationMs: opts.durationMs,
    },
  });
}

/**
 * Log evaluation scores for a session
 */
export function logScore(
  trace: ReturnType<Langfuse["trace"]>,
  name: string,
  value: number,
  comment?: string
) {
  const lf = getLangfuse();
  if (!lf || !trace) return;

  lf.score({
    traceId: trace.id,
    name,
    value,
    comment,
    dataType: "NUMERIC" as const,
  });
}

/**
 * Flush pending events — call on session end
 */
export async function flushLangfuse(): Promise<void> {
  if (instance) {
    await instance.flushAsync();
  }
}
