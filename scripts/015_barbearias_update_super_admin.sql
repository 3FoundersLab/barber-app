-- Super Admin: atualizar qualquer barbearia (página /super/barbearias — edição de dados)
-- Sem esta política, apenas admins vinculados à barbearia podem dar UPDATE (barbearias_update_admin).

DROP POLICY IF EXISTS "barbearias_update_super_admin" ON public.barbearias;

CREATE POLICY "barbearias_update_super_admin" ON public.barbearias
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );
