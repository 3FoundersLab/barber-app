-- Status ativo da barbearia: inativas podem ser ocultadas ou bloqueadas na aplicação no futuro.
-- Apenas super admin pode alterar `ativo` (trigger), alinhado a profiles (014).

ALTER TABLE public.barbearias
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;

CREATE OR REPLACE FUNCTION public.barbearias_guard_ativo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.ativo IS DISTINCT FROM NEW.ativo) THEN
    IF NOT (SELECT public.is_super_admin()) THEN
      RAISE EXCEPTION 'Apenas super administrador pode alterar o status ativo da barbearia'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS barbearias_guard_ativo_trigger ON public.barbearias;
CREATE TRIGGER barbearias_guard_ativo_trigger
  BEFORE UPDATE ON public.barbearias
  FOR EACH ROW
  EXECUTE FUNCTION public.barbearias_guard_ativo();
