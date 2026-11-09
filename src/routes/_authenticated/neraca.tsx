import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Plus, HandCoins, Droplets } from "lucide-react";
import { Card, PageTitle } from "@/components/AppShell";
import { ASSET_TYPES, LIAB_TYPES, metrics, newId, rp, update, useFinance } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/neraca")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Neraca & Zakat Mal — Amanah" },
      { name: "description", content: "Kelola aset, utang syariah, hitung Zakat Mal otomatis, dan lacak pembersihan dana non-halal." },
      { property: "og:title", content: "Neraca & Zakat Mal — Amanah" },
      { property: "og:description", content: "Neraca kekayaan, utang syariah, dan mesin kepatuhan zakat." },
    ],
  }),
  component: BalanceSheet,
});

const field = "rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function BalanceSheet() {
  const s = useFinance();
  const m = metrics(s);
  const [a, setA] = useState({ name: "", type: ASSET_TYPES[0] as string, value: 0 });
  const [l, setL] = useState({ name: "", type: LIAB_TYPES[0] as string, balance: 0, monthly: 0 });

  const cleanse = () => m.quarantine > 0 && update((st) => ({ ...st, txs: [...st.txs, { id: newId(), date: new Date().toISOString().slice(0, 10), type: "expense", category: "Dana Kebajikan", amount: m.quarantine, note: "Pembersihan dana non-halal" }] }));
  const payZakat = () => m.zakat > 0 && update((st) => ({ ...st, txs: [...st.txs, { id: newId(), date: new Date().toISOString().slice(0, 10), type: "expense", category: "ZIS", amount: Math.round(m.zakat), note: "Zakat Mal" }] }));

  return (
    <>
      <PageTitle title="Neraca & Zakat" sub="Neraca kekayaan, utang syariah, dan mesin kepatuhan" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-primary text-primary-foreground islamic-pattern">
          <HandCoins className="size-6 text-gold" />
          <div className="mt-2 text-sm opacity-80">Zakat Mal (2,5%)</div>
          <div className="text-3xl font-bold">{rp(m.zakat)}</div>
          <div className="mt-1 text-xs opacity-80">Harta wajib zakat {rp(m.zakatable)} · Nisab 85g emas {rp(m.nisab)}</div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            Harga emas/gram:
            <input type="number" className="w-32 rounded bg-primary-foreground/15 px-2 py-1" value={s.profile.goldPrice} onChange={(e) => update((st) => ({ ...st, profile: { ...st.profile, goldPrice: +e.target.value } }))} />
          </div>
          <button onClick={payZakat} disabled={!m.zakat} className="mt-4 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-50">Catat pembayaran zakat</button>
        </Card>
        <Card>
          <Droplets className="size-6 text-primary" />
          <div className="mt-2 text-sm text-muted-foreground">Karantina Dana Non-Halal</div>
          <div className={`text-3xl font-bold ${m.quarantine ? "text-destructive" : "text-success"}`}>{rp(m.quarantine)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Total non-halal {rp(m.nonHalal)} · Sudah dibersihkan {rp(m.cleansed)}</div>
          <button onClick={cleanse} disabled={!m.quarantine} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Salurkan ke Dana Kebajikan</button>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex justify-between"><h3 className="text-lg">Aset Likuid & Investasi</h3><span className="font-bold text-success">{rp(m.totalAssets)}</span></div>
          {s.assets.map((x) => (
            <div key={x.id} className="flex items-center justify-between border-t py-2 text-sm">
              <div><div className="font-medium">{x.name}</div><div className="text-xs text-muted-foreground">{x.type}</div></div>
              <div className="flex items-center gap-3"><span>{rp(x.value)}</span>
                <button aria-label="Hapus" onClick={() => update((st) => ({ ...st, assets: st.assets.filter((y) => y.id !== x.id) }))}><Trash2 className="size-4 text-muted-foreground" /></button></div>
            </div>
          ))}
          <form className="mt-3 grid grid-cols-2 gap-2 border-t pt-3" onSubmit={(e) => { e.preventDefault(); if (!a.name || a.value <= 0) return; update((st) => ({ ...st, assets: [...st.assets, { ...a, id: newId(), zakatable: a.type !== "Properti" }] })); setA({ ...a, name: "", value: 0 }); }}>
            <input placeholder="Nama aset" className={field} value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} />
            <select className={field} value={a.type} onChange={(e) => setA({ ...a, type: e.target.value })}>{ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
            <input type="number" placeholder="Nilai (Rp)" className={field} value={a.value || ""} onChange={(e) => setA({ ...a, value: +e.target.value })} />
            <button className="flex items-center justify-center gap-1 rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground"><Plus className="size-4" />Aset</button>
          </form>
        </Card>
        <Card>
          <div className="mb-3 flex justify-between"><h3 className="text-lg">Liabilitas Syariah</h3><span className="font-bold text-destructive">{rp(m.totalLiab)}</span></div>
          {s.liabilities.map((x) => (
            <div key={x.id} className="flex items-center justify-between border-t py-2 text-sm">
              <div><div className="font-medium">{x.name}</div><div className="text-xs text-muted-foreground">{x.type} · cicilan {rp(x.monthly)}/bln</div></div>
              <div className="flex items-center gap-3"><span>{rp(x.balance)}</span>
                <button aria-label="Hapus" onClick={() => update((st) => ({ ...st, liabilities: st.liabilities.filter((y) => y.id !== x.id) }))}><Trash2 className="size-4 text-muted-foreground" /></button></div>
            </div>
          ))}
          <form className="mt-3 grid grid-cols-2 gap-2 border-t pt-3" onSubmit={(e) => { e.preventDefault(); if (!l.name || l.balance <= 0) return; update((st) => ({ ...st, liabilities: [...st.liabilities, { ...l, id: newId() }] })); setL({ ...l, name: "", balance: 0, monthly: 0 }); }}>
            <input placeholder="Nama utang" className={field} value={l.name} onChange={(e) => setL({ ...l, name: e.target.value })} />
            <select className={field} value={l.type} onChange={(e) => setL({ ...l, type: e.target.value })}>{LIAB_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
            <input type="number" placeholder="Sisa utang" className={field} value={l.balance || ""} onChange={(e) => setL({ ...l, balance: +e.target.value })} />
            <input type="number" placeholder="Cicilan/bln" className={field} value={l.monthly || ""} onChange={(e) => setL({ ...l, monthly: +e.target.value })} />
            <button className="col-span-2 flex items-center justify-center gap-1 rounded-lg bg-secondary py-2 text-sm font-semibold text-secondary-foreground"><Plus className="size-4" />Liabilitas</button>
          </form>
        </Card>
      </div>
      <Card className="mt-6 flex items-center justify-between">
        <span className="font-display text-lg">Kekayaan Bersih</span>
        <span className={`text-2xl font-bold ${m.networth >= 0 ? "text-primary" : "text-destructive"}`}>{rp(m.networth)}</span>
      </Card>
    </>
  );
}
