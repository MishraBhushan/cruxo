import type {
  ArgumentCard,
  BiasAnalysis,
  CardCategory,
  SessionState,
} from "./types";

const FAST_SORT_THRESHOLD_MS = 2000;
const PUSHBACK_CHECKPOINTS = new Set([4, 8]);

export function createSession(
  question: string,
  cards: ArgumentCard[]
): SessionState {
  return {
    id: crypto.randomUUID(),
    question,
    cards,
    currentCardIndex: 0,
    phase: "swiping",
  };
}

export function analyzeBias(cards: ArgumentCard[]): BiasAnalysis {
  const sorted = cards.filter((c) => c.position !== "uncertain");
  const supports = sorted.filter((c) => c.position === "supports");
  const challenges = sorted.filter((c) => c.position === "challenges");

  const total = sorted.length || 1;
  const supportPct = (supports.length / total) * 100;

  const fastSorts = sorted.filter(
    (c) => c.sortTimeMs !== undefined && c.sortTimeMs < FAST_SORT_THRESHOLD_MS
  );

  const dominant =
    supports.length >= challenges.length ? "supports" : "challenges";
  const ignoredCategories =
    supportPct > 60 || supportPct < 40
      ? Array.from(
          new Set(
            fastSorts
              .filter((card) => card.position === dominant)
              .map((card) => card.category)
          )
        )
      : [];

  const hasBothSides = supports.length > 0 && challenges.length > 0;
  const confidence =
    sorted.length < 4 || fastSorts.length >= 3
      ? "low"
      : hasBothSides && fastSorts.length === 0
        ? "high"
        : "medium";

  return {
    supportCount: supports.length,
    challengeCount: challenges.length,
    totalSorted: sorted.length,
    leanDirection:
      supportPct > 60
        ? "supports"
        : supportPct < 40
          ? "challenges"
          : "balanced",
    leanPercentage: Math.round(supportPct),
    fastSortCount: fastSorts.length,
    ignoredCategories,
    confidence,
  };
}

export function shouldShowPushback(
  sortedCount: number,
  bias: BiasAnalysis
): boolean {
  if (!PUSHBACK_CHECKPOINTS.has(sortedCount)) {
    return false;
  }

  if (bias.leanDirection === "balanced") {
    return false;
  }

  const directionalLean =
    bias.leanDirection === "supports"
      ? bias.leanPercentage
      : 100 - bias.leanPercentage;

  const strongLean = directionalLean >= 75;
  const rushedLean = bias.fastSortCount >= 2 && directionalLean >= 60;
  const narrowEngagement = bias.ignoredCategories.length >= 2;

  return strongLean || rushedLean || narrowEngagement;
}
