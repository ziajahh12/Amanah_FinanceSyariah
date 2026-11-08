CREATE TABLE public.finance_states (
  user_id uuid PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_states TO authenticated;
GRANT ALL ON public.finance_states TO service_role;
ALTER TABLE public.finance_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.finance_states FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.finance_states FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.finance_states FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.finance_states FOR DELETE TO authenticated USING (auth.uid() = user_id);