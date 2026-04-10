-- Alinha UPDATE ao SELECT/membership: o dono do painel usa profiles.role = 'admin' e pode estar
-- em barbearia_users com qualquer papel; a política antiga exigia bu.role = 'admin', o que gerava
-- UPDATE com 0 linhas e PGRST116 ("Registro não encontrado") no PostgREST ao salvar configurações.

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
