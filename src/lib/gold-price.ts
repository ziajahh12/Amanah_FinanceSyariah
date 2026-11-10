export const TROY_OUNCE_GRAMS = 31.1034768;

/** Convert a world spot price (USD per troy ounce) into Rupiah per gram. */
export function idrPerGram(usdPerOunce: number, usdToIdr: number): number {
  if (!(usdPerOunce > 0) || !(usdToIdr > 0)) throw new Error("invalid price input");
  return Math.round((usdPerOunce / TROY_OUNCE_GRAMS) * usdToIdr);
}
