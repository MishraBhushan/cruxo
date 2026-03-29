"use server";

import { generateText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import type { ArgumentCard, CardCategory } from "@/lib/types";
import { getCachedCards, setCachedCards } from "@/lib/cache";
import { assertBedrockEnv } from "@/lib/env";
import { log } from "@/lib/logger";

interface GeneratedCard {
  text: string;
  category: CardCategory;
}

interface PushbackResponse {
  pushbackMessage: string;
  counterArgument: {
    text: string;
    category: CardCategory;
  };
}

interface ResultsResponse {
  blindSpot: string;
  crux: string;
  nextStep: string;
}

function parseJSON<T>(text: string): T {
  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [
    null,
    text,
  ];
  const cleaned = (jsonMatch[1] ?? text).trim();
  return JSON.parse(cleaned) as T;
}

export async function generateCards(
  question: string
): Promise<ArgumentCard[]> {
  assertBedrockEnv();

  // Check cache first
  const cached = getCachedCards(question);
  if (cached) {
    log({ event: "generate_cards", question, cardCount: cached.length, cached: true });
    return cached;
  }

  const start = Date.now();
  const { text } = await generateText({
    model: bedrock("us.amazon.nova-2-lite-v1:0"),
    prompt: `You are generating arguments about a decision someone is wrestling with.

DECISION: "${question}"

Generate exactly 8 arguments — a mix of arguments that support this decision and arguments that challenge it.

RULES:
- Each argument must be specific and concrete, not generic platitudes
- Use plain language a smart teenager would understand
- Do NOT hedge — no "on the other hand" or "it depends"
- Do NOT indicate whether each argument is for or against — let the user decide
- Each argument should be 1-2 sentences maximum
- Cover diverse categories: financial, emotional, practical, social, career, health, legal
- Make arguments that would genuinely matter to someone making this decision
- Be OPINIONATED — state claims directly, not "some people think..."

Respond with ONLY a JSON object in this exact format, no other text:
{"cards": [{"text": "argument text", "category": "financial"}, ...]}

Valid categories: financial, emotional, practical, social, health, career, legal, other`,
  });

  const parsed = parseJSON<{ cards: GeneratedCard[] }>(text);

  const cards = parsed.cards.map((card) => ({
    id: crypto.randomUUID(),
    text: card.text,
    category: card.category,
    position: "uncertain" as const,
    source: "ai" as const,
  }));

  setCachedCards(question, cards);
  log({ event: "generate_cards", question, cardCount: cards.length, cached: false, durationMs: Date.now() - start });

  return cards;
}

export async function generatePushback(
  question: string,
  sortedCards: ArgumentCard[],
  isSecondPushback: boolean
): Promise<{ message: string; card: ArgumentCard }> {
  assertBedrockEnv();

  const start = Date.now();
  const supports = sortedCards.filter((c) => c.position === "supports");
  const challenges = sortedCards.filter((c) => c.position === "challenges");
  const fastSorts = sortedCards.filter(
    (c) => c.sortTimeMs !== undefined && c.sortTimeMs < 2000
  );
  const dominant =
    supports.length >= challenges.length ? "supports" : "challenges";
  const dominantCards =
    dominant === "supports" ? supports : challenges;

  const { text } = await generateText({
    model: bedrock("us.amazon.nova-2-lite-v1:0"),
    prompt: `You are a brutally honest thinking partner. Someone is deciding: "${question}"

They've sorted ${sortedCards.length} argument cards so far:
- ${supports.length} sorted to SUPPORTS (agrees with the decision)
- ${challenges.length} sorted to CHALLENGES (disagrees with the decision)
${fastSorts.length > 0 ? `- ${fastSorts.length} cards were sorted in under 2 seconds (they didn't read them)` : ""}

Their dominant lean: ${dominant} (${Math.round((dominantCards.length / sortedCards.length) * 100)}%)

The arguments they sorted to ${dominant}:
${dominantCards.map((c) => `- "${c.text}"`).join("\n")}

${isSecondPushback ? "This is your SECOND pushback. Be STRONGER. They've seen one pushback already and continued their pattern." : ""}

YOUR JOB:
1. Write a pushbackMessage: ONE sentence, max 20 words. Call out their bias directly. No preamble.
2. Generate ONE counter-argument: ONE sentence, max 25 words. Specific and concrete.

HARD RULE: Each field must be ONE sentence. Not two. Not a paragraph. ONE.

NEVER say: "That's interesting", "There are valid points", "It depends"
ALWAYS: Take a position. Be direct. Be uncomfortable.

Respond with ONLY a JSON object:
{"pushbackMessage": "your direct observation — ONE sentence", "counterArgument": {"text": "counter-argument — ONE sentence", "category": "financial"}}

Valid categories: financial, emotional, practical, social, health, career, legal, other`,
  });

  const parsed = parseJSON<PushbackResponse>(text);

  log({
    event: "generate_pushback",
    question,
    phase: isSecondPushback ? "pushback_2" : "pushback_1",
    leanDirection: dominant,
    leanPercentage: Math.round((dominantCards.length / sortedCards.length) * 100),
    durationMs: Date.now() - start,
  });

  return {
    message: parsed.pushbackMessage,
    card: {
      id: crypto.randomUUID(),
      text: parsed.counterArgument.text,
      category: parsed.counterArgument.category,
      position: "uncertain",
      source: "pushback",
    },
  };
}

export async function generateResults(
  question: string,
  sortedCards: ArgumentCard[],
  analysis: {
    supportCount: number;
    challengeCount: number;
    leanDirection: "supports" | "challenges" | "balanced";
    leanPercentage: number;
    fastSortCount: number;
    ignoredCategories: CardCategory[];
    confidence: "low" | "medium" | "high";
  }
): Promise<ResultsResponse> {
  assertBedrockEnv();

  const start = Date.now();
  const supports = sortedCards.filter((c) => c.position === "supports");
  const challenges = sortedCards.filter((c) => c.position === "challenges");
  const fastSorts = sortedCards.filter(
    (c) => c.sortTimeMs !== undefined && c.sortTimeMs < 2000
  );

  const { text } = await generateText({
    model: bedrock("us.amazon.nova-2-lite-v1:0"),
    prompt: `You are analyzing someone's decision-making process. They decided about: "${question}"

Their full sorting results:
SUPPORTS (${supports.length} cards):
${supports.map((c) => `- "${c.text}" [${c.category}] ${c.sortTimeMs && c.sortTimeMs < 2000 ? "(sorted in <2s — didn't read)" : ""}`).join("\n")}

CHALLENGES (${challenges.length} cards):
${challenges.map((c) => `- "${c.text}" [${c.category}] ${c.sortTimeMs && c.sortTimeMs < 2000 ? "(sorted in <2s — didn't read)" : ""}`).join("\n")}

Fast sorts (under 2 seconds): ${fastSorts.length} cards

Interaction summary:
- Support count: ${analysis.supportCount}
- Challenge count: ${analysis.challengeCount}
- Lean: ${analysis.leanDirection} (${analysis.leanPercentage}% support)
- Confidence: ${analysis.confidence}
${analysis.ignoredCategories.length > 0 ? `- Fast one-sided categories: ${analysis.ignoredCategories.join(", ")}` : ""}

YOUR JOB — three outputs. HARD RULE: Each must be ONE sentence, max 20 words. No paragraphs.

1. BLIND SPOT: ONE sentence naming what they're ignoring. Max 20 words.

2. THE CRUX: ONE sentence starting with "This hinges on whether..." Max 20 words. Must be a researchable question.

3. NEXT STEP: ONE sentence starting with a verb. Max 15 words. Specific action, under 1 hour.

If confidence is low, do not pretend the user is settled. Focus on what they still need to test or verify.

Respond with ONLY a JSON object:
{"blindSpot": "ONE sentence max 20 words", "crux": "This hinges on whether... ONE sentence max 20 words", "nextStep": "Verb... ONE sentence max 15 words"}`,
  });

  const total = sortedCards.length || 1;
  const supportPct = Math.round((supports.length / total) * 100);

  const parsed = parseJSON<ResultsResponse>(text);

  log({
    event: "generate_results",
    question,
    phase: "results",
    cardCount: sortedCards.length,
    leanDirection: supportPct > 60 ? "supports" : supportPct < 40 ? "challenges" : "balanced",
    leanPercentage: supportPct,
    durationMs: Date.now() - start,
  });

  return parsed;
}
