import { AlertTriangle, CheckCircle2, Lightbulb, ShieldCheck, Wrench } from "lucide-react";
import { Card } from "@/components/AppShell";
import { analyzeRisks } from "@/lib/business-risk";
import { useFinance } from "@/lib/finance";

const tone = { Tinggi: "bg-destructive/10 text-destructive", Sedang: "bg-warning/15 text-accent-foreground", Rendah: "bg-secondary text-secondary-foreground" };

export function RiskInsights() {
  const { risks, saran } = analyzeRisks(useFinance());
  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-2xl text-primary">Analisis Risiko Otomatis</h2>
      {risks.length === 0 && (
        <Card className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-5 text-success" /> Belum ditemukan risiko dari data Anda.</Card>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {risks.map((r) => (
          <Card key={r.title}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="flex items-center gap-2 text-lg"><AlertTriangle className="size-4 text-warning" />{r.title}</h3>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${tone[r.level]}`}>{r.level}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.finding}</p>
            <div className="mt-3 text-sm">
              <div className="flex items-center gap-1 font-semibold text-primary"><Wrench className="size-3.5" /> Penyelesaian</div>
              <ul className="ml-5 list-disc">{r.solusi.map((x) => <li key={x}>{x}</li>)}</ul>
              <div className="mt-2 flex items-center gap-1 font-semibold text-primary"><ShieldCheck className="size-3.5" /> Mitigasi</div>
              <ul className="ml-5 list-disc">{r.mitigasi.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </Card>
        ))}
      </div>
      <Card className="bg-accent">
        <h3 className="flex items-center gap-2 text-lg text-accent-foreground"><Lightbulb className="size-4" /> Saran</h3>
        <ul className="ml-5 mt-2 list-disc space-y-1 text-sm">{saran.map((x) => <li key={x}>{x}</li>)}</ul>
      </Card>
    </div>
  );
}
