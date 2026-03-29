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
  supportCount: number;
  challengeCount: number;
  totalSorted: number;
  leanDirection: "supports" | "challenges" | "balanced";
  leanPercentage: number;
  fastSortCount: number;
  ignoredCategories: CardCategory[];
  confidence: "low" | "medium" | "high";
}

export interface SessionResult {
  supportCount: number;
  challengeCount: number;
  totalSorted: number;
  leanPercentage: number;
  leanDirection: "supports" | "challenges" | "balanced";
  fastSortCount: number;
  ignoredCategories: CardCategory[];
  confidence: "low" | "medium" | "high";
  pushbackCount: number;
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

export interface PushbackData {
  card: ArgumentCard;
  message: string;
}
