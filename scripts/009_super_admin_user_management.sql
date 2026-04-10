-- Super Admin: atualizar qualquer perfil (papéis / dados), ver vínculos e revogar acessos às barbearias

CREATE POLICY "barbearia_users_select_super_admin" ON public.barbearia_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Usa is_super_admin() (SECURITY DEFINER, definida em 002/011) — subconsulta direta em profiles aqui causa
-- "infinite recursion detected in policy for relation profiles" em UPDATE pela própria tabela.
CREATE POLICY "profiles_update_super_admin" ON public.profiles
  FOR UPDATE USING ((SELECT public.is_super_admin()))
  WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "barbearia_users_delete_super_admin" ON public.barbearia_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );
