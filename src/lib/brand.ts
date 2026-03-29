export interface BrandSystem {
  masterWordmark: string;
  uiName: string;
  expressiveWordmark: string;
  rejectedWordmarks: string[];
  tone: string;
}

export function buildBrandSystem(): BrandSystem {
  return {
    masterWordmark: "CRUXO",
    uiName: "Cruxo",
    expressiveWordmark: "CRUX O",
    rejectedWordmarks: ["CRUX0"],
    tone: "Direct, editorial, severe, anti-sycophantic",
  };
}

export function splitWordmark(wordmark: string): string[] {
  const trimmed = wordmark.trim();
  return trimmed.includes(" ") ? trimmed.split(/\s+/) : [trimmed];
}
