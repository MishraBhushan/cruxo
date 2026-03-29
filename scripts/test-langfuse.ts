/**
 * Quick test: verify Langfuse receives traces from Cruxo
 * Usage: npx tsx scripts/test-langfuse.ts
 */
import { generateText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { Langfuse } from "langfuse";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envContent = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of envContent.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
}

async function main() {
  const lf = new Langfuse({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
    secretKey: process.env.LANGFUSE_SECRET_KEY!,
    baseUrl: process.env.LANGFUSE_BASE_URL!,
  });

  const trace = lf.trace({
    name: "cruxo-integration-test",
    input: { question: "Should I add Langfuse to Cruxo?" },
    tags: ["test", "cruxo"],
  });

  const start = Date.now();
  const { text } = await generateText({
    model: bedrock("us.amazon.nova-2-lite-v1:0"),
    prompt: "Say 'Langfuse is connected' in one sentence.",
  });

  trace.generation({
    name: "test-generation",
    model: "us.amazon.nova-2-lite-v1:0",
    input: "Say 'Langfuse is connected' in one sentence.",
    output: text,
    metadata: { durationMs: Date.now() - start },
  });

  await lf.flushAsync();
  console.log("Trace ID:", trace.id);
  console.log("Response:", text);
  console.log("Check Langfuse dashboard: https://us.cloud.langfuse.com");
}

main().catch(console.error);
