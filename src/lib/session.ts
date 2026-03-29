import type {
  ArgumentCard,
  BiasAnalysis,
  CardCategory,
  SessionState,
} from "./types";

const FAST_SORT_THRESHOLD_MS = 2000;

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

  // Find categories that were all sorted one direction
  const categoryMap = new Map<CardCategory, CardCategory[]>();
  for (const card of sorted) {
    if (!categoryMap.has(card.category)) {
      categoryMap.set(card.category, []);
    }
  }

  const ignoredCategories: CardCategory[] = [];
  const dominant =
    supports.length >= challenges.length ? "supports" : "challenges";
  for (const card of sorted) {
    if (card.position === dominant && card.sortTimeMs !== undefined && card.sortTimeMs < FAST_SORT_THRESHOLD_MS) {
      if (!ignoredCategories.includes(card.category)) {
        ignoredCategories.push(card.category);
      }
    }
  }

  return {
    leanDirection:
      supportPct > 60
        ? "supports"
        : supportPct < 40
          ? "challenges"
          : "balanced",
    leanPercentage: Math.round(supportPct),
    fastSortCount: fastSorts.length,
    ignoredCategories,
  };
}

export function shouldShowPushback(cardIndex: number): boolean {
  // Pushback after card 4 (index 3) and card 8 (index 7)
  return cardIndex === 3 || cardIndex === 7;
}
