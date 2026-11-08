import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, PageTitle } from "@/components/AppShell";
import { metrics, riskLabel, rp, update, useFinance } from "@/lib/finance";

export const Route = createFileRoute("/risiko")({
  head: () => ({
    meta: [
      { title: "Manajemen Risiko Keuangan Syariah — Amanah" },
      { name: "description", content: "Ukur dana darurat, rasio cicilan (DSR), serta risiko likuiditas, solvabilitas, dan investasi." },
      { property: "og:title", content: "Manajemen Risiko — Amanah" },
      { property: "og:description", content: "Dana darurat, DSR, dan scorecard risiko keuangan syariah." },
    ],
  }),
  component: Risk,
});

function Meter({ label, value, hint }: { label: string; value: number; hint: string }) {
  const tone = value < 34 ? "bg-success" : value < 67 ? "bg-warning" : "bg-destructive";
  return (
    <Card>
      <div className="flex justify-between text-sm"><span className="font-semibold">{label}</span><span>{riskLabel(value)}</span></div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted"><div className={`h-full ${tone}`} style={{ width: `${Math.max(value, 4)}%` }} /></div>
      <div className="mt-2 text-xs text-muted-foreground">{hint}</div>
    </Card>
  );
}

function Risk() {
  const s = useFinance();
  const m = metrics(s);
  const [lo, hi] = m.efTarget;
  const efPct = Math.min(m.efMonths / hi, 1) * 100;
  const dsrBad = m.dsr > 0.3;
  return (
    <>
      <PageTitle title="Manajemen Risiko" sub="Ketahanan keuangan sesuai prinsip syariah" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg">Dana Darurat</h3>
            <select className="rounded-lg border bg-background px-2 py-1 text-xs" value={s.profile.family ? "f" : "s"} onChange={(e) => update((st) => ({ ...st, profile: { ...st.profile, family: e.target.value === "f" } }))}>
              <option value="s">Lajang (3–6x)</option><option value="f">Keluarga (6–12x)</option>
            </select>
          </div>
          <div className="mt-4 text-4xl font-bold text-primary">{m.efMonths.toFixed(1)}<span className="text-lg text-muted-foreground">x biaya hidup</span></div>
          <div className="relative mt-4 h-4 rounded-full bg-muted">
            <div className="absolute inset-y-0 rounded-full bg-gold/40" style={{ left: `${(lo / hi) * 100}%`, right: 0 }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${efPct}%` }} />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Kas {rp(m.liquid)} · biaya hidup rata-rata {rp(m.livingAvg)}/bln · target {lo}–{hi}x</div>
        </Card>
        <Card className={dsrBad ? "border-destructive" : ""}>
          <h3 className="text-lg">Debt Service Ratio (DSR)</h3>
          <div className={`mt-4 text-4xl font-bold ${dsrBad ? "text-destructive" : "text-success"}`}>{(m.dsr * 100).toFixed(1)}%</div>
          <div className="mt-2 text-xs text-muted-foreground">Cicilan akad {rp(m.installments)}/bln dari pendapatan rata-rata {rp(m.avgIncome)}</div>
          <div className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-sm ${dsrBad ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}`}>
            {dsrBad ? <AlertTriangle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
            {dsrBad ? "Peringatan: cicilan melebihi 30% pendapatan. Hindari akad pembiayaan baru." : "Sehat: cicilan di bawah batas aman 30% pendapatan."}
          </div>
        </Card>
      </div>
      <h2 className="mb-3 mt-8 text-2xl text-primary">Scorecard Risiko</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Meter label="Risiko Likuiditas" value={m.liquidityRisk} hint="Berdasarkan kecukupan dana darurat" />
        <Meter label="Risiko Solvabilitas" value={m.solvencyRisk} hint={`Utang ${rp(m.totalLiab)} vs aset ${rp(m.totalAssets)}`} />
        <Meter label="Risiko Investasi" value={m.investmentRisk} hint="Porsi aset volatil (reksa dana saham syariah)" />
      </div>
    </>
  );
}
