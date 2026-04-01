-- Self-service signup for barbershops
-- Allows public selection of active plans and creates barbearia + assinatura for the logged-in new admin.

CREATE POLICY "planos_select_public_active" ON public.planos
  FOR SELECT USING (ativo = true);

CREATE OR REPLACE FUNCTION public.criar_barbearia_com_assinatura(
  p_nome TEXT,
  p_slug TEXT,
  p_telefone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_endereco TEXT DEFAULT NULL,
  p_plano_id UUID DEFAULT NULL,
  p_nome_responsavel TEXT DEFAULT NULL,
  p_email_responsavel TEXT DEFAULT NULL,
  p_telefone_responsavel TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_barbearia_id UUID;
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

  INSERT INTO public.barbearias (nome, slug, telefone, email, endereco)
  VALUES (p_nome, p_slug, p_telefone, p_email, p_endereco)
  RETURNING id INTO v_barbearia_id;

  INSERT INTO public.barbearia_users (barbearia_id, user_id, role)
  VALUES (v_barbearia_id, v_user_id, 'admin')
  ON CONFLICT (barbearia_id, user_id) DO UPDATE SET role = 'admin';

  INSERT INTO public.assinaturas (barbearia_id, plano_id, status, inicio_em)
  VALUES (v_barbearia_id, p_plano_id, 'ativa', CURRENT_DATE);

  UPDATE public.profiles
  SET
    role = 'admin',
    nome = COALESCE(NULLIF(p_nome_responsavel, ''), nome),
    email = COALESCE(NULLIF(p_email_responsavel, ''), email),
    telefone = COALESCE(NULLIF(p_telefone_responsavel, ''), telefone)
  WHERE id = v_user_id;

  RETURN v_barbearia_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_barbearia_com_assinatura(
  TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT
) TO authenticated;
