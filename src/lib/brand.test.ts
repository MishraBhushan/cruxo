import { describe, expect, test } from "bun:test";
import {
  buildBrandSystem,
  splitWordmark,
} from "./brand";

describe("buildBrandSystem", () => {
  test("keeps CRUXO as the master mark and Cruxo as the UI name", () => {
    const brand = buildBrandSystem();

    expect(brand.masterWordmark).toBe("CRUXO");
    expect(brand.uiName).toBe("Cruxo");
  });

  test("keeps CRUX O as an expressive variant but rejects CRUX0 as the primary mark", () => {
    const brand = buildBrandSystem();

    expect(brand.expressiveWordmark).toBe("CRUX O");
    expect(brand.rejectedWordmarks).toContain("CRUX0");
    expect(brand.rejectedWordmarks).not.toContain("CRUXO");
  });
});

describe("splitWordmark", () => {
  test("preserves the detached O for expressive layouts", () => {
    expect(splitWordmark("CRUX O")).toEqual(["CRUX", "O"]);
  });

  test("keeps unified marks intact", () => {
    expect(splitWordmark("CRUXO")).toEqual(["CRUXO"]);
  });
});
