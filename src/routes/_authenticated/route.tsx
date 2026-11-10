import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { connectCloud } from "@/lib/finance";
import { GOLD_REFRESH_MS, refreshGoldPrice } from "@/lib/gold-live";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  const { user } = Route.useRouteContext();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    connectCloud(user.id).finally(() => setReady(true));
  }, [user.id]);
  useEffect(() => {
    if (!ready) return;
    void refreshGoldPrice();
    const timer = setInterval(() => void refreshGoldPrice(), GOLD_REFRESH_MS);
    return () => clearInterval(timer);
  }, [ready]);
  if (!ready) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Memuat data Anda…</div>;
  return <AppShell email={user.email ?? ""} />;
}
