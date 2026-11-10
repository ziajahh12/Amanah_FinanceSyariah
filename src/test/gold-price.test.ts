import { describe, expect, it } from "vitest";
import { idrPerGram } from "@/lib/gold-price";

describe("live gold price conversion", () => {
  it("converts USD per troy ounce to Rupiah per gram", () => {
    // 1 troy ounce = 31.1034768 g
    expect(idrPerGram(3110.34768, 16_000)).toBe(1_600_000);
  });
  it("rejects missing prices", () => {
    expect(() => idrPerGram(0, 16_000)).toThrow();
  });
});
