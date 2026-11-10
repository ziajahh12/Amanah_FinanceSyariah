import { useState } from "react";
import { Card } from "@/components/AppShell";
import { cashFlowBy, cashStatus, rp, type CashStatus, type Tx } from "@/lib/finance";

const badge: Record<CashStatus, string> = {
  Surplus: "bg-success/10 text-success",
  Defisit: "bg-destructive/10 text-destructive",
  Seimbang: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: CashStatus }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge[status]}`}>{status}</span>;
}

export function CashFlowPeriods({ txs }: { txs: Tx[] }) {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const rows = [...cashFlowBy(txs, period)].reverse();
  const income = rows.reduce((a, r) => a + r.income, 0);
  const expense = rows.reduce((a, r) => a + r.expense, 0);
  const net = income - expense;
  const status = cashStatus(net);
  return (
    <Card className="mt-6 overflow-x-auto p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Ringkasan Arus Kas</h2>
          <p className="text-xs text-muted-foreground">Rekap pemasukan & pengeluaran per {period === "month" ? "bulan" : "tahun"}</p>
        </div>
        <div className="flex rounded-lg border p-1 text-sm" role="tablist">
          {(["month", "year"] as const).map((p) => (
            <button key={p} role="tab" aria-selected={period === p} onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 font-medium ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {p === "month" ? "Bulanan" : "Tahunan"}
            </button>
          ))}
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-secondary text-left text-xs text-secondary-foreground">
          <tr>
            <th className="p-3">{period === "month" ? "Bulan" : "Tahun"}</th>
            <th className="p-3 text-right">Pemasukan</th>
            <th className="p-3 text-right">Pengeluaran</th>
            <th className="p-3 text-right">Selisih</th>
            <th className="p-3">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Belum ada transaksi.</td></tr>}
          {rows.map((r) => (
            <tr key={r.key} className="border-t">
              <td className="p-3 whitespace-nowrap capitalize">{r.label}</td>
              <td className="p-3 text-right whitespace-nowrap text-success">{rp(r.income)}</td>
              <td className="p-3 text-right whitespace-nowrap text-destructive">{rp(r.expense)}</td>
              <td className={`p-3 text-right font-semibold whitespace-nowrap ${r.net < 0 ? "text-destructive" : ""}`}>{rp(r.net)}</td>
              <td className="p-3"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
        {rows.length > 0 && (
          <tfoot className="border-t-2 border-primary bg-accent/30 font-semibold">
            <tr>
              <td className="p-3">TOTAL</td>
              <td className="p-3 text-right whitespace-nowrap">{rp(income)}</td>
              <td className="p-3 text-right whitespace-nowrap">{rp(expense)}</td>
              <td className={`p-3 text-right whitespace-nowrap ${net < 0 ? "text-destructive" : ""}`}>{rp(net)}</td>
              <td className="p-3"><StatusBadge status={status} /></td>
            </tr>
            <tr>
              <td colSpan={5} className="px-3 pb-3 text-xs font-normal text-muted-foreground">
                {status === "Surplus" && `Keseluruhan surplus ${rp(net)} — pemasukan lebih besar dari pengeluaran.`}
                {status === "Defisit" && `Keseluruhan defisit ${rp(-net)} — pengeluaran melebihi pemasukan.`}
                {status === "Seimbang" && "Pemasukan dan pengeluaran seimbang."}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </Card>
  );
}
