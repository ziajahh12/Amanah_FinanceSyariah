import { cashFlowBy, cashStatus, metrics, rp, type State } from "@/lib/finance";

const RP = '"Rp" #,##0;[Red]("Rp" #,##0);"-"';
const EMERALD = "FF0F5132";
const GOLD = "FFF5E6B8";
const LIGHT = "FFF1F7F4";
const thin = { style: "thin" as const, color: { argb: "FFD0D7D3" } };
const border = { top: thin, left: thin, bottom: thin, right: thin };

type Col = { header: string; key: string; width: number; money?: boolean };

export async function exportExcel(s: State) {
  const ExcelJS = (await import("exceljs")).default;
  const m = metrics(s);
  const wb = new ExcelJS.Workbook();
  wb.creator = "Amanah Keuangan Syariah";
  wb.created = new Date();
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  function sheet(name: string, title: string, cols: Col[], rows: Record<string, unknown>[], totals?: string[]) {
    const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 4, showGridLines: false }], pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    const last = String.fromCharCode(64 + cols.length);
    ws.columns = cols.map((c) => ({ key: c.key, width: c.width }));
    ws.mergeCells(`A1:${last}1`);
    Object.assign(ws.getCell("A1"), { value: title });
    ws.getCell("A1").font = { name: "Arial", size: 14, bold: true, color: { argb: EMERALD } };
    ws.mergeCells(`A2:${last}2`);
    ws.getCell("A2").value = `Amanah Keuangan Syariah · Per ${today}`;
    ws.getCell("A2").font = { name: "Arial", size: 9, italic: true, color: { argb: "FF6B7280" } };
    const head = ws.getRow(4);
    cols.forEach((c, i) => {
      const cell = head.getCell(i + 1);
      cell.value = c.header;
      cell.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EMERALD } };
      cell.alignment = { vertical: "middle", horizontal: c.money ? "right" : "left" };
      cell.border = border;
    });
    head.height = 22;
    rows.forEach((r, ri) => {
      const row = ws.getRow(5 + ri);
      cols.forEach((c, i) => {
        const cell = row.getCell(i + 1);
        cell.value = r[c.key] as never;
        cell.font = { name: "Arial", size: 10 };
        cell.border = border;
        if (c.money) cell.numFmt = RP;
        if (ri % 2) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
      });
    });
    if (totals) {
      const tr = ws.getRow(5 + rows.length);
      tr.getCell(1).value = "TOTAL";
      cols.forEach((c, i) => {
        const cell = tr.getCell(i + 1);
        const L = String.fromCharCode(65 + i);
        if (totals.includes(c.key)) cell.value = { formula: `SUM(${L}5:${L}${4 + rows.length})`, result: rows.reduce((a, r) => a + (Number(r[c.key]) || 0), 0) };
        cell.font = { name: "Arial", bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
        cell.border = { ...border, top: { style: "medium", color: { argb: EMERALD } } };
        if (c.money) cell.numFmt = RP;
      });
    }
    ws.autoFilter = { from: "A4", to: `${last}${4 + rows.length}` };
    return ws;
  }

  // Ringkasan
  const pct = (v: number) => ({ v, fmt: "0.0%" });
  const summary: [string, number | { v: number; fmt: string }, string][] = [
    ["Total Aset", m.totalAssets, "Neraca"], ["Total Liabilitas", m.totalLiab, "Neraca"], ["Kekayaan Bersih", m.networth, "Neraca"],
    ["Pemasukan Bulan Ini", m.cur.income, "Arus Kas"], ["Pengeluaran Bulan Ini", m.cur.expense, "Arus Kas"], ["Surplus / (Defisit)", m.surplus, "Arus Kas"],
    ["Harta Wajib Zakat", m.zakatable, "Kepatuhan"], ["Nisab (85 g emas)", m.nisab, "Kepatuhan"], ["Zakat Mal Terutang (2,5%)", Math.round(m.zakat), "Kepatuhan"],
    ["Dana Non-Halal Belum Dibersihkan", m.quarantine, "Kepatuhan"],
    ["Debt Service Ratio (maks. 30%)", pct(m.dsr), "Risiko"], ["Dana Darurat (x biaya hidup)", { v: +m.efMonths.toFixed(1), fmt: '0.0"x"' }, "Risiko"],
  ];
  const ws = sheet("Ringkasan", "RINGKASAN KEUANGAN SYARIAH", [
    { header: "Kelompok", key: "g", width: 16 }, { header: "Keterangan", key: "k", width: 38 }, { header: "Nilai", key: "v", width: 22, money: true },
  ], summary.map(([k, v, g]) => ({ g, k, v: typeof v === "number" ? v : v.v })));
  summary.forEach(([, v], i) => { if (typeof v !== "number") ws.getCell(`C${5 + i}`).numFmt = v.fmt; });

  const txs = [...s.txs].sort((a, b) => a.date.localeCompare(b.date));
  sheet("Arus Kas", "LAPORAN ARUS KAS", [
    { header: "No", key: "no", width: 6 }, { header: "Tanggal", key: "d", width: 13 }, { header: "Kategori", key: "c", width: 24 },
    { header: "Keterangan", key: "n", width: 36 }, { header: "Pemasukan", key: "in", width: 18, money: true },
    { header: "Pengeluaran", key: "out", width: 18, money: true }, { header: "Status Syariah", key: "st", width: 16 },
  ], txs.map((t, i) => ({
    no: i + 1, d: new Date(t.date), c: t.category, n: t.note,
    in: t.type === "income" ? t.amount : null, out: t.type === "expense" ? t.amount : null,
    st: t.nonHalal ? "Non-Halal" : "Halal",
  })), ["in", "out"]).getColumn(2).numFmt = "dd/mm/yyyy";

  // Rekap per bulan & per tahun, dengan keterangan Surplus/Defisit
  const recap = (name: string, title: string, period: "month" | "year") => {
    const rows = cashFlowBy(s.txs, period);
    const w = sheet(name, title, [
      { header: period === "month" ? "Bulan" : "Tahun", key: "p", width: 22 }, { header: "Pemasukan", key: "in", width: 20, money: true },
      { header: "Pengeluaran", key: "out", width: 20, money: true }, { header: "Selisih", key: "net", width: 20, money: true },
      { header: "Keterangan", key: "st", width: 14 },
    ], rows.map((r) => ({ p: r.label, in: r.income, out: r.expense, net: r.net, st: r.status })), ["in", "out", "net"]);
    const color = (st: string) => ({ argb: st === "Defisit" ? "FFB91C1C" : st === "Surplus" ? "FF15803D" : "FF6B7280" });
    rows.forEach((r, i) => { const c = w.getCell(`E${5 + i}`); c.font = { name: "Arial", size: 10, bold: true, color: color(r.status) }; });
    const net = rows.reduce((a, r) => a + r.net, 0);
    const tr = 5 + rows.length;
    const st = cashStatus(net);
    const cell = w.getCell(`E${tr}`);
    cell.value = { formula: `IF(D${tr}>0,"Surplus",IF(D${tr}<0,"Defisit","Seimbang"))`, result: st };
    cell.font = { name: "Arial", bold: true, color: color(st) };
    w.mergeCells(`A${tr + 2}:E${tr + 2}`);
    const note = w.getCell(`A${tr + 2}`);
    note.value = st === "Surplus" ? `Keterangan: Surplus ${rp(net)} — pemasukan lebih besar dari pengeluaran.`
      : st === "Defisit" ? `Keterangan: Defisit ${rp(-net)} — pengeluaran melebihi pemasukan.` : "Keterangan: Pemasukan dan pengeluaran seimbang.";
    note.font = { name: "Arial", size: 10, italic: true, bold: true, color: color(st) };
  };
  recap("Arus Kas Bulanan", "LAPORAN ARUS KAS BULANAN", "month");
  recap("Arus Kas Tahunan", "LAPORAN ARUS KAS TAHUNAN", "year");

  sheet("Neraca - Aset", "DAFTAR ASET", [
    { header: "No", key: "no", width: 6 }, { header: "Nama Aset", key: "n", width: 32 }, { header: "Jenis", key: "t", width: 22 },
    { header: "Wajib Zakat", key: "z", width: 13 }, { header: "Nilai", key: "v", width: 20, money: true },
  ], s.assets.map((a, i) => ({ no: i + 1, n: a.name, t: a.type, z: a.zakatable ? "Ya" : "Tidak", v: a.value })), ["v"]);

  sheet("Neraca - Liabilitas", "DAFTAR LIABILITAS SYARIAH", [
    { header: "No", key: "no", width: 6 }, { header: "Nama", key: "n", width: 32 }, { header: "Jenis Akad", key: "t", width: 18 },
    { header: "Sisa Utang", key: "b", width: 20, money: true }, { header: "Cicilan / Bulan", key: "m", width: 18, money: true },
  ], s.liabilities.map((l, i) => ({ no: i + 1, n: l.name, t: l.type, b: l.balance, m: l.monthly })), ["b", "m"]);

  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `Laporan-Keuangan-Syariah-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
