interface FitFontSizeOptions {
  min: number;
  max: number;
  maxHeight: number;
  measureHeight: (fontSize: number) => number;
}

export function fitFontSizeToHeight({
  min,
  max,
  maxHeight,
  measureHeight,
}: FitFontSizeOptions): number {
  let low = min;
  let high = max;
  let best = min;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const height = measureHeight(mid);

    if (height <= maxHeight) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}
