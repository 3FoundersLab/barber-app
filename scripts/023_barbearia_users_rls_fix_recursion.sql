-- Corrige 42P17 / 500 em GET .../barbearia_users (infinite recursion).
--
-- Não use políticas em barbearia_users que chamem is_super_admin() ou subconsultem
-- barbearia_users: o avaliador de RLS pode loopar ou interagir mal com PostgREST.
--
-- SELECT: apenas linhas do próprio usuário. Super admin lista vínculos via
-- service role nas APIs /api/platform/* ou SQL direto (não via anon key + RLS amplo).
--
-- INSERT / DELETE: só super admin no cliente; RPC e service role seguem funcionando.
--
-- O app NÃO deve depender de SELECT REST em barbearia_users no fluxo login/admin:
-- use as funções get_my_barbearia_slug / get_my_barbearia_link / user_is_member_of_barbearia.
-- Essas funções usam SET LOCAL row_security: devem ser VOLATILE (STABLE dispara erro 0A000).

-- Políticas antigas (ex.: insert/delete com barbearia_user_current_is_admin) precisam sumir
-- ANTES de dropar a função — senão 2BP01 (dependências).
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'barbearia_users'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.barbearia_users', r.policyname);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.barbearia_user_current_is_admin(uuid);

CREATE POLICY "barbearia_users_select_own" ON public.barbearia_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "barbearia_users_insert_super_admin" ON public.barbearia_users
  FOR INSERT WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "barbearia_users_delete_super_admin" ON public.barbearia_users
  FOR DELETE USING ((SELECT public.is_super_admin()));

CREATE OR REPLACE FUNCTION public.get_my_barbearia_slug()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
BEGIN
  SET LOCAL row_security TO off;
  SELECT b.slug INTO v_slug
  FROM public.barbearia_users bu
  JOIN public.barbearias b ON b.id = bu.barbearia_id
  WHERE bu.user_id = auth.uid()
  ORDER BY bu.created_at DESC
  LIMIT 1;
  RETURN v_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_barbearia_link()
RETURNS TABLE (barbearia_id uuid, slug text)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security TO off;
  RETURN QUERY
  SELECT bu.barbearia_id, b.slug
  FROM public.barbearia_users bu
  JOIN public.barbearias b ON b.id = bu.barbearia_id
  WHERE bu.user_id = auth.uid()
  ORDER BY bu.created_at DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_is_member_of_barbearia(p_barbearia_id uuid)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security TO off;
  RETURN EXISTS (
    SELECT 1
    FROM public.barbearia_users bu
    WHERE bu.barbearia_id = p_barbearia_id AND bu.user_id = auth.uid()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_barbearia_slug() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_barbearia_slug() TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_barbearia_link() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_barbearia_link() TO authenticated;

REVOKE ALL ON FUNCTION public.user_is_member_of_barbearia(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_member_of_barbearia(uuid) TO authenticated;
