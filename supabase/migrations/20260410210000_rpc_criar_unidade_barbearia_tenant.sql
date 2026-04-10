-- Ver scripts/040_rpc_criar_unidade_barbearia_tenant.sql

CREATE OR REPLACE FUNCTION public.criar_unidade_barbearia_tenant(
  p_barbearia_referencia_id uuid,
  p_nome text,
  p_slug text
)
RETURNS public.barbearias
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_allowed boolean;
  v_slug text;
  v_nome text;
  r public.barbearias;
  ref_a RECORD;
  v_plano uuid;
  v_inicio date := CURRENT_DATE;
  v_fim date;
  v_period text;
  v_status_cadastro text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = '28000';
  END IF;

  v_nome := trim(COALESCE(p_nome, ''));
  v_slug := lower(trim(COALESCE(p_slug, '')));
  IF v_nome = '' THEN
    RAISE EXCEPTION 'Nome da unidade é obrigatório' USING ERRCODE = '23514';
  END IF;
  IF v_slug = '' THEN
    RAISE EXCEPTION 'Identificador (slug) é obrigatório' USING ERRCODE = '23514';
  END IF;

  IF EXISTS (SELECT 1 FROM public.barbearias WHERE slug = v_slug) THEN
    RAISE EXCEPTION 'Este identificador (slug) já está em uso' USING ERRCODE = '23505';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.barbearias WHERE id = p_barbearia_referencia_id) THEN
    RAISE EXCEPTION 'Barbearia de referência não encontrada' USING ERRCODE = 'PGRST116';
  END IF;

  SET LOCAL row_security TO off;

  SELECT
    (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = v_uid AND p.role = 'admin'
      )
      AND EXISTS (
        SELECT 1 FROM public.barbearia_users bu
        WHERE bu.barbearia_id = p_barbearia_referencia_id AND bu.user_id = v_uid
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = v_uid AND p.role = 'super_admin'
    )
  INTO v_allowed;

  IF NOT COALESCE(v_allowed, false) THEN
    RAISE EXCEPTION 'Sem permissão para criar unidade a partir desta barbearia' USING ERRCODE = '42501';
  END IF;

  SELECT
    a.plano_id,
    a.status,
    COALESCE(NULLIF(trim(a.periodicidade), ''), 'mensal') AS periodicidade
  INTO ref_a
  FROM public.assinaturas a
  WHERE a.barbearia_id = p_barbearia_referencia_id
  ORDER BY a.created_at DESC
  LIMIT 1;

  IF ref_a.plano_id IS NULL THEN
    SELECT id INTO v_plano FROM public.planos WHERE ativo = true ORDER BY created_at ASC LIMIT 1;
    IF v_plano IS NULL THEN
      RAISE EXCEPTION 'Nenhum plano ativo disponível para nova unidade' USING ERRCODE = '23502';
    END IF;
    v_period := 'mensal';
    INSERT INTO public.barbearias (nome, slug, status_cadastro)
    VALUES (v_nome, v_slug, 'pagamento_pendente')
    RETURNING * INTO r;
    INSERT INTO public.barbearia_users (barbearia_id, user_id, role)
    VALUES (r.id, v_uid, 'admin')
    ON CONFLICT (barbearia_id, user_id) DO UPDATE SET role = 'admin';
    v_fim := (v_inicio + interval '1 month')::date - 1;
    INSERT INTO public.assinaturas (barbearia_id, plano_id, status, inicio_em, fim_em, periodicidade)
    VALUES (r.id, v_plano, 'pendente', v_inicio, v_fim, v_period);
    RETURN r;
  END IF;

  v_period := ref_a.periodicidade;
  IF v_period NOT IN ('mensal', 'trimestral', 'semestral', 'anual') THEN
    v_period := 'mensal';
  END IF;

  IF ref_a.status = 'ativa' THEN
    v_status_cadastro := 'ativa';
    INSERT INTO public.barbearias (nome, slug, status_cadastro)
    VALUES (v_nome, v_slug, v_status_cadastro)
    RETURNING * INTO r;
    INSERT INTO public.barbearia_users (barbearia_id, user_id, role)
    VALUES (r.id, v_uid, 'admin')
    ON CONFLICT (barbearia_id, user_id) DO UPDATE SET role = 'admin';
    INSERT INTO public.assinaturas (barbearia_id, plano_id, status, inicio_em, fim_em, periodicidade)
    VALUES (r.id, ref_a.plano_id, 'ativa', v_inicio, NULL, v_period);
  ELSE
    INSERT INTO public.barbearias (nome, slug, status_cadastro)
    VALUES (v_nome, v_slug, 'pagamento_pendente')
    RETURNING * INTO r;
    INSERT INTO public.barbearia_users (barbearia_id, user_id, role)
    VALUES (r.id, v_uid, 'admin')
    ON CONFLICT (barbearia_id, user_id) DO UPDATE SET role = 'admin';
    v_fim := (v_inicio + CASE v_period
      WHEN 'mensal' THEN interval '1 month'
      WHEN 'trimestral' THEN interval '3 months'
      WHEN 'semestral' THEN interval '6 months'
      WHEN 'anual' THEN interval '12 months'
    END)::date - 1;
    INSERT INTO public.assinaturas (barbearia_id, plano_id, status, inicio_em, fim_em, periodicidade)
    VALUES (r.id, ref_a.plano_id, 'pendente', v_inicio, v_fim, v_period);
  END IF;

  RETURN r;
END;
$$;

REVOKE ALL ON FUNCTION public.criar_unidade_barbearia_tenant(uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.criar_unidade_barbearia_tenant(uuid, text, text) TO authenticated;
