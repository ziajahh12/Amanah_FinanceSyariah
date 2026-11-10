import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Card, PageTitle } from "@/components/AppShell";
import { RiskInsights } from "@/components/RiskInsights";
import { CashFlowPeriods } from "@/components/CashFlowPeriods";
import { applyTx } from "@/lib/business-risk";
import { EXPENSE_CATS, INCOME_CATS, newId, rp, update, useFinance, type Tx } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/arus-kas")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Arus Kas Syariah — Amanah" },
      { name: "description", content: "Catat pemasukan halal dan pengeluaran termasuk ZIS, cicilan akad, dan dana kebajikan." },
      { property: "og:title", content: "Arus Kas Syariah — Amanah" },
      { property: "og:description", content: "Pencatatan arus kas dengan kategori syariah otomatis." },
    ],
  }),
  component: CashFlow,
});

const field = "rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function CashFlow() {
  const s = useFinance();
  const [f, setF] = useState<Omit<Tx, "id">>({ date: new Date().toISOString().slice(0, 10), type: "expense", category: EXPENSE_CATS[0], amount: 0, note: "", nonHalal: false });
  const [saved, setSaved] = useState(false);
  const cats = f.type === "income" ? INCOME_CATS : EXPENSE_CATS;
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.amount <= 0) return;
    update((st) => applyTx(st, { ...f, id: newId() }));
    setSaved(true);
    setF({ ...f, amount: 0, note: "" });
  };
  const list = [...s.txs].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageTitle title="Arus Kas" sub="Pencatatan pemasukan & pengeluaran syariah" />
      <Card>
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input type="date" className={field} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          <select className={field} value={f.type} onChange={(e) => { const type = e.target.value as Tx["type"]; setF({ ...f, type, category: (type === "income" ? INCOME_CATS : EXPENSE_CATS)[0] }); }}>
            <option value="income">Pemasukan</option><option value="expense">Pengeluaran</option>
          </select>
          <select className={field} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input type="number" min={0} placeholder="Jumlah (Rp)" className={field} value={f.amount || ""} onChange={(e) => setF({ ...f, amount: +e.target.value })} />
          <input placeholder="Catatan" className={field} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          <button className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="size-4" /> Tambah</button>
          {f.type === "income" && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2 lg:col-span-6">
              <input type="checkbox" checked={!!f.nonHalal} onChange={(e) => setF({ ...f, nonHalal: e.target.checked })} />
              Pendapatan non-halal (bunga/riba) — karantina untuk dibersihkan via Dana Kebajikan
            </label>
          )}
        </form>
        {saved && <p className="mt-3 text-xs text-success">✓ Tersimpan — otomatis tercatat di Arus Kas dan Neraca (Kas{f.category === "Cicilan Akad" ? " & sisa utang akad" : ""}). Analisis risiko di bawah sudah diperbarui.</p>}
      </Card>
      <CashFlowPeriods txs={s.txs} />
      <RiskInsights />
      <Card className="mt-6 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs text-secondary-foreground">
            <tr><th className="p-3">Tanggal</th><th className="p-3">Kategori</th><th className="p-3">Catatan</th><th className="p-3 text-right">Jumlah</th><th /></tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 whitespace-nowrap">{t.date}</td>
                <td className="p-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{t.category}</span>
                  {t.nonHalal && <span className="ml-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">Non-halal</span>}
                </td>
                <td className="p-3 text-muted-foreground">{t.note}</td>
                <td className={`p-3 text-right font-semibold whitespace-nowrap ${t.type === "income" ? "text-success" : "text-destructive"}`}>{t.type === "income" ? "+" : "−"}{rp(t.amount)}</td>
                <td className="p-3"><button aria-label="Hapus" onClick={() => update((st) => applyTx(st, t, -1))}><Trash2 className="size-4 text-muted-foreground hover:text-destructive" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
