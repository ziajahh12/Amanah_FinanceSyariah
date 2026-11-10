import { getLiveGoldPrice } from "./gold-price.functions";
import { update } from "./finance";

export const GOLD_REFRESH_MS = 5 * 60 * 1000;

/** Fetch the live gold price and store it, unless the user chose a manual price. */
export async function refreshGoldPrice(force = false): Promise<boolean> {
  const res = await getLiveGoldPrice();
  if (!res.ok) return false;
  update((s) => {
    if (!force && s.profile.goldAuto === false) return s;
    return { ...s, profile: { ...s.profile, goldPrice: res.pricePerGram, goldAuto: true, goldUpdatedAt: res.updatedAt } };
  });
  return true;
}
