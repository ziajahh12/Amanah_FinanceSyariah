import { createServerFn } from "@tanstack/react-start";
import { idrPerGram } from "./gold-price";

type GoldPriceResult =
  | { ok: true; pricePerGram: number; usdPerOunce: number; usdToIdr: number; updatedAt: string }
  | { ok: false; message: string };

/** Public, read-only: world gold spot price converted to Rupiah per gram. */
export const getLiveGoldPrice = createServerFn({ method: "GET" }).handler(async (): Promise<GoldPriceResult> => {
  try {
    const opts = { signal: AbortSignal.timeout(8000), headers: { accept: "application/json" } };
    const [goldRes, fxRes] = await Promise.all([
      fetch("https://api.gold-api.com/price/XAU", opts),
      fetch("https://open.er-api.com/v6/latest/USD", opts),
    ]);
    if (!goldRes.ok || !fxRes.ok) throw new Error(`gold ${goldRes.status} fx ${fxRes.status}`);
    const gold = (await goldRes.json()) as { price?: number; updatedAt?: string };
    const fx = (await fxRes.json()) as { rates?: Record<string, number> };
    const usdPerOunce = Number(gold.price);
    const usdToIdr = Number(fx.rates?.IDR);
    return { ok: true, pricePerGram: idrPerGram(usdPerOunce, usdToIdr), usdPerOunce, usdToIdr, updatedAt: gold.updatedAt ?? new Date().toISOString() };
  } catch (e) {
    console.error("live gold price failed", e);
    return { ok: false, message: "Harga emas real-time sedang tidak tersedia." };
  }
});
