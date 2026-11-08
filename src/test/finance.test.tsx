import { describe, expect, it } from "vitest";
import { metrics, type State } from "@/lib/finance";

const base = (assets: number, monthlyInst: number): State => ({
  txs: [{ id: "1", date: "2026-01-01", type: "income", category: "Gaji Halal", amount: 10_000_000, note: "" }],
  assets: [{ id: "a", name: "Kas", type: "Kas", value: assets, zakatable: true }],
  liabilities: [{ id: "l", name: "M", type: "Murabahah", balance: 1, monthly: monthlyInst }],
  profile: { family: false, goldPrice: 1_000_000 },
});

describe("syariah rules", () => {
  it("zakat is 2.5% once wealth reaches 85g gold nisab", () => {
    expect(metrics(base(100_000_000, 0)).zakat).toBe(2_500_000);
  });
  it("no zakat below nisab", () => {
    expect(metrics(base(84_000_000, 0)).zakat).toBe(0);
  });
  it("DSR above 30% breaks compliance", () => {
    expect(metrics(base(1, 3_100_000)).compliant).toBe(false);
    expect(metrics(base(1, 2_900_000)).compliant).toBe(true);
  });
});
