import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Wallet, TrendingUp, ShieldCheck, Activity } from "lucide-react";
import { Card, PageTitle } from "@/components/AppShell";
import { metrics, riskLabel, rp, rpShort, useFinance } from "@/lib/finance";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Amanah Keuangan Syariah" },
      { name: "description", content: "Ringkasan kekayaan bersih, arus kas, kepatuhan syariah, dan risiko keuangan Anda." },
      { property: "og:title", content: "Dashboard — Amanah Keuangan Syariah" },
      { property: "og:description", content: "Ringkasan kekayaan bersih, arus kas, kepatuhan syariah, dan risiko keuangan." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const m = metrics(useFinance());
  const cards = [
    { label: "Neraca Kekayaan Bersih", value: rp(m.networth), icon: Wallet, tone: "text-primary" },
    { label: "Surplus/Defisit Bulan Ini", value: rp(m.surplus), icon: TrendingUp, tone: m.surplus >= 0 ? "text-success" : "text-destructive" },
    { label: "Status Kepatuhan Syariah", value: m.compliant ? "Patuh" : "Perlu Tindakan", icon: ShieldCheck, tone: m.compliant ? "text-success" : "text-warning" },
    { label: "Tingkat Risiko", value: riskLabel(m.overallRisk), icon: Activity, tone: m.overallRisk < 34 ? "text-success" : m.overallRisk < 67 ? "text-warning" : "text-destructive" },
  ];
  const pie = [{ name: "Aset", value: m.totalAssets }, { name: "Liabilitas", value: m.totalLiab }];
  return (
    <>
      <PageTitle title="Dashboard" sub="Bismillah — ringkasan keuangan syariah Anda" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="relative overflow-hidden">
            <div className="absolute -right-6 -top-6 size-24 islamic-pattern opacity-70" />
            <Icon className={`size-5 ${tone}`} />
            <div className="mt-3 text-xs text-muted-foreground">{label}</div>
            <div className={`mt-1 text-xl font-bold ${tone}`}>{value}</div>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-lg">Tren Pemasukan vs Pengeluaran</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={m.months}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis tickFormatter={rpShort} fontSize={12} width={60} />
              <Tooltip formatter={(v: number) => rp(v)} />
              <Legend />
              <Line type="monotone" dataKey="income" name="Pemasukan" stroke="var(--chart-1)" strokeWidth={3} />
              <Line type="monotone" dataKey="expense" name="Pengeluaran" stroke="var(--chart-2)" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="mb-4 text-lg">Aset vs Liabilitas</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                <Cell fill="var(--chart-1)" /><Cell fill="var(--chart-4)" />
              </Pie>
              <Tooltip formatter={(v: number) => rp(v)} /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card className="mt-6">
        <h3 className="mb-4 text-lg">Surplus Bulanan</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={m.months.map((x) => ({ ...x, surplus: x.income - x.expense }))}>
            <XAxis dataKey="label" fontSize={12} /><YAxis tickFormatter={rpShort} fontSize={12} width={60} />
            <Tooltip formatter={(v: number) => rp(v)} />
            <Bar dataKey="surplus" name="Surplus" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}
