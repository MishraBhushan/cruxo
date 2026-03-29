export type CardPosition = "supports" | "uncertain" | "challenges";
export type CardSource = "ai" | "user" | "pushback";
export type CardCategory =
  | "financial"
  | "emotional"
  | "practical"
  | "social"
  | "health"
  | "career"
  | "legal"
  | "other";

export interface ArgumentCard {
  id: string;
  text: string;
  category: CardCategory;
  position: CardPosition;
  source: CardSource;
  sortTimeMs?: number;
}

export interface SessionState {
  id: string;
  question: string;
  cards: ArgumentCard[];
  currentCardIndex: number;
  phase: SessionPhase;
  biasAnalysis?: BiasAnalysis;
  result?: SessionResult;
}

export type SessionPhase =
  | "input"
  | "generating"
  | "swiping"
  | "pushback"
  | "results";

export interface BiasAnalysis {
  leanDirection: "supports" | "challenges" | "balanced";
  leanPercentage: number;
  fastSortCount: number;
  ignoredCategories: CardCategory[];
}

export interface SessionResult {
  leanPercentage: number;
  leanDirection: "supports" | "challenges" | "balanced";
  blindSpot: string;
  crux: string;
  nextStep: string;
}

export interface PushbackData {
  card: ArgumentCard;
  message: string;
}
