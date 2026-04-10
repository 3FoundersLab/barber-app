-- Ver scripts/038_barbearias_update_admin_por_perfil.sql

DROP POLICY IF EXISTS "barbearias_update_admin" ON public.barbearias;

CREATE POLICY "barbearias_update_admin" ON public.barbearias
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id = id AND bu.user_id = auth.uid()
    )
  );
