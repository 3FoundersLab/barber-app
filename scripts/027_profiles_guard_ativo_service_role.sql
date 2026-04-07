-- Alinha o guard de `profiles.ativo` ao de barbearias (017):
-- UPDATE via service role (rotas API Next com SUPABASE_SERVICE_ROLE_KEY) deve poder alterar o flag.
-- Sem isso, `auth.uid()` é nulo nessas requisições e `is_super_admin()` falha no trigger.

CREATE OR REPLACE FUNCTION public.profiles_guard_ativo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.ativo IS DISTINCT FROM NEW.ativo) THEN
    IF NOT (
      (SELECT public.is_super_admin())
      OR (SELECT auth.role()) = 'service_role'
    ) THEN
      RAISE EXCEPTION 'Apenas super administrador pode alterar o status ativo do perfil'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
