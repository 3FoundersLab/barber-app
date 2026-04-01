-- Atualiza o guard de `ativo` para permitir UPDATE via service role (rotas API do Next com SUPABASE_SERVICE_ROLE_KEY).
-- Sem isso, `auth.uid()` é nulo nessas requisições e `is_super_admin()` falha ao alternar "Barbearia ativa" pelo painel super.

CREATE OR REPLACE FUNCTION public.barbearias_guard_ativo()
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
      RAISE EXCEPTION 'Apenas super administrador pode alterar o status ativo da barbearia'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
