import type { ArgumentCard } from "./types";

// Simple in-memory cache for AI responses (avoids re-generating for same questions)
// TTL: 1 hour. Keyed by normalized question text.
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cardCache = new Map<string, CacheEntry<ArgumentCard[]>>();

function normalizeKey(question: string): string {
  return question.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getCachedCards(question: string): ArgumentCard[] | null {
  const key = normalizeKey(question);
  const entry = cardCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cardCache.delete(key);
    return null;
  }
  // Return fresh copies with new IDs so each session is independent
  return entry.data.map((card) => ({
    ...card,
    id: crypto.randomUUID(),
    position: "uncertain" as const,
    sortTimeMs: undefined,
  }));
}

export function setCachedCards(
  question: string,
  cards: ArgumentCard[]
): void {
  const key = normalizeKey(question);
  cardCache.set(key, { data: cards, timestamp: Date.now() });

  // Evict oldest entries if cache grows too large
  if (cardCache.size > 100) {
    const oldest = [...cardCache.entries()].sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );
    for (let i = 0; i < 20; i++) {
      cardCache.delete(oldest[i][0]);
    }
  }
}
