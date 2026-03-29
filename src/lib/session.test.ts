import { describe, expect, test } from "bun:test";
import { analyzeBias, shouldShowPushback } from "./session";
import type { ArgumentCard } from "./types";

function buildCard(
  id: string,
  position: ArgumentCard["position"],
  category: ArgumentCard["category"],
  sortTimeMs = 2500
): ArgumentCard {
  return {
    id,
    text: `Argument ${id}`,
    category,
    position,
    source: "ai",
    sortTimeMs,
  };
}

describe("analyzeBias", () => {
  test("captures counts and confidence for balanced engaged sorting", () => {
    const analysis = analyzeBias([
      buildCard("1", "supports", "financial", 3200),
      buildCard("2", "supports", "career", 2800),
      buildCard("3", "challenges", "health", 2600),
      buildCard("4", "challenges", "social", 3000),
    ]);

    expect(analysis.supportCount).toBe(2);
    expect(analysis.challengeCount).toBe(2);
    expect(analysis.totalSorted).toBe(4);
    expect(analysis.leanDirection).toBe("balanced");
    expect(analysis.fastSortCount).toBe(0);
    expect(analysis.confidence).toBe("high");
    expect(analysis.ignoredCategories).toEqual([]);
  });
});

describe("shouldShowPushback", () => {
  test("does not trigger on a balanced checkpoint", () => {
    const bias = analyzeBias([
      buildCard("1", "supports", "financial"),
      buildCard("2", "supports", "career"),
      buildCard("3", "challenges", "health"),
      buildCard("4", "challenges", "social"),
    ]);

    expect(shouldShowPushback(4, bias)).toBe(false);
  });

  test("triggers when a strong one-sided lean emerges", () => {
    const bias = analyzeBias([
      buildCard("1", "supports", "financial"),
      buildCard("2", "supports", "career"),
      buildCard("3", "supports", "health"),
      buildCard("4", "challenges", "social"),
    ]);

    expect(shouldShowPushback(4, bias)).toBe(true);
  });

  test("triggers when rushed one-sided sorting appears even without a 75 percent lean", () => {
    const bias = analyzeBias([
      buildCard("1", "supports", "financial", 900),
      buildCard("2", "supports", "career", 1100),
      buildCard("3", "supports", "health", 3000),
      buildCard("4", "challenges", "social", 3500),
      buildCard("5", "supports", "legal", 3300),
      buildCard("6", "challenges", "practical", 3600),
      buildCard("7", "supports", "emotional", 3400),
      buildCard("8", "supports", "other", 3700),
    ]);

    expect(shouldShowPushback(8, bias)).toBe(true);
  });
});
