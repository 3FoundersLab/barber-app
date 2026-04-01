-- Super Admin: SELECT em profiles limitado a papéis super_admin e admin.
-- Usa função SECURITY DEFINER para checar o papel do usuário sem recursão infinita em RLS
-- (subconsulta direta em profiles dentro da política quebra login / leitura do próprio perfil).

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
