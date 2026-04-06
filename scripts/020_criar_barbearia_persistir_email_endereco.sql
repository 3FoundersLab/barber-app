-- Persiste email e endereco na tabela barbearias no self-service (antes iam sempre NULL).

DROP FUNCTION IF EXISTS public.criar_barbearia_com_assinatura(
  TEXT, TEXT, TEXT, UUID, TEXT
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

  INSERT INTO public.barbearias (nome, slug, telefone, email, endereco)
  VALUES (p_nome, p_slug, p_telefone, v_email, v_endereco)
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
