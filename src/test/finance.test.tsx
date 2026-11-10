import { describe, expect, it } from "vitest";
import { cashFlowBy, metrics, type State } from "@/lib/finance";

const base = (assets: number, monthlyInst: number): State => ({
  txs: [{ id: "1", date: "2026-01-01", type: "income", category: "Gaji Halal", amount: 10_000_000, note: "" }],
  assets: [{ id: "a", name: "Kas", type: "Kas", value: assets, zakatable: true }],
  liabilities: [{ id: "l", name: "M", type: "Murabahah", balance: 1, monthly: monthlyInst }],
  profile: { family: false, goldPrice: 1_000_000 },
});

describe("cash flow per month and year", () => {
  const tx = (date: string, type: "income" | "expense", amount: number) => ({ id: date + type, date, type, category: "x", amount, note: "" });
  const txs = [tx("2025-12-01", "income", 10), tx("2025-12-05", "expense", 4), tx("2026-01-01", "income", 5), tx("2026-01-09", "expense", 8), tx("2026-02-01", "income", 3), tx("2026-02-02", "expense", 3)];
  it("groups by month and labels surplus, deficit, balanced", () => {
    expect(cashFlowBy(txs, "month").map((r) => [r.key, r.net, r.status])).toEqual([
      ["2025-12", 6, "Surplus"], ["2026-01", -3, "Defisit"], ["2026-02", 0, "Seimbang"],
    ]);
  });
  it("groups by year", () => {
    expect(cashFlowBy(txs, "year").map((r) => [r.key, r.income, r.expense, r.status])).toEqual([
      ["2025", 10, 4, "Surplus"], ["2026", 8, 11, "Defisit"],
    ]);
  });
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
