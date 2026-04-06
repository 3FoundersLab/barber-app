-- Status de cadastro da barbearia: pagamento_pendente (self-service) vs ativa (aprovada).
-- Ao confirmar assinatura como ativa, libera o painel (sincronizado por trigger).

ALTER TABLE public.barbearias
  ADD COLUMN IF NOT EXISTS status_cadastro TEXT;

UPDATE public.barbearias b
SET status_cadastro = 'pagamento_pendente'
WHERE EXISTS (
    SELECT 1 FROM public.assinaturas a
    WHERE a.barbearia_id = b.id AND a.status = 'pendente'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.assinaturas a2
    WHERE a2.barbearia_id = b.id AND a2.status = 'ativa'
  );

UPDATE public.barbearias
SET status_cadastro = 'ativa'
WHERE status_cadastro IS NULL;

ALTER TABLE public.barbearias
  ALTER COLUMN status_cadastro SET NOT NULL;

ALTER TABLE public.barbearias
  ALTER COLUMN status_cadastro SET DEFAULT 'ativa';

ALTER TABLE public.barbearias
  DROP CONSTRAINT IF EXISTS barbearias_status_cadastro_check;

ALTER TABLE public.barbearias
  ADD CONSTRAINT barbearias_status_cadastro_check
  CHECK (status_cadastro IN ('pagamento_pendente', 'ativa'));

CREATE INDEX IF NOT EXISTS idx_barbearias_status_cadastro ON public.barbearias(status_cadastro);

-- Ao aprovar assinatura (status -> ativa), libera a barbearia no painel.
CREATE OR REPLACE FUNCTION public.sync_barbearia_status_on_assinatura_ativa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'ativa' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE public.barbearias
    SET status_cadastro = 'ativa'
    WHERE id = NEW.barbearia_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assinaturas_sync_barbearia_status_trigger ON public.assinaturas;

CREATE TRIGGER assinaturas_sync_barbearia_status_trigger
  AFTER INSERT OR UPDATE OF status ON public.assinaturas
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_barbearia_status_on_assinatura_ativa();

-- Só super admin (ou service role nas APIs) altera status_cadastro manualmente; trigger de assinatura usa SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.barbearias_guard_status_cadastro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.status_cadastro IS DISTINCT FROM NEW.status_cadastro) THEN
    IF NOT (
      (SELECT public.is_super_admin())
      OR (SELECT auth.role()) = 'service_role'
    ) THEN
      RAISE EXCEPTION 'Apenas o administrador da plataforma pode alterar o status de cadastro da barbearia'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS barbearias_guard_status_cadastro_trigger ON public.barbearias;

CREATE TRIGGER barbearias_guard_status_cadastro_trigger
  BEFORE UPDATE ON public.barbearias
  FOR EACH ROW
  EXECUTE FUNCTION public.barbearias_guard_status_cadastro();

-- Self-service: barbearia nasce com pagamento pendente.
DROP FUNCTION IF EXISTS public.criar_barbearia_com_assinatura(
  TEXT, TEXT, TEXT, UUID, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.criar_barbearia_com_assinatura(
  p_nome TEXT,
  p_slug TEXT,
  p_telefone TEXT DEFAULT NULL,
  p_plano_id UUID DEFAULT NULL,
  p_email_responsavel TEXT DEFAULT NULL,
  p_endereco TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_barbearia_id UUID;
  v_email TEXT;
  v_endereco TEXT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  IF p_nome IS NULL OR btrim(p_nome) = '' THEN
    RAISE EXCEPTION 'Nome da barbearia e obrigatorio';
  END IF;

  IF p_slug IS NULL OR btrim(p_slug) = '' THEN
    RAISE EXCEPTION 'Slug da barbearia e obrigatorio';
  END IF;

  IF p_plano_id IS NULL THEN
    RAISE EXCEPTION 'Plano e obrigatorio';
  END IF;

  IF EXISTS (SELECT 1 FROM public.barbearias WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Slug ja esta em uso';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.planos WHERE id = p_plano_id AND ativo = true) THEN
    RAISE EXCEPTION 'Plano invalido ou inativo';
  END IF;

  v_email := NULLIF(btrim(p_email_responsavel), '');
  v_endereco := NULLIF(btrim(p_endereco), '');

  INSERT INTO public.barbearias (nome, slug, telefone, email, endereco, status_cadastro)
  VALUES (p_nome, p_slug, p_telefone, v_email, v_endereco, 'pagamento_pendente')
  RETURNING id INTO v_barbearia_id;

  INSERT INTO public.barbearia_users (barbearia_id, user_id, role)
  VALUES (v_barbearia_id, v_user_id, 'admin')
  ON CONFLICT (barbearia_id, user_id) DO UPDATE SET role = 'admin';

  INSERT INTO public.assinaturas (barbearia_id, plano_id, status, inicio_em)
  VALUES (v_barbearia_id, p_plano_id, 'pendente', CURRENT_DATE);

  UPDATE public.profiles
  SET
    role = 'admin',
    nome = COALESCE(NULLIF(btrim(p_nome), ''), nome),
    email = COALESCE(v_email, email),
    telefone = COALESCE(NULLIF(btrim(p_telefone), ''), telefone)
  WHERE id = v_user_id;

  RETURN v_barbearia_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_barbearia_com_assinatura(
  TEXT, TEXT, TEXT, UUID, TEXT, TEXT
) TO authenticated;
