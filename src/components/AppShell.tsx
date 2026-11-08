import { Link, Outlet } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, ArrowLeftRight, Scale, ShieldAlert, Menu, X, Sparkles, Send, RotateCcw, Trash2, FileSpreadsheet, Printer } from "lucide-react";
import { agentReply, metrics, PRESETS, resetDemo, clearAll, exportExcel, useFinance } from "@/lib/finance";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/arus-kas", label: "Arus Kas", icon: ArrowLeftRight },
  { to: "/neraca", label: "Neraca & Zakat", icon: Scale },
  { to: "/risiko", label: "Manajemen Risiko", icon: ShieldAlert },
] as const;

export function AppShell() {
  const [open, setOpen] = useState(false);
  const data = useFinance();
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
        <div className="absolute bottom-6 left-6 space-y-2 text-xs">
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

function Rich({ text }: { text: string }) {
  return (
    <div className="space-y-1 whitespace-pre-wrap">
      {text.split("\n").map((l, i) => (
        <p key={i} dangerouslySetInnerHTML={{ __html: l.replace(/[<>]/g, "").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/_(.+?)_/g, "<i>$1</i>") }} />
      ))}
    </div>
  );
}

function AgentWidget() {
  const s = useFinance();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Assalamu'alaikum! Saya **Ustadz Financial AI Agent**. Pilih pertanyaan di bawah atau ketik sendiri." },
  ]);
  const ask = (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "ai", text: agentReply(q, metrics(s)) }]);
    setInput("");
  };
  return (
    <>
      <button onClick={() => setOpen(!open)} className="print:hidden fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg ring-2 ring-gold">
        <Sparkles className="size-4 text-gold" /> Ustadz AI
      </button>
      {open && (
        <div className="print:hidden fixed bottom-20 right-4 z-50 flex h-[70vh] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
          <div className="bg-primary p-4 text-primary-foreground islamic-pattern">
            <div className="font-display text-lg">Ustadz Financial AI Agent</div>
            <div className="text-xs opacity-80">Analisis berbasis data keuangan Anda</div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={`rounded-xl p-3 ${m.role === "user" ? "ml-8 bg-primary text-primary-foreground" : "mr-4 bg-secondary text-secondary-foreground"}`}>
                <Rich text={m.text} />
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t p-3">
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => ask(p)} className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground hover:opacity-80">{p}</button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya tentang keuangan Anda…" className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button className="rounded-lg bg-primary px-3 text-primary-foreground" aria-label="Kirim"><Send className="size-4" /></button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
