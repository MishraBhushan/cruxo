/**
 * Cruxo Prompt Quality Test Harness
 *
 * Runs the full pipeline (cards → simulated sorting → pushback → results)
 * for multiple real-world questions and evaluates output quality.
 *
 * Usage: npx tsx scripts/test-prompts.ts
 *
 * Goal: Every question should produce results where:
 * - Cards are specific, not generic platitudes (score >= 7/10)
 * - Pushback is sharp and uncomfortable (score >= 7/10)
 * - Results are actionable and reference actual arguments (score >= 7/10)
 * - Overall: user would change behavior after reading results
 */

import { generateText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { resolve } from "path";
import { readFileSync } from "fs";

// Load .env.local manually (no dotenv dependency)
const envPath = resolve(process.cwd(), ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* ignore */ }

// ─── Types ───────────────────────────────────────────────────────────

interface Card {
  text: string;
  category: string;
}

interface SortedCard extends Card {
  id: string;
  position: "supports" | "challenges";
  source: "ai" | "pushback";
  sortTimeMs: number;
}

interface ResultsResponse {
  patternInsight: string;
  blindSpot: string;
  strongestFor: string;
  strongestAgainst: string;
  crux: string;
  nextStep: string;
  premortem: string;
  thirdOption: string;
  doorType: "one-way" | "two-way";
}

interface PushbackResponse {
  pushbackMessage: string;
  counterArgument: { text: string; category: string };
}

interface TestResult {
  question: string;
  cards: Card[];
  pushback: PushbackResponse | null;
  results: ResultsResponse;
  scores: {
    cardSpecificity: number;
    cardDiversity: number;
    pushbackSharpness: number;
    resultActionability: number;
    resultSpecificity: number;
    overallScore: number;
  };
  issues: string[];
  durationMs: number;
}

// ─── Test Questions ──────────────────────────────────────────────────
// Real questions real people would ask — across immigrant, founder, career domains

const TEST_QUESTIONS = [
  // Immigrant decisions
  "Should I pay for the parking damage myself or file an insurance claim in Germany?",
  "Should I take a permanent residence permit or keep my work visa in the EU?",
  "Should I send my kids to an international school or the local German school?",

  // Founder decisions
  "Should I hire a senior engineer at 150k or two juniors at 75k each?",
  "Should I pivot from B2B to B2C after 6 months of slow enterprise sales?",
  "Should I take the 2M seed round at 8M valuation or bootstrap for 6 more months?",

  // Career / life decisions
  "Should I quit my stable corporate job to join an early-stage startup?",
  "Should I move from Berlin to San Francisco for a tech career?",
  "Should I go back to school for an MBA or learn by doing?",

  // Specific real-world decisions (the Munich parking accident type)
  "Should I buy or lease a car as an expat in Germany?",
  "Should I negotiate my salary offer or accept it as-is?",
  "Should I confront my co-founder about equity split now or wait until revenue?",
];

// ─── Prompts (mirrors generate.ts) ──────────────────────────────────

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

function advocatePrompt(question: string): string {
  return `You are the ADVOCATE — your job is to build the strongest possible case FOR this decision. You are fully committed to this position. No hedging, no balance, no "devil's advocate." You believe this is the right choice.

DECISION: "${question}"

Generate exactly 4 arguments that make the strongest case FOR going ahead with this decision. Each argument should make the reader think "wow, I hadn't considered that" or "that's a really compelling point."

Cover different categories — don't put all 4 in the same bucket.

Do NOT label them as "for" or "against" — just state each claim as fact.

${SHARED_CARD_RULES}`;
}

function criticPrompt(question: string): string {
  return `You are the CRITIC — your job is to build the strongest possible case AGAINST this decision. You are fully committed to this position. No hedging, no balance, no silver linings. You believe this is a mistake.

DECISION: "${question}"

Generate exactly 4 arguments that make the strongest case AGAINST going ahead with this decision. Each argument should make the reader uncomfortable — name real risks, real costs, real consequences they're probably ignoring.

Cover different categories — don't put all 4 in the same bucket.

Do NOT label them as "for" or "against" — just state each claim as fact.

${SHARED_CARD_RULES}`;
}

function pushbackPrompt(
  question: string,
  sortedCards: SortedCard[],
  isSecond: boolean
): string {
  const supports = sortedCards.filter((c) => c.position === "supports");
  const challenges = sortedCards.filter((c) => c.position === "challenges");
  const fastSorts = sortedCards.filter((c) => c.sortTimeMs < 2000);
  const dominant = supports.length >= challenges.length ? "supports" : "challenges";
  const dominantCards = dominant === "supports" ? supports : challenges;

  return `You are a brutally honest thinking partner. Someone is deciding: "${question}"

They've sorted ${sortedCards.length} argument cards so far:
- ${supports.length} sorted to SUPPORTS (agrees with the decision)
- ${challenges.length} sorted to CHALLENGES (disagrees with the decision)
${fastSorts.length > 0 ? `- ${fastSorts.length} cards were sorted in under 2 seconds (they didn't read them)` : ""}

Their dominant lean: ${dominant} (${Math.round((dominantCards.length / sortedCards.length) * 100)}%)

The arguments they sorted to ${dominant}:
${dominantCards.map((c) => `- "${c.text}"`).join("\n")}

${isSecond ? "This is your SECOND pushback. Be STRONGER. They've seen one pushback already and continued their pattern." : ""}

YOUR JOB:
1. Write a pushbackMessage: ONE sentence, max 20 words. Pick the WEAKEST argument from their dominant pile above and QUOTE a few words from it. Then explain why that specific claim is wrong or overconfident. Format: "You sorted '[3-5 words from the card]' to ${dominant}, but [why it's wrong]."
2. Generate ONE counter-argument: ONE sentence, max 25 words. This must be a SPECIFIC, FALSIFIABLE claim — something they can verify or disprove with evidence. Not a feeling, not a platitude.

HARD RULE: Each field must be ONE sentence. Not two. Not a paragraph. ONE.

NEVER say: "That's interesting", "There are valid points", "It depends", "You're ignoring the risks", "You've only seen what you want to see"
ALWAYS: Name the specific argument you're attacking. Be direct. Be uncomfortable. Be falsifiable.

Respond with ONLY a JSON object:
{"pushbackMessage": "your direct observation — ONE sentence", "counterArgument": {"text": "counter-argument — ONE sentence", "category": "financial"}}

Valid categories: financial, emotional, practical, social, health, career, legal, other`;
}

function resultsPrompt(
  question: string,
  sortedCards: SortedCard[],
  analysis: { supportCount: number; challengeCount: number; leanDirection: string; leanPercentage: number; fastSortCount: number; ignoredCategories: string[]; confidence: string }
): string {
  const supports = sortedCards.filter((c) => c.position === "supports");
  const challenges = sortedCards.filter((c) => c.position === "challenges");
  const fastSorts = sortedCards.filter((c) => c.sortTimeMs < 2000);

  return `You are analyzing someone's decision-making process. They decided about: "${question}"

Their full sorting results:
SUPPORTS (${supports.length} cards):
${supports.map((c) => `- "${c.text}" [${c.category}] ${c.sortTimeMs < 2000 ? "(sorted in <2s — didn't read)" : ""}`).join("\n")}

CHALLENGES (${challenges.length} cards):
${challenges.map((c) => `- "${c.text}" [${c.category}] ${c.sortTimeMs < 2000 ? "(sorted in <2s — didn't read)" : ""}`).join("\n")}

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
{"patternInsight": "2-3 sentences", "blindSpot": "2 sentences", "strongestFor": "1 sentence", "strongestAgainst": "1 sentence", "crux": "2-3 sentences starting with This decision hinges on...", "nextStep": "2 sentences starting with a verb", "premortem": "1-2 sentences", "thirdOption": "1-2 sentences starting with What if instead you...", "doorType": "one-way or two-way"}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function parseJSON<T>(text: string): T {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
  const cleaned = (jsonMatch[1] ?? text).trim();
  return JSON.parse(cleaned) as T;
}

function simulateSorting(cards: Card[]): SortedCard[] {
  // Simulate a biased user: 75% support, some fast sorts
  return cards.map((card, i) => ({
    ...card,
    id: `card-${i}`,
    position: (i < 6 ? "supports" : "challenges") as "supports" | "challenges",
    source: "ai" as const,
    sortTimeMs: i < 2 ? 800 : i < 4 ? 1500 : 3000 + Math.random() * 2000,
  }));
}

function analyzeCards(sorted: SortedCard[]) {
  const supports = sorted.filter((c) => c.position === "supports");
  const challenges = sorted.filter((c) => c.position === "challenges");
  const fastSorts = sorted.filter((c) => c.sortTimeMs < 2000);
  const total = sorted.length || 1;
  const supportPct = Math.round((supports.length / total) * 100);

  return {
    supportCount: supports.length,
    challengeCount: challenges.length,
    leanDirection: supportPct > 60 ? "supports" : supportPct < 40 ? "challenges" : "balanced",
    leanPercentage: supportPct,
    fastSortCount: fastSorts.length,
    ignoredCategories: [] as string[],
    confidence: fastSorts.length >= 3 ? "low" : supports.length > 0 && challenges.length > 0 ? "medium" : "low",
  };
}

// ─── Scoring ─────────────────────────────────────────────────────────

function scoreCards(cards: Card[], question: string): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 10;

  // Check count
  if (cards.length !== 8) {
    issues.push(`Expected 8 cards, got ${cards.length}`);
    score -= 3;
  }

  // Check category diversity
  const categories = new Set(cards.map((c) => c.category));
  if (categories.size < 4) {
    issues.push(`Low category diversity: only ${categories.size} categories (${[...categories].join(", ")})`);
    score -= 2;
  }

  // Check for generic platitudes
  const genericPhrases = [
    "it depends", "on the other hand", "some people think", "there are pros and cons",
    "it's important to consider", "you should think about", "many factors",
    "it varies", "everyone is different", "there's no right answer",
  ];
  for (const card of cards) {
    for (const phrase of genericPhrases) {
      if (card.text.toLowerCase().includes(phrase)) {
        issues.push(`Generic platitude in card: "${card.text.substring(0, 50)}..."`);
        score -= 1;
      }
    }
  }

  // Check text length — too short = not specific enough
  for (const card of cards) {
    if (card.text.split(" ").length < 8) {
      issues.push(`Card too short (${card.text.split(" ").length} words): "${card.text}"`);
      score -= 1;
    }
  }

  // Check for two-direction cards (contains "but", "however", "although" hedging)
  const hedgeWords = [", but ", ", however,", ", although ", ", yet "];
  for (const card of cards) {
    for (const hedge of hedgeWords) {
      if (card.text.toLowerCase().includes(hedge)) {
        issues.push(`Two-direction card (contains "${hedge.trim()}"): "${card.text.substring(0, 60)}..."`);
        score -= 2;
      }
    }
  }

  // Check if arguments are specific to the question
  const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  let relevantCards = 0;
  for (const card of cards) {
    const cardLower = card.text.toLowerCase();
    if (questionWords.some(w => cardLower.includes(w))) relevantCards++;
  }
  if (relevantCards < 3) {
    issues.push(`Only ${relevantCards}/8 cards reference question-specific terms`);
    score -= 2;
  }

  return { score: Math.max(1, score), issues };
}

function scorePushback(pb: PushbackResponse | null): { score: number; issues: string[] } {
  if (!pb) return { score: 0, issues: ["No pushback generated"] };
  const issues: string[] = [];
  let score = 10;

  // Check message length
  const msgWords = pb.pushbackMessage.split(" ").length;
  if (msgWords > 25) {
    issues.push(`Pushback message too long: ${msgWords} words`);
    score -= 2;
  }
  if (msgWords < 5) {
    issues.push(`Pushback message too short: ${msgWords} words`);
    score -= 2;
  }

  // Check for sycophantic or generic pushback language
  const sycophantic = ["interesting", "valid points", "good job", "well done", "great thinking",
    "you're ignoring the risks", "you've only seen what you want", "ignoring real risks",
    "you've only listed", "you only support", "confirmation bias"];
  for (const phrase of sycophantic) {
    if (pb.pushbackMessage.toLowerCase().includes(phrase)) {
      issues.push(`Generic/sycophantic pushback: "${phrase}"`);
      score -= 3;
    }
  }

  // Check counter-argument
  const caWords = pb.counterArgument.text.split(" ").length;
  if (caWords > 30) {
    issues.push(`Counter-argument too long: ${caWords} words`);
    score -= 1;
  }

  return { score: Math.max(1, score), issues };
}

function scoreResults(results: ResultsResponse, question: string): { actionability: number; specificity: number; issues: string[] } {
  const issues: string[] = [];
  let actionability = 10;
  let specificity = 10;

  // Check pattern insight
  if (!results.patternInsight || results.patternInsight.split(" ").length < 10) {
    issues.push("Pattern insight too thin");
    specificity -= 2;
  }

  // Check blind spot
  if (!results.blindSpot || results.blindSpot.split(" ").length < 8) {
    issues.push("Blind spot too vague");
    specificity -= 2;
  }

  // Check crux starts correctly
  if (!results.crux?.toLowerCase().startsWith("this")) {
    issues.push(`Crux doesn't start with "This decision hinges on...": "${results.crux?.substring(0, 40)}"`);
    specificity -= 1;
  }

  // Check next step starts with a verb
  if (results.nextStep) {
    const firstWord = results.nextStep.split(" ")[0]?.toLowerCase();
    const commonVerbs = ["research", "calculate", "call", "ask", "write", "list", "open", "check", "map", "talk", "schedule", "find", "compare", "test", "run", "set", "make", "reach", "draft", "spend", "visit", "look", "review", "gather", "interview", "email", "contact"];
    if (!commonVerbs.some(v => firstWord?.startsWith(v))) {
      issues.push(`Next step doesn't start with a verb: "${results.nextStep?.substring(0, 40)}"`);
      actionability -= 2;
    }
  }

  // Check for generic language in results
  const genericPhrases = ["it depends", "consider both sides", "there are valid points", "it's important to"];
  for (const field of [results.patternInsight, results.blindSpot, results.crux, results.nextStep]) {
    if (!field) continue;
    for (const phrase of genericPhrases) {
      if (field.toLowerCase().includes(phrase)) {
        issues.push(`Generic language in results: "${phrase}"`);
        specificity -= 2;
      }
    }
  }

  // Check strongestFor and strongestAgainst exist and are substantial
  if (!results.strongestFor || results.strongestFor.split(" ").length < 6) {
    issues.push("Strongest-for too thin");
    specificity -= 1;
  }
  if (!results.strongestAgainst || results.strongestAgainst.split(" ").length < 6) {
    issues.push("Strongest-against too thin");
    specificity -= 1;
  }

  // Check premortem
  if (!results.premortem || results.premortem.split(" ").length < 8) {
    issues.push("Premortem too thin or missing");
    actionability -= 1;
  }

  // Check third option starts with "What if"
  if (results.thirdOption && !results.thirdOption.toLowerCase().startsWith("what if")) {
    issues.push(`Third option doesn't start with "What if": "${results.thirdOption?.substring(0, 40)}"`);
    specificity -= 1;
  }
  if (!results.thirdOption || results.thirdOption.split(" ").length < 6) {
    issues.push("Third option too thin or missing");
    specificity -= 1;
  }

  // Check door type
  if (!results.doorType || !["one-way", "two-way"].includes(results.doorType)) {
    issues.push(`Invalid or missing door type: "${results.doorType}"`);
    specificity -= 1;
  }

  return {
    actionability: Math.max(1, actionability),
    specificity: Math.max(1, specificity),
    issues,
  };
}

// ─── Main Pipeline ───────────────────────────────────────────────────

async function runTest(question: string): Promise<TestResult> {
  const start = Date.now();
  const allIssues: string[] = [];

  // Step 1: Generate cards via Advocate + Critic agents in parallel
  console.log(`  Generating cards (advocate + critic)...`);
  const [advocateResult, criticResult] = await Promise.all([
    generateText({ model: bedrock("us.amazon.nova-2-lite-v1:0"), prompt: advocatePrompt(question) }),
    generateText({ model: bedrock("us.amazon.nova-2-lite-v1:0"), prompt: criticPrompt(question) }),
  ]);
  const advocateCards = parseJSON<{ cards: Card[] }>(advocateResult.text).cards;
  const criticCards = parseJSON<{ cards: Card[] }>(criticResult.text).cards;
  // Interleave
  const cards: Card[] = [];
  const maxLen = Math.max(advocateCards.length, criticCards.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < advocateCards.length) cards.push(advocateCards[i]);
    if (i < criticCards.length) cards.push(criticCards[i]);
  }

  // Step 2: Simulate sorting (biased toward support)
  const sorted = simulateSorting(cards);
  const analysis = analyzeCards(sorted);

  // Step 3: Generate pushback
  console.log(`  Generating pushback...`);
  let pushback: PushbackResponse | null = null;
  try {
    const pbResponse = await generateText({
      model: bedrock("us.amazon.nova-2-lite-v1:0"),
      prompt: pushbackPrompt(question, sorted.slice(0, 4), false),
    });
    pushback = parseJSON<PushbackResponse>(pbResponse.text);
  } catch (e) {
    allIssues.push(`Pushback generation failed: ${e}`);
  }

  // Step 4: Generate results
  console.log(`  Generating results...`);
  const resultsResponse = await generateText({
    model: bedrock("us.amazon.nova-2-lite-v1:0"),
    prompt: resultsPrompt(question, sorted, analysis),
  });
  const results = parseJSON<ResultsResponse>(resultsResponse.text);

  // Step 5: Score everything
  const cardScore = scoreCards(cards, question);
  const pbScore = scorePushback(pushback);
  const resScore = scoreResults(results, question);

  allIssues.push(...cardScore.issues, ...pbScore.issues, ...resScore.issues);

  const overall = Math.round(
    (cardScore.score * 0.3 + pbScore.score * 0.2 + resScore.actionability * 0.25 + resScore.specificity * 0.25)
  );

  return {
    question,
    cards,
    pushback,
    results,
    scores: {
      cardSpecificity: cardScore.score,
      cardDiversity: new Set(cards.map(c => c.category)).size,
      pushbackSharpness: pbScore.score,
      resultActionability: resScore.actionability,
      resultSpecificity: resScore.specificity,
      overallScore: overall,
    },
    issues: allIssues,
    durationMs: Date.now() - start,
  };
}

// ─── Run All Tests ───────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  CRUXO PROMPT QUALITY TEST — BASELINE");
  console.log("═══════════════════════════════════════════════════════\n");

  const results: TestResult[] = [];

  for (const question of TEST_QUESTIONS) {
    console.log(`\n▶ "${question}"`);
    try {
      const result = await runTest(question);
      results.push(result);

      console.log(`  Cards: ${result.scores.cardSpecificity}/10 | Diversity: ${result.scores.cardDiversity} cats`);
      console.log(`  Pushback: ${result.scores.pushbackSharpness}/10`);
      console.log(`  Results: actionability=${result.scores.resultActionability}/10, specificity=${result.scores.resultSpecificity}/10`);
      console.log(`  Overall: ${result.scores.overallScore}/10 | ${result.durationMs}ms`);

      if (result.issues.length > 0) {
        console.log(`  Issues (${result.issues.length}):`);
        result.issues.forEach((i) => console.log(`    - ${i}`));
      }

      // Print sample outputs
      console.log(`  --- Sample Card: "${result.cards[0]?.text}"`);
      if (result.pushback) {
        console.log(`  --- Pushback: "${result.pushback.pushbackMessage}"`);
      }
      console.log(`  --- Crux: "${result.results.crux}"`);
      console.log(`  --- Next Step: "${result.results.nextStep}"`);
      console.log(`  --- Premortem: "${result.results.premortem}"`);
      console.log(`  --- Third Option: "${result.results.thirdOption}"`);
      console.log(`  --- Door Type: ${result.results.doorType}`);
    } catch (e) {
      console.log(`  ✗ FAILED: ${e}`);
      results.push({
        question,
        cards: [],
        pushback: null,
        results: { patternInsight: "", blindSpot: "", strongestFor: "", strongestAgainst: "", crux: "", nextStep: "", premortem: "", thirdOption: "", doorType: "two-way" as const },
        scores: { cardSpecificity: 0, cardDiversity: 0, pushbackSharpness: 0, resultActionability: 0, resultSpecificity: 0, overallScore: 0 },
        issues: [`Test failed: ${e}`],
        durationMs: 0,
      });
    }
  }

  // Summary
  console.log("\n\n═══════════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("═══════════════════════════════════════════════════════\n");

  const passed = results.filter((r) => r.scores.overallScore >= 7);
  const failed = results.filter((r) => r.scores.overallScore < 7 && r.scores.overallScore > 0);
  const crashed = results.filter((r) => r.scores.overallScore === 0);

  console.log(`Passed (>=7): ${passed.length}/${results.length}`);
  console.log(`Needs work (<7): ${failed.length}/${results.length}`);
  console.log(`Crashed: ${crashed.length}/${results.length}`);
  console.log(`Avg overall score: ${(results.reduce((s, r) => s + r.scores.overallScore, 0) / results.length).toFixed(1)}/10`);
  console.log(`Avg card specificity: ${(results.reduce((s, r) => s + r.scores.cardSpecificity, 0) / results.length).toFixed(1)}/10`);
  console.log(`Avg pushback sharpness: ${(results.reduce((s, r) => s + r.scores.pushbackSharpness, 0) / results.length).toFixed(1)}/10`);
  console.log(`Avg result actionability: ${(results.reduce((s, r) => s + r.scores.resultActionability, 0) / results.length).toFixed(1)}/10`);
  console.log(`Avg result specificity: ${(results.reduce((s, r) => s + r.scores.resultSpecificity, 0) / results.length).toFixed(1)}/10`);

  // Common issues
  const issueCounts = new Map<string, number>();
  for (const r of results) {
    for (const issue of r.issues) {
      const key = issue.replace(/"[^"]*"/g, '"..."');
      issueCounts.set(key, (issueCounts.get(key) || 0) + 1);
    }
  }
  console.log(`\nTop issues:`);
  [...issueCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([issue, count]) => console.log(`  ${count}x ${issue}`));

  // Write full results to file for comparison
  const outPath = resolve(process.cwd(), "scripts/test-results-baseline.json");
  const { writeFileSync } = await import("fs");
  writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nFull results written to: ${outPath}`);
}

main().catch(console.error);
