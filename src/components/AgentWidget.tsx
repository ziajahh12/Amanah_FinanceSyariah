import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LoaderCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRESETS, useFinance } from "@/lib/finance";
import { askFinancialAgent } from "@/lib/agent.functions";
import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; text: string };

export function AgentWidget() {
  const financial = useFinance();
  const askAgent = useServerFn(askFinancialAgent);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages, busy, open, error]);

  const ask = async (question: string, retry = false) => {
    const q = question.trim();
    if (!q || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    const history = retry ? messages.slice(0, -1) : messages;
    if (!retry) setMessages(m => [...m, { role: "user", text: q }]);
    setInput("");
    try {
      // Save the visible snapshot before the server reads this user's authorized row.
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("session");
      const { error: saveError } = await supabase.from("finance_states").upsert({ user_id: auth.user.id, data: financial as never, updated_at: new Date().toISOString() });
      if (saveError) throw new Error("save");
      const result = await askAgent({ data: { question: q, history: history.slice(-12) } });
      if (result.ok) setMessages(m => [...m, { role: "assistant", text: result.text }]);
      else setError(result.message);
    } catch {
      setError("Chat belum bisa terhubung atau data belum tersimpan. Periksa koneksi dan pastikan Anda masih masuk.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return <>
    <Button onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="ustadz-chat" className="print:hidden fixed bottom-5 right-5 z-50 h-12 rounded-full px-5 shadow-lg ring-2 ring-gold">
      <Sparkles className="text-gold" /> Ustadz AI
    </Button>
    {open && <section id="ustadz-chat" aria-label="Chat Ustadz AI" className="print:hidden fixed bottom-20 right-4 z-50 flex h-[min(70dvh,680px)] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border bg-card shadow-2xl">
      <header className="flex items-center justify-between gap-2 bg-primary p-4 text-primary-foreground islamic-pattern">
        <h2 className="font-display text-lg">Ustadz AI</h2>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Tutup chat" title="Tutup chat"><X /></Button>
      </header>
      <div role="log" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {messages.length === 0 && <p className="text-muted-foreground">Assalamu’alaikum! Apa yang ingin Anda tanyakan tentang keuangan Anda?</p>}
        {messages.map((m, i) => <div key={i} className={`whitespace-pre-wrap break-words rounded-lg p-3 ${m.role === "user" ? "ml-8 bg-primary text-primary-foreground" : "mr-3 bg-secondary text-secondary-foreground"}`}>
          {m.text.split(/(\*\*[^*]+\*\*)/g).map((part, j) => part.startsWith("**") ? <strong key={j}>{part.slice(2, -2)}</strong> : part)}
        </div>)}
        {busy && <p role="status" className="flex items-center gap-2 text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> Sedang menelaah data keuangan…</p>}
        {error && <div role="alert" className="space-y-2 text-destructive"><p>{error}</p><Button variant="outline" size="sm" disabled={busy} onClick={() => { const last = messages.at(-1); if (last?.role === "user") void ask(last.text, true); }}>Coba lagi</Button></div>}
        <div ref={end} />
      </div>
      <div className="space-y-2 border-t p-3">
        <div className="flex flex-wrap gap-1.5">{PRESETS.map(p => <Button key={p} variant="secondary" size="sm" disabled={busy} onClick={() => void ask(p)} className="h-auto whitespace-normal px-2.5 py-1 text-left text-xs">{p}</Button>)}</div>
        <form onSubmit={e => { e.preventDefault(); void ask(input); }} className="flex gap-2">
          <input aria-label="Pertanyaan keuangan" value={input} onChange={e => setInput(e.target.value)} maxLength={4000} disabled={busy} placeholder="Tanya tentang keuangan Anda…" className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Kirim" title="Kirim pertanyaan"><Send /></Button>
        </form>
        <p className="text-xs text-muted-foreground">Saran edukasi, bukan fatwa atau jaminan investasi.</p>
      </div>
    </section>}
  </>;
}