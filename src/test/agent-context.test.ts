import { describe, expect, it } from "vitest";
import { buildAgentContext, chatInputSchema } from "@/lib/agent-context";

describe("AI account context", () => {
  it("uses the account's own recorded income and excludes identifying notes", () => {
    const context = buildAgentContext({
      txs: [{ id: "private-id", date: "2026-11-01", type: "income", category: "Gaji Halal", amount: 18000000, note: "private employer" }],
      assets: [{ id: "asset-id", name: "private bank", type: "Kas", value: 62000000, zakatable: true }],
      liabilities: [], profile: { family: false, goldPrice: 1350000 },
    });
    expect(context.monthly[0]?.income).toBe(18000000);
    expect(context.summary.liquid).toBe(62000000);
    expect(JSON.stringify(context)).not.toMatch(/private employer|private bank|private-id|asset-id/);
  });
  it("distinguishes an empty account from a populated one", () => {
    const context = buildAgentContext({ txs: [], assets: [], liabilities: [], profile: { family: false, goldPrice: 1350000 } });
    expect(context.transactionCount).toBe(0);
    expect(context.period.latest).toBeNull();
  });
  it("does not accept a caller-specified account identifier", () => {
    expect(chatInputSchema.parse({ question: "Risiko saya?", history: [], userId: "another-account" })).not.toHaveProperty("userId");
  });
});