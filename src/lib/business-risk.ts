import { metrics, newId, rp, type State, type Tx } from "@/lib/finance";

/** Apply a transaction to cash flow AND the balance sheet (Kas asset, akad liabilities). */
export function applyTx(s: State, tx: Tx, sign: 1 | -1 = 1): State {
  const delta = (tx.type === "income" ? tx.amount : -tx.amount) * sign;
  let assets = s.assets;
  const kas = assets.find((a) => a.type === "Kas");
  assets = kas
    ? assets.map((a) => (a.id === kas.id ? { ...a, value: a.value + delta } : a))
    : [...assets, { id: newId(), name: "Kas & Tabungan", type: "Kas", value: delta, zakatable: true }];
  let liabilities = s.liabilities;
  if (tx.type === "expense" && tx.category === "Cicilan Akad" && liabilities.length) {
    // pay down the akad with the largest monthly installment
    const target = [...liabilities].sort((a, b) => b.monthly - a.monthly)[0]!;
    liabilities = liabilities.map((l) => (l.id === target.id ? { ...l, balance: Math.max(0, l.balance - tx.amount * sign) } : l));
  }
  const txs = sign === 1 ? [...s.txs, tx] : s.txs.filter((t) => t.id !== tx.id);
  return { ...s, txs, assets, liabilities };
}

export type Risk = { title: string; level: "Tinggi" | "Sedang" | "Rendah"; finding: string; solusi: string[]; mitigasi: string[] };

