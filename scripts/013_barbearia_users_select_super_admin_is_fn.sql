-- Super admin enxerga todos os vínculos em barbearia_users (evita subconsulta direta em profiles na política).
-- Idempotente: seguro rodar após 009/011/012.

DROP POLICY IF EXISTS "barbearia_users_select_super_admin" ON public.barbearia_users;

CREATE POLICY "barbearia_users_select_super_admin" ON public.barbearia_users
  FOR SELECT USING ((SELECT public.is_super_admin()));
