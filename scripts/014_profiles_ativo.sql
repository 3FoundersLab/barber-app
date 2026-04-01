-- Status ativo do perfil: usuários desativados não conseguem usar a aplicação (middleware + login).
-- Apenas super admin pode alterar `ativo` (trigger).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;

CREATE OR REPLACE FUNCTION public.profiles_guard_ativo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.ativo IS DISTINCT FROM NEW.ativo) THEN
    IF NOT (SELECT public.is_super_admin()) THEN
      RAISE EXCEPTION 'Apenas super administrador pode alterar o status ativo do perfil'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_ativo_trigger ON public.profiles;
CREATE TRIGGER profiles_guard_ativo_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_guard_ativo();
