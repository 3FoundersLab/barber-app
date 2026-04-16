DROP POLICY IF EXISTS "dashboard_notification_states_select_member" ON public.dashboard_notification_states;
DROP POLICY IF EXISTS "dashboard_notification_states_insert_member" ON public.dashboard_notification_states;
DROP POLICY IF EXISTS "dashboard_notification_states_update_member" ON public.dashboard_notification_states;

CREATE POLICY "dashboard_notification_states_select_owner"
  ON public.dashboard_notification_states
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "dashboard_notification_states_insert_owner"
  ON public.dashboard_notification_states
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "dashboard_notification_states_update_owner"
  ON public.dashboard_notification_states
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
