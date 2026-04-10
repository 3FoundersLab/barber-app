-- Corrige recursão RLS em UPDATE de profiles (política profiles_update_super_admin).
DROP POLICY IF EXISTS "profiles_update_super_admin" ON public.profiles;

CREATE POLICY "profiles_update_super_admin" ON public.profiles
  FOR UPDATE
  USING ((SELECT public.is_super_admin()))
  WITH CHECK ((SELECT public.is_super_admin()));
