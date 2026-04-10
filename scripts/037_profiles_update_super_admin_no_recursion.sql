-- Corrige: política profiles_update_super_admin com EXISTS (SELECT ... FROM profiles) na tabela profiles
-- provoca recursão infinita em RLS ao salvar o próprio perfil (UPDATE).
-- Alinha a profiles_select_super_admin: apenas public.is_super_admin().

DROP POLICY IF EXISTS "profiles_update_super_admin" ON public.profiles;

CREATE POLICY "profiles_update_super_admin" ON public.profiles
  FOR UPDATE
  USING ((SELECT public.is_super_admin()))
  WITH CHECK ((SELECT public.is_super_admin()));
