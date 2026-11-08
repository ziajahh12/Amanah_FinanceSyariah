import { useEffect, useState, useSyncExternalStore } from "react";

export const INCOME_CATS = ["Gaji Halal", "Laba Usaha", "Imbal Hasil Investasi", "Hasil Akad"] as const;
export const EXPENSE_CATS = ["Biaya Hidup", "ZIS", "Cicilan Akad", "Dana Kebajikan"] as const;
export const ASSET_TYPES = ["Kas", "Sukuk", "Emas", "Reksa Dana Syariah", "Properti"] as const;
export const LIAB_TYPES = ["Murabahah", "Musyarakah", "Qardh Hasan"] as const;

export type Tx = { id: string; date: string; type: "income" | "expense"; category: string; amount: number; note: string; nonHalal?: boolean };
export type Asset = { id: string; name: string; type: string; value: number; zakatable: boolean };
export type Liability = { id: string; name: string; type: string; balance: number; monthly: number };
export type Profile = { family: boolean; goldPrice: number };
export type State = { txs: Tx[]; assets: Asset[]; liabilities: Liability[]; profile: Profile };

const uid = () => Math.random().toString(36).slice(2, 10);

function seed(): State {
  const txs: Tx[] = [];
  const now = new Date();
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const ds = (day: number) => new Date(d.getFullYear(), d.getMonth(), day).toISOString().slice(0, 10);
    const v = 1 + (m % 3) * 0.04;
    txs.push(
      { id: uid(), date: ds(1), type: "income", category: "Gaji Halal", amount: 18_000_000, note: "Gaji bulanan" },
      { id: uid(), date: ds(10), type: "income", category: "Laba Usaha", amount: Math.round(4_500_000 * v), note: "Toko online" },
      { id: uid(), date: ds(15), type: "income", category: "Imbal Hasil Investasi", amount: 850_000, note: "Kupon sukuk" },
      { id: uid(), date: ds(5), type: "expense", category: "Biaya Hidup", amount: Math.round(9_200_000 * v), note: "Kebutuhan rumah tangga" },
      { id: uid(), date: ds(3), type: "expense", category: "Cicilan Akad", amount: 5_400_000, note: "KPR Murabahah + Ijarah mobil" },
      { id: uid(), date: ds(2), type: "expense", category: "ZIS", amount: 1_250_000, note: "Infaq & sedekah" },
    );
    if (m === 1) txs.push({ id: uid(), date: ds(20), type: "income", category: "Hasil Akad", amount: 320_000, note: "Bunga tabungan konvensional", nonHalal: true });
  }
  return {
    txs,
    assets: [
      { id: uid(), name: "Tabungan Syariah", type: "Kas", value: 62_000_000, zakatable: true },
      { id: uid(), name: "Sukuk Ritel SR020", type: "Sukuk", value: 50_000_000, zakatable: true },
      { id: uid(), name: "Logam Mulia 40g", type: "Emas", value: 54_000_000, zakatable: true },
      { id: uid(), name: "Rumah Tinggal", type: "Properti", value: 650_000_000, zakatable: false },
      { id: uid(), name: "Reksa Dana Saham Syariah", type: "Reksa Dana Syariah", value: 35_000_000, zakatable: true },
    ],
    liabilities: [
      { id: uid(), name: "KPR Murabahah", type: "Murabahah", balance: 380_000_000, monthly: 4_200_000 },
      { id: uid(), name: "Pembiayaan Mobil", type: "Musyarakah", balance: 48_000_000, monthly: 1_200_000 },
      { id: uid(), name: "Pinjaman Keluarga", type: "Qardh Hasan", balance: 10_000_000, monthly: 0 },
    ],
    profile: { family: true, goldPrice: 1_350_000 },
  };
}

// ---- tiny store (localStorage) ----
const KEY = "syariah-fin-v1";
let state: State | null = null;
const subs = new Set<() => void>();
const load = (): State => {
  if (state) return state;
  try { const raw = localStorage.getItem(KEY); state = raw ? JSON.parse(raw) : seed(); } catch { state = seed(); }
  return state!;
};
export function update(fn: (s: State) => State) {
  state = fn(load());
  localStorage.setItem(KEY, JSON.stringify(state));
  subs.forEach((f) => f());
}
export const resetDemo = () => update(() => seed());
export const clearAll = () => update((s) => ({ txs: [], assets: [], liabilities: [], profile: s.profile }));
export const newId = uid;
let SERVER: State | null = null;
const serverState = () => (SERVER ??= seed());
export function useFinance(): State {
  const [hydrated, setH] = useState(false);
  useEffect(() => setH(true), []);
  const s = useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), () => (hydrated ? load() : serverState()), serverState);
  return s;
}

// ---- calculations ----
export const rp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
export const rpShort = (n: number) => (Math.abs(n) >= 1e9 ? (n / 1e9).toFixed(1) + " M" : Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + " jt" : Math.round(n / 1e3) + " rb");

export function monthly(txs: Tx[]) {
  const map = new Map<string, { month: string; income: number; expense: number }>();
  for (const t of txs) {
    const k = t.date.slice(0, 7);
    const r = map.get(k) ?? { month: k, income: 0, expense: 0 };
    r[t.type] += t.amount;
    map.set(k, r);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month)).map((r) => ({
    ...r,
    label: new Date(r.month + "-01").toLocaleDateString("id-ID", { month: "short" }),
  }));
}

export function metrics(s: State) {
  const months = monthly(s.txs);
  const n = Math.max(months.length, 1);
  const cur = months[months.length - 1] ?? { income: 0, expense: 0 };
  const avgIncome = months.reduce((a, m) => a + m.income, 0) / n;
  const livingAvg = s.txs.filter((t) => t.type === "expense" && t.category !== "Dana Kebajikan").reduce((a, t) => a + t.amount, 0) / n;
  const totalAssets = s.assets.reduce((a, x) => a + x.value, 0);
  const totalLiab = s.liabilities.reduce((a, x) => a + x.balance, 0);
  const liquid = s.assets.filter((a) => a.type === "Kas").reduce((a, x) => a + x.value, 0);
  const investRisky = s.assets.filter((a) => a.type === "Reksa Dana Syariah").reduce((a, x) => a + x.value, 0);
  const installments = s.liabilities.reduce((a, x) => a + x.monthly, 0);
  const dsr = avgIncome ? installments / avgIncome : 0;
  const efMonths = livingAvg ? liquid / livingAvg : 0;
  const efTarget: [number, number] = s.profile.family ? [6, 12] : [3, 6];
  const nisab = 85 * s.profile.goldPrice;
  const zakatable = s.assets.filter((a) => a.zakatable).reduce((a, x) => a + x.value, 0);
  const zakat = zakatable >= nisab ? zakatable * 0.025 : 0;
  const nonHalal = s.txs.filter((t) => t.nonHalal).reduce((a, t) => a + t.amount, 0);
  const cleansed = s.txs.filter((t) => t.category === "Dana Kebajikan").reduce((a, t) => a + t.amount, 0);
  const quarantine = Math.max(nonHalal - cleansed, 0);
  const clamp = (x: number) => Math.max(0, Math.min(100, x));
  const liquidityRisk = clamp(100 - (efMonths / efTarget[0]) * 100);
  const solvencyRisk = clamp((totalAssets ? totalLiab / totalAssets : 1) * 50);
  const investmentRisk = clamp((totalAssets ? investRisky / totalAssets : 0) * 200);
  const overallRisk = (liquidityRisk + solvencyRisk + investmentRisk + clamp(dsr / 0.3 * 50)) / 4;
  const compliant = quarantine === 0 && dsr <= 0.3;
  return {
    months, cur, surplus: cur.income - cur.expense, avgIncome, livingAvg, totalAssets, totalLiab, networth: totalAssets - totalLiab,
    liquid, installments, dsr, efMonths, efTarget, nisab, zakatable, zakat, nonHalal, cleansed, quarantine,
    liquidityRisk, solvencyRisk, investmentRisk, overallRisk, compliant,
  };
}
export type Metrics = ReturnType<typeof metrics>;
export const riskLabel = (v: number) => (v < 34 ? "Rendah" : v < 67 ? "Sedang" : "Tinggi");

// ---- rule-based AI agent ----
export const PRESETS = [
  "Analisis risiko keuangan saya bulan ini",
  "Hitung Zakat Mal & usulan pembersihan dana",
  "Apakah rasio utang/cash flow saya sehat secara Syariah?",
];
export function agentReply(q: string, m: Metrics): string {
  const t = q.toLowerCase();
  const out: string[] = [];
  if (t.includes("zakat") || t.includes("bersih")) {
    out.push("**Zakat Mal**");
    out.push(`• Harta wajib zakat: ${rp(m.zakatable)} (nisab 85g emas ≈ ${rp(m.nisab)})`);
    out.push(m.zakat > 0 ? `• Telah mencapai nisab → zakat 2,5% = **${rp(m.zakat)}** (≈ ${rp(m.zakat / 12)}/bulan bila dicicil).` : "• Belum mencapai nisab, belum wajib zakat mal. Tetap anjurkan infaq.");
    out.push("**Pembersihan Dana**");
    out.push(m.quarantine > 0 ? `• Ada pendapatan non-halal ${rp(m.quarantine)} yang belum disalurkan. Salurkan ke Dana Kebajikan (fasilitas umum), bukan untuk manfaat pribadi.` : "• Tidak ada dana non-halal tertunda. Alhamdulillah, harta bersih.");
  } else if (t.includes("utang") || t.includes("rasio") || t.includes("sehat")) {
    out.push("**Kesehatan Utang & Cash Flow**");
    out.push(`• DSR: ${(m.dsr * 100).toFixed(1)}% ${m.dsr > 0.3 ? "⚠️ melebihi batas 30%" : "✅ di bawah batas 30%"}`);
    out.push(`• Surplus bulan ini: ${rp(m.surplus)} ${m.surplus < 0 ? "⚠️ defisit" : "✅"}`);
    out.push(`• Rasio utang/aset: ${((m.totalLiab / Math.max(m.totalAssets, 1)) * 100).toFixed(0)}%`);
    out.push(m.dsr > 0.3 ? "Saran: hindari akad baru, negosiasikan restrukturisasi Murabahah, dan prioritaskan pelunasan cicilan terkecil." : "Saran: pertahankan; pertimbangkan pelunasan dipercepat Murabahah (minta muqassah/potongan) dari surplus.");
  } else {
    out.push("**Analisis Risiko Bulan Ini**");
    out.push(`• Dana darurat: ${m.efMonths.toFixed(1)}x biaya hidup (target ${m.efTarget[0]}–${m.efTarget[1]}x) → risiko likuiditas ${riskLabel(m.liquidityRisk)}`);
    out.push(`• Solvabilitas: risiko ${riskLabel(m.solvencyRisk)} (kekayaan bersih ${rp(m.networth)})`);
    out.push(`• Investasi: risiko ${riskLabel(m.investmentRisk)}`);
    out.push(`• DSR ${(m.dsr * 100).toFixed(1)}%`);
    if (m.efMonths < m.efTarget[0]) out.push(`Saran: sisihkan ${rp((m.efTarget[0] * m.livingAvg - m.liquid) / 6)}/bulan selama 6 bulan ke tabungan syariah.`);
    else out.push("Saran: dana darurat aman; alokasikan surplus ke sukuk atau emas untuk diversifikasi.");
  }
  out.push("\n_Simulasi edukatif, bukan fatwa. Konsultasikan dengan DPS/ustadz terpercaya._");
  return out.join("\n");
}

export async function exportExcel(s: State) {
  const XLSX = await import("xlsx");
  const m = metrics(s);
  const wb = XLSX.utils.book_new();
  const add = (name: string, rows: object[]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
  add("Ringkasan", [
    { Item: "Total Aset", Nilai: m.totalAssets }, { Item: "Total Liabilitas", Nilai: m.totalLiab },
    { Item: "Kekayaan Bersih", Nilai: m.networth }, { Item: "Surplus Bulan Ini", Nilai: m.surplus },
    { Item: "Zakat Mal", Nilai: Math.round(m.zakat) }, { Item: "Dana Non-Halal Tertunda", Nilai: m.quarantine },
    { Item: "DSR (%)", Nilai: +(m.dsr * 100).toFixed(1) }, { Item: "Dana Darurat (x biaya hidup)", Nilai: +m.efMonths.toFixed(1) },
  ]);
  add("Arus Kas", [...s.txs].sort((a, b) => a.date.localeCompare(b.date)).map((t) => ({
    Tanggal: t.date, Jenis: t.type === "income" ? "Pemasukan" : "Pengeluaran", Kategori: t.category,
    Jumlah: t.amount, Catatan: t.note, "Non-Halal": t.nonHalal ? "Ya" : "",
  })));
  add("Aset", s.assets.map((a) => ({ Nama: a.name, Jenis: a.type, Nilai: a.value, "Wajib Zakat": a.zakatable ? "Ya" : "Tidak" })));
  add("Liabilitas", s.liabilities.map((l) => ({ Nama: l.name, Akad: l.type, "Sisa Utang": l.balance, "Cicilan/Bulan": l.monthly })));
  XLSX.writeFile(wb, `laporan-keuangan-syariah-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
