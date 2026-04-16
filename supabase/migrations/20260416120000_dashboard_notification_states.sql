CREATE TABLE IF NOT EXISTS public.dashboard_notification_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id uuid NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_ids text[] NOT NULL DEFAULT '{}'::text[],
  archived_ids text[] NOT NULL DEFAULT '{}'::text[],
  muted_types text[] NOT NULL DEFAULT '{}'::text[],
  read_at jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (barbearia_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_notification_states_barbearia
  ON public.dashboard_notification_states (barbearia_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_notification_states_user
  ON public.dashboard_notification_states (user_id);

ALTER TABLE public.dashboard_notification_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_notification_states_select_member" ON public.dashboard_notification_states;
CREATE POLICY "dashboard_notification_states_select_member"
  ON public.dashboard_notification_states
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.barbearia_users bu
      WHERE bu.barbearia_id = dashboard_notification_states.barbearia_id
        AND bu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "dashboard_notification_states_insert_member" ON public.dashboard_notification_states;
CREATE POLICY "dashboard_notification_states_insert_member"
  ON public.dashboard_notification_states
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.barbearia_users bu
      WHERE bu.barbearia_id = dashboard_notification_states.barbearia_id
        AND bu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "dashboard_notification_states_update_member" ON public.dashboard_notification_states;
CREATE POLICY "dashboard_notification_states_update_member"
  ON public.dashboard_notification_states
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.barbearia_users bu
      WHERE bu.barbearia_id = dashboard_notification_states.barbearia_id
        AND bu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.barbearia_users bu
      WHERE bu.barbearia_id = dashboard_notification_states.barbearia_id
        AND bu.user_id = auth.uid()
    )
  );
