-- Periodicidade da assinatura (mensal, trimestral, semestral, anual) e fim do período no self-service.

ALTER TABLE public.assinaturas
  ADD COLUMN IF NOT EXISTS periodicidade TEXT DEFAULT 'mensal';

UPDATE public.assinaturas
SET periodicidade = 'mensal'
WHERE periodicidade IS NULL OR btrim(periodicidade) = '';

ALTER TABLE public.assinaturas
  ALTER COLUMN periodicidade SET DEFAULT 'mensal';

ALTER TABLE public.assinaturas
  ALTER COLUMN periodicidade SET NOT NULL;

ALTER TABLE public.assinaturas
  DROP CONSTRAINT IF EXISTS assinaturas_periodicidade_check;

ALTER TABLE public.assinaturas
  ADD CONSTRAINT assinaturas_periodicidade_check
  CHECK (periodicidade IN ('mensal', 'trimestral', 'semestral', 'anual'));

COMMENT ON COLUMN public.assinaturas.periodicidade IS
  'Ciclo de cobrança contratado; valor referência = planos.preco_mensal × meses do período.';

-- Nova assinatura no cadastro público: grava periodicidade e data de expiração do período.
DROP FUNCTION IF EXISTS public.criar_barbearia_com_assinatura(
  TEXT, TEXT, TEXT, UUID, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.criar_barbearia_com_assinatura(
  p_nome TEXT,
  p_slug TEXT,
  p_telefone TEXT DEFAULT NULL,
  p_plano_id UUID DEFAULT NULL,
  p_email_responsavel TEXT DEFAULT NULL,
  p_endereco TEXT DEFAULT NULL,
  p_periodicidade TEXT DEFAULT 'mensal'
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
  v_period TEXT;
  v_inicio DATE;
  v_fim DATE;
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

  v_period := lower(btrim(COALESCE(p_periodicidade, 'mensal')));
  IF v_period NOT IN ('mensal', 'trimestral', 'semestral', 'anual') THEN
    RAISE EXCEPTION 'Periodicidade invalida';
  END IF;

  v_email := NULLIF(btrim(p_email_responsavel), '');
  v_endereco := NULLIF(btrim(p_endereco), '');

  INSERT INTO public.barbearias (nome, slug, telefone, email, endereco, status_cadastro)
  VALUES (p_nome, p_slug, p_telefone, v_email, v_endereco, 'pagamento_pendente')
  RETURNING id INTO v_barbearia_id;

  INSERT INTO public.barbearia_users (barbearia_id, user_id, role)
  VALUES (v_barbearia_id, v_user_id, 'admin')
  ON CONFLICT (barbearia_id, user_id) DO UPDATE SET role = 'admin';

  v_inicio := CURRENT_DATE;
  v_fim := (v_inicio + CASE v_period
    WHEN 'mensal' THEN interval '1 month'
    WHEN 'trimestral' THEN interval '3 months'
    WHEN 'semestral' THEN interval '6 months'
    WHEN 'anual' THEN interval '12 months'
  END)::date - 1;

  INSERT INTO public.assinaturas (barbearia_id, plano_id, status, inicio_em, fim_em, periodicidade)
  VALUES (v_barbearia_id, p_plano_id, 'pendente', v_inicio, v_fim, v_period);

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
  TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT
) TO authenticated;
