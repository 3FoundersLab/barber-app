-- Permite que o barbeiro atualize o próprio registro em public.barbeiros
-- (nome, telefone, email, avatar exibidos ao cliente e no perfil).

CREATE POLICY "barbeiros_update_own" ON public.barbeiros
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
