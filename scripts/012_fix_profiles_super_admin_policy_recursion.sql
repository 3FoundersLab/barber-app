-- Correção: política profiles_select_super_admin com EXISTS em profiles causava recursão RLS
-- e falha silenciosa na leitura do perfil (login ia para /cliente/home).
-- Idempotente: seguro rodar mesmo se 011 já tiver sido corrigido.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

DROP POLICY IF EXISTS "profiles_select_super_admin" ON public.profiles;

CREATE POLICY "profiles_select_super_admin" ON public.profiles
  FOR SELECT USING (
    (SELECT public.is_super_admin())
    AND role IN ('super_admin', 'admin')
  );