export function analyzeRisks(s: State): { risks: Risk[]; saran: string[] } {
  const m = metrics(s);
  const risks: Risk[] = [];
  const months = m.months;
  const cur = months.at(-1);
  const prev = months.at(-2);
  const income = s.txs.filter((t) => t.type === "income");
  const totalIn = income.reduce((a, t) => a + t.amount, 0);
  const bySrc = new Map<string, number>();
  income.forEach((t) => bySrc.set(t.category, (bySrc.get(t.category) ?? 0) + t.amount));
  const topSrc = [...bySrc.entries()].sort((a, b) => b[1] - a[1])[0];
  const sum = (cat: string) => s.txs.filter((t) => t.category === cat).reduce((a, t) => a + t.amount, 0);

  if (cur && cur.expense > cur.income)
    risks.push({ title: "Defisit Arus Kas", level: "Tinggi",
      finding: `Pengeluaran bulan ini ${rp(cur.expense)} melebihi pemasukan ${rp(cur.income)} (defisit ${rp(cur.expense - cur.income)}).`,
      solusi: ["Tunda pengeluaran non-prioritas bulan ini", "Tagih piutang usaha yang jatuh tempo", "Gunakan dana darurat seperlunya, jangan berutang ribawi"],
      mitigasi: ["Buat anggaran bulanan per kategori", "Sisihkan minimal 10% pemasukan di awal bulan (pay yourself first)"] });
  else if (cur && cur.income > 0 && cur.expense / cur.income > 0.8)
    risks.push({ title: "Margin Arus Kas Tipis", level: "Sedang",
      finding: `${((cur.expense / cur.income) * 100).toFixed(0)}% pemasukan habis untuk pengeluaran.`,
      solusi: ["Identifikasi 3 pengeluaran terbesar dan pangkas 10–20%"],
      mitigasi: ["Targetkan rasio pengeluaran maksimal 70% pemasukan"] });

  if (topSrc && totalIn && topSrc[1] / totalIn > 0.7)
    risks.push({ title: "Konsentrasi Sumber Pendapatan", level: "Sedang",
      finding: `${((topSrc[1] / totalIn) * 100).toFixed(0)}% pendapatan berasal dari "${topSrc[0]}". Jika sumber ini terganggu, arus kas langsung terpukul.`,
      solusi: ["Kembangkan sumber kedua: usaha sampingan atau imbal hasil sukuk/reksa dana syariah"],
      mitigasi: ["Targetkan tidak ada satu sumber > 60% pendapatan", "Perbesar dana darurat selama masih bergantung pada satu sumber"] });

  if (cur && prev && prev.income > 0 && cur.income < prev.income * 0.9)
    risks.push({ title: "Penurunan Pendapatan", level: "Sedang",
      finding: `Pendapatan turun ${(((prev.income - cur.income) / prev.income) * 100).toFixed(0)}% dibanding bulan lalu.`,
      solusi: ["Evaluasi penyebab: musiman, harga, atau kehilangan pelanggan", "Aktifkan promosi/penjualan ulang ke pelanggan lama"],
      mitigasi: ["Pantau tren 3 bulan, bukan hanya bulan berjalan", "Siapkan cadangan untuk bulan sepi"] });

  if (cur && prev && prev.expense > 0 && cur.expense > prev.expense * 1.15)
    risks.push({ title: "Lonjakan Pengeluaran", level: "Sedang",
      finding: `Pengeluaran naik ${(((cur.expense - prev.expense) / prev.expense) * 100).toFixed(0)}% dibanding bulan lalu.`,
      solusi: ["Periksa transaksi besar bulan ini, pisahkan yang sekali-bayar vs rutin"],
      mitigasi: ["Tetapkan batas pengeluaran per kategori dan tinjau mingguan"] });

  const biz = months.map((mo) => s.txs.filter((t) => t.category === "Laba Usaha" && t.date.startsWith(mo.month)).reduce((a, t) => a + t.amount, 0)).filter(Boolean);
  if (biz.length >= 3) {
    const avg = biz.reduce((a, b) => a + b, 0) / biz.length;
    const sd = Math.sqrt(biz.reduce((a, b) => a + (b - avg) ** 2, 0) / biz.length);
    if (avg && sd / avg > 0.25)
      risks.push({ title: "Laba Usaha Fluktuatif", level: "Sedang",
        finding: `Laba usaha naik-turun ±${((sd / avg) * 100).toFixed(0)}% dari rata-rata ${rp(avg)}.`,
        solusi: ["Jangan jadikan laba usaha dasar untuk cicilan tetap"],
        mitigasi: ["Buat kontrak/pelanggan berlangganan untuk pendapatan stabil", "Simpan 20% laba bulan ramai untuk bulan sepi"] });
  }

  if (m.dsr > 0.3)
    risks.push({ title: "Beban Cicilan Akad Berlebih", level: "Tinggi",
      finding: `Cicilan ${rp(m.installments)}/bulan = ${(m.dsr * 100).toFixed(0)}% pendapatan (batas aman 30%).`,
      solusi: ["Ajukan restrukturisasi/penjadwalan ulang ke bank syariah", "Lunasi akad terkecil lebih dulu dari surplus"],
      mitigasi: ["Tidak mengambil akad pembiayaan baru sampai DSR < 30%"] });

  if (m.efMonths < m.efTarget[0])
    risks.push({ title: "Risiko Likuiditas", level: m.efMonths < 1 ? "Tinggi" : "Sedang",
      finding: `Kas hanya cukup ${m.efMonths.toFixed(1)} bulan biaya hidup (target ${m.efTarget[0]}–${m.efTarget[1]} bulan).`,
      solusi: [`Sisihkan ${rp(Math.max(0, (m.efTarget[0] * m.livingAvg - m.liquid) / 6))}/bulan selama 6 bulan`],
      mitigasi: ["Simpan dana darurat di tabungan syariah terpisah, bukan instrumen berisiko"] });

  if (m.quarantine > 0)
    risks.push({ title: "Pendapatan Non-Halal Belum Dibersihkan", level: "Tinggi",
      finding: `${rp(m.quarantine)} pendapatan non-halal masih tercampur dengan harta.`,
      solusi: ["Salurkan ke Dana Kebajikan (halaman Neraca & Zakat)"],
      mitigasi: ["Pindahkan rekening konvensional ke bank syariah"] });

  if (totalIn && sum("ZIS") / totalIn < 0.025)
    risks.push({ title: "ZIS di Bawah 2,5%", level: "Rendah",
      finding: `Zakat/infaq/sedekah baru ${((sum("ZIS") / totalIn) * 100).toFixed(1)}% dari pendapatan.`,
      solusi: ["Tunaikan zakat penghasilan 2,5% dari pendapatan saat diterima"],
      mitigasi: ["Otomatiskan transfer ZIS setiap gajian"] });

  const order = { Tinggi: 0, Sedang: 1, Rendah: 2 };
  risks.sort((a, b) => order[a.level] - order[b.level]);

  const saran: string[] = [];
  if (m.surplus > 0) saran.push(`Alokasikan surplus ${rp(m.surplus)}: 40% dana darurat, 30% pelunasan akad, 20% investasi syariah (sukuk/emas), 10% infaq.`);
  if (m.zakat > 0) saran.push(`Harta Anda sudah mencapai nisab — siapkan Zakat Mal ${rp(m.zakat)}.`);
  if (!risks.some((r) => r.level === "Tinggi")) saran.push("Tidak ada risiko tinggi. Pertahankan disiplin pencatatan setiap transaksi.");
  saran.push("Catat setiap transaksi pada hari yang sama agar analisis tetap akurat.");
  return { risks, saran };
}
