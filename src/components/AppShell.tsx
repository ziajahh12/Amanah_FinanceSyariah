import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, ArrowLeftRight, Scale, ShieldAlert, Menu, X, RotateCcw, Trash2, LogOut, FileSpreadsheet, Printer } from "lucide-react";
import { resetDemo, clearAll, disconnectCloud, useFinance } from "@/lib/finance";
import { exportExcel } from "@/lib/export-excel";
import { AgentWidget } from "./AgentWidget";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/arus-kas", label: "Arus Kas", icon: ArrowLeftRight },
  { to: "/neraca", label: "Neraca & Zakat", icon: Scale },
  { to: "/risiko", label: "Manajemen Risiko", icon: ShieldAlert },
] as const;

export function AppShell({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const data = useFinance();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await disconnectCloud();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <div className="min-h-screen lg:flex">
      <aside className={`print:hidden fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground islamic-pattern transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-6">
          <div>
            <div className="font-display text-2xl text-gold">Amanah</div>
            <div className="text-xs opacity-70">Keuangan Syariah</div>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu"><X /></button>
        </div>
        <nav className="space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm opacity-80 hover:bg-sidebar-accent hover:opacity-100"
              activeProps={{ className: "bg-sidebar-accent !opacity-100 font-semibold" }}>
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mx-3 mt-6 space-y-1 border-t border-sidebar-accent pt-4">
          <button onClick={() => exportExcel(data)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-80 hover:bg-sidebar-accent hover:opacity-100"><FileSpreadsheet className="size-4" /> Unduh Excel</button>
          <button onClick={() => window.print()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-80 hover:bg-sidebar-accent hover:opacity-100"><Printer className="size-4" /> Cetak / Simpan PDF</button>
        </div>
        <div className="absolute bottom-6 left-6 right-6 space-y-2 text-xs">
          <div className="truncate opacity-60">{email}</div>
          <button onClick={signOut} className="flex items-center gap-2 font-semibold hover:opacity-80"><LogOut className="size-3" /> Keluar</button>
          <button onClick={() => confirm("Hapus semua data dan mulai dengan data Anda sendiri?") && clearAll()} className="flex items-center gap-2 font-semibold text-gold hover:opacity-80">
            <Trash2 className="size-3" /> Mulai dari nol (data asli)
          </button>
          <button onClick={() => confirm("Ganti semua data dengan data contoh?") && resetDemo()} className="flex items-center gap-2 opacity-60 hover:opacity-100">
            <RotateCcw className="size-3" /> Muat data contoh
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)} />}
      <main className="flex-1 min-w-0">
        <header className="print:hidden flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Buka menu"><Menu /></button>
          <span className="font-display text-lg text-primary">Amanah</span>
        </header>
        <div className="mx-auto max-w-6xl p-4 md:p-8"><Outlet /></div>
      </main>
      <AgentWidget />
    </div>
  );
}

export function PageTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl text-primary">{title}</h1>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-card p-5 shadow-sm ${className}`}>{children}</div>;
}

