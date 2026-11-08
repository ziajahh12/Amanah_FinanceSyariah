import { z } from "zod";
import { metrics, type State } from "./finance";
import { analyzeRisks } from "./business-risk";

export const chatInputSchema = z.object({
  question: z.string().trim().min(1).max(4000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(12000) })).max(12),
});

const amount = z.number().finite().nonnegative();
export const financeContextSchema = z.object({
  txs: z.array(z.object({ id: z.string(), date: z.string(), type: z.enum(["income", "expense"]), category: z.string(), amount, nonHalal: z.boolean().optional() })),
  assets: z.array(z.object({ id: z.string(), type: z.string(), value: z.number().finite(), zakatable: z.boolean() })),
  liabilities: z.array(z.object({ id: z.string(), type: z.string(), balance: amount, monthly: amount })),
  profile: z.object({ family: z.boolean(), goldPrice: amount }),
});

export function buildAgentContext(raw: unknown) {
  const parsed = financeContextSchema.parse(raw);
  const state: State = {
    ...parsed,
    txs: parsed.txs.map(t => ({ ...t, note: "" })),
    assets: parsed.assets.map(a => ({ ...a, name: "" })),
    liabilities: parsed.liabilities.map(l => ({ ...l, name: "" })),
  };
  const { months, ...summary } = metrics(state);
  return {
    transactionCount: state.txs.length,
    period: { first: months[0]?.month ?? null, latest: months.at(-1)?.month ?? null },
    summary, monthly: months, risks: analyzeRisks(state),
    incomeByCategory: totals(state, "income"), expenseByCategory: totals(state, "expense"),
  };
}

function totals(state: State, type: "income" | "expense") {
  const result: Record<string, number> = {};
  for (const tx of state.txs.filter(t => t.type === type)) result[tx.category] = (result[tx.category] ?? 0) + tx.amount;
  return result;
}