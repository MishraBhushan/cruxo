import { describe, expect, test } from "bun:test";
import { fitFontSizeToHeight } from "./text-fit";

describe("fitFontSizeToHeight", () => {
  test("shrinks when larger sizes exceed the available height", () => {
    const size = fitFontSizeToHeight({
      min: 18,
      max: 40,
      measureHeight: (fontSize) => fontSize * 3,
      maxHeight: 72,
    });

    expect(size).toBeLessThanOrEqual(24);
    expect(size).toBeGreaterThanOrEqual(18);
  });

  test("returns the largest fitting size when multiple sizes fit", () => {
    const size = fitFontSizeToHeight({
      min: 16,
      max: 44,
      measureHeight: (fontSize) => fontSize * 1.2,
      maxHeight: 40,
    });

    expect(size).toBe(33);
  });

  test("falls back to the minimum size when nothing fits", () => {
    const size = fitFontSizeToHeight({
      min: 20,
      max: 44,
      measureHeight: () => 999,
      maxHeight: 40,
    });

    expect(size).toBe(20);
  });
});
