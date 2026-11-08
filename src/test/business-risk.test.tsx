import { describe, expect, it } from "vitest";
import { analyzeRisks, applyTx } from "@/lib/business-risk";
import type { State } from "@/lib/finance";

const s: State = {
  txs: [],
  assets: [{ id: "k", name: "Kas", type: "Kas", value: 1_000_000, zakatable: true }],
  liabilities: [{ id: "l", name: "KPR", type: "Murabahah", balance: 10_000_000, monthly: 1_000_000 }],
  profile: { family: false, goldPrice: 1_000_000 },
};

describe("auto-recording", () => {
  it("income raises Kas on the balance sheet", () => {
    const r = applyTx(s, { id: "1", date: "2026-11-01", type: "income", category: "Gaji Halal", amount: 500_000, note: "" });
    expect(r.assets[0]!.value).toBe(1_500_000);
    expect(r.txs).toHaveLength(1);
  });
  it("akad installment lowers Kas and remaining debt; deleting reverses it", () => {
    const tx = { id: "2", date: "2026-11-01", type: "expense" as const, category: "Cicilan Akad", amount: 1_000_000, note: "" };
    const r = applyTx(s, tx);
    expect(r.assets[0]!.value).toBe(0);
    expect(r.liabilities[0]!.balance).toBe(9_000_000);
    const back = applyTx(r, tx, -1);
    expect(back.assets[0]!.value).toBe(1_000_000);
    expect(back.liabilities[0]!.balance).toBe(10_000_000);
  });
  it("flags a deficit as high risk", () => {
    const r = applyTx(applyTx(s, { id: "a", date: "2026-11-01", type: "income", category: "Laba Usaha", amount: 1_000_000, note: "" }),
      { id: "b", date: "2026-11-02", type: "expense", category: "Biaya Hidup", amount: 2_000_000, note: "" });
    expect(analyzeRisks(r).risks.find((x) => x.title === "Defisit Arus Kas")?.level).toBe("Tinggi");
  });
});
