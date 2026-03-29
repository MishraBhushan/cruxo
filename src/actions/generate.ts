"use server";

import { generateText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import type { ArgumentCard, CardCategory } from "@/lib/types";
import { getCachedCards, setCachedCards } from "@/lib/cache";
import { assertBedrockEnv } from "@/lib/env";
import { log } from "@/lib/logger";
import { createSessionTrace, logGeneration, flushLangfuse } from "@/lib/langfuse";

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
  patternInsight: string;
  strongestFor: string;
  strongestAgainst: string;
  premortem: string;
  thirdOption: string;
  doorType: "one-way" | "two-way";
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

const SHARED_CARD_RULES = `RULES:
- Each argument must be specific and concrete, not generic platitudes
- Use plain language a smart teenager would understand
- Do NOT hedge — no "on the other hand" or "it depends"
- Each argument should be 1-2 sentences maximum
- Be OPINIONATED — state claims directly, not "some people think..."
- CRITICAL: Each argument must argue ONE DIRECTION ONLY. Never include "but" or "however." Each card is ONE claim.
- At least 1 argument must include a SECOND-ORDER EFFECT — a consequence of the consequence
- Include at least 1 SURPRISING argument — something a smart person wouldn't immediately think of
- If the decision involves a specific domain (insurance, legal, tax, visa), include domain-specific facts and terminology
- When citing numbers, only use figures you are confident about. If estimating, say "roughly" or "approximately."

Respond with ONLY a JSON object in this exact format, no other text:
{"cards": [{"text": "argument text", "category": "financial"}, ...]}

Valid categories: financial, emotional, practical, social, health, career, legal, other`;

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
  const trace = createSessionTrace(question);

  // Multi-agent: Advocate and Critic generate cards in parallel
  const [advocateResult, criticResult] = await Promise.all([
    generateText({
      model: bedrock("us.amazon.nova-2-lite-v1:0"),
      prompt: `You are the ADVOCATE — your job is to build the strongest possible case FOR this decision. You are fully committed to this position. No hedging, no balance, no "devil's advocate." You believe this is the right choice.

DECISION: "${question}"

Generate exactly 4 arguments that make the strongest case FOR going ahead with this decision. Each argument should make the reader think "wow, I hadn't considered that" or "that's a really compelling point."

Cover different categories — don't put all 4 in the same bucket.

Do NOT label them as "for" or "against" — just state each claim as fact.

${SHARED_CARD_RULES}`,
    }),
    generateText({
      model: bedrock("us.amazon.nova-2-lite-v1:0"),
      prompt: `You are the CRITIC — your job is to build the strongest possible case AGAINST this decision. You are fully committed to this position. No hedging, no balance, no silver linings. You believe this is a mistake.

DECISION: "${question}"

Generate exactly 4 arguments that make the strongest case AGAINST going ahead with this decision. Each argument should make the reader uncomfortable — name real risks, real costs, real consequences they're probably ignoring.

Cover different categories — don't put all 4 in the same bucket.

Do NOT label them as "for" or "against" — just state each claim as fact.

${SHARED_CARD_RULES}`,
    }),
  ]);

  const advocateCards = parseJSON<{ cards: GeneratedCard[] }>(advocateResult.text).cards;
  const criticCards = parseJSON<{ cards: GeneratedCard[] }>(criticResult.text).cards;

  // Log both generations to Langfuse
  if (trace) {
    logGeneration(trace, { name: "advocate", model: "us.amazon.nova-2-lite-v1:0", input: question, output: advocateResult.text, durationMs: Date.now() - start });
    logGeneration(trace, { name: "critic", model: "us.amazon.nova-2-lite-v1:0", input: question, output: criticResult.text, durationMs: Date.now() - start });
  }

  // Interleave: advocate, critic, advocate, critic... so user sees alternating perspectives
  const interleaved: GeneratedCard[] = [];
  const maxLen = Math.max(advocateCards.length, criticCards.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < advocateCards.length) interleaved.push(advocateCards[i]);
    if (i < criticCards.length) interleaved.push(criticCards[i]);
  }

  const cards = interleaved.map((card) => ({
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
1. Write a pushbackMessage: ONE sentence, max 20 words. Pick the WEAKEST argument from their dominant pile above and QUOTE a few words from it. Then explain why that specific claim is wrong or overconfident. Format: "You sorted '[3-5 words from the card]' to ${dominant}, but [why it's wrong]."
2. Generate ONE counter-argument: ONE sentence, max 25 words. This must be a SPECIFIC, FALSIFIABLE claim — something they can verify or disprove with evidence. Not a feeling, not a platitude.

HARD RULE: Each field must be ONE sentence. Not two. Not a paragraph. ONE.

NEVER say: "That's interesting", "There are valid points", "It depends", "You're ignoring the risks", "You've only seen what you want to see"
ALWAYS: Name the specific argument you're attacking. Be direct. Be uncomfortable. Be falsifiable.

Respond with ONLY a JSON object:
{"pushbackMessage": "your direct observation — ONE sentence", "counterArgument": {"text": "counter-argument — ONE sentence", "category": "financial"}}

Valid categories: financial, emotional, practical, social, health, career, legal, other`,
  });

  const parsed = parseJSON<PushbackResponse>(text);

  // Langfuse: log pushback generation
  const trace = createSessionTrace(question);
  if (trace) {
    logGeneration(trace, { name: "pushback", model: "us.amazon.nova-2-lite-v1:0", input: question, output: text, durationMs: Date.now() - start });
    void flushLangfuse();
  }

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

YOUR JOB — six outputs. Be specific and useful, not generic. Reference their actual arguments.

1. PATTERN INSIGHT (2-3 sentences, max 50 words): What their sorting pattern reveals about how they're thinking. QUOTE the specific card text they rushed through fastest (the one sorted in <2s). Show them something they didn't notice — "You dismissed '[card text]' in under 2 seconds, but that's the argument that matters most."

2. BLIND SPOT (2 sentences, max 35 words): Name what they're ignoring. Reference a SPECIFIC card they dismissed or rushed, by quoting its text. Not "you ignored financial arguments" — instead "You dismissed the argument about [specific text] without engaging."

3. STRONGEST FOR (1 sentence, max 25 words): The single most compelling reason to go ahead, based on their support pile. Pick the one with the strongest evidence.

4. STRONGEST AGAINST (1 sentence, max 25 words): The single most compelling reason NOT to do this. Pick from challenges pile or from what they dismissed too fast.

5. THE CRUX (2-3 sentences, max 50 words): Start with "This decision hinges on..." Frame it as a SPECIFIC, TESTABLE question with an if/then structure: "If [specific condition is true], then [action A]. If not, [action B]." This must be something they can actually go verify — a number, a conversation, a data point.

6. NEXT STEP (2 sentences, max 30 words): Start with a verb. Give a HYPER-SPECIFIC action: who to call, what to look up, what to calculate. Then state what the answer tells them. Not "research options" — instead "Call [specific person/office] and ask [specific question]."

7. PREMORTEM (1-2 sentences, max 30 words): "It's one year from now and this decision was a disaster. The most likely reason:" Name the single most probable failure mode based on what they're ignoring. Be vivid and specific.

8. THIRD OPTION (1-2 sentences, max 30 words): Instead of yes or no, what's a creative third path they haven't considered? Frame it as: "What if instead you..." This should be a genuine lateral alternative, not a compromise.

9. DOOR TYPE (one word: "one-way" or "two-way"): Is this decision reversible? "one-way" = hard to undo (quitting a job, selling a house). "two-way" = easy to reverse (trying a new tool, testing a market).

If confidence is low, do not pretend the user is settled. Focus on what they still need to test or verify.

NEVER say: "That's interesting", "There are valid points", "It depends", "Consider both sides"
ALWAYS: Be direct, specific, and reference their actual sorting behavior.

Respond with ONLY a JSON object:
{"patternInsight": "2-3 sentences", "blindSpot": "2 sentences", "strongestFor": "1 sentence", "strongestAgainst": "1 sentence", "crux": "2-3 sentences starting with This decision hinges on...", "nextStep": "2 sentences starting with a verb", "premortem": "1-2 sentences", "thirdOption": "1-2 sentences starting with What if instead you...", "doorType": "one-way or two-way"}`,
  });

  const total = sortedCards.length || 1;
  const supportPct = Math.round((supports.length / total) * 100);

  const parsed = parseJSON<ResultsResponse>(text);

  // Langfuse: log results generation + scores
  const trace = createSessionTrace(question);
  if (trace) {
    logGeneration(trace, { name: "results", model: "us.amazon.nova-2-lite-v1:0", input: question, output: text, durationMs: Date.now() - start });
    void flushLangfuse();
  }

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
