-- Espelha supabase/migrations/20260411130000_barbearias_dias_funcionamento.sql

-- Dias da semana em que a unidade abre (0=dom … 6=sáb, mesmo que JS Date.getDay()).
ALTER TABLE public.barbearias
  ADD COLUMN IF NOT EXISTS dias_funcionamento smallint[]
  NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5, 6]::smallint[];

COMMENT ON COLUMN public.barbearias.dias_funcionamento IS
  'Dias com atendimento: 0=dom … 6=sáb (Date.getDay). Padrão seg–sáb.';

DROP FUNCTION IF EXISTS public.update_barbearia_dados_tenant(
  uuid, text, text, text, text, time without time zone, time without time zone
);

CREATE OR REPLACE FUNCTION public.update_barbearia_dados_tenant(
  p_barbearia_id uuid,
  p_nome text,
  p_endereco text,
  p_telefone text,
  p_email text,
  p_horario_abertura time without time zone,
  p_horario_fechamento time without time zone,
  p_dias_funcionamento smallint[]
)
RETURNS public.barbearias
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_allowed boolean;
  r public.barbearias;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = '28000';
  END IF;

  IF trim(COALESCE(p_nome, '')) = '' THEN
    RAISE EXCEPTION 'Nome da barbearia é obrigatório' USING ERRCODE = '23514';
  END IF;

  IF p_dias_funcionamento IS NULL OR cardinality(p_dias_funcionamento) < 1 THEN
    RAISE EXCEPTION 'Informe pelo menos um dia de funcionamento' USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(p_dias_funcionamento) AS t(d)
    WHERE t.d < 0 OR t.d > 6
  ) THEN
    RAISE EXCEPTION 'dias_funcionamento deve usar valores 0 a 6' USING ERRCODE = '23514';
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
        WHERE bu.barbearia_id = p_barbearia_id AND bu.user_id = v_uid
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = v_uid AND p.role = 'super_admin'
    )
  INTO v_allowed;

  IF NOT COALESCE(v_allowed, false) THEN
    RAISE EXCEPTION 'Sem permissão para alterar esta barbearia' USING ERRCODE = '42501';
  END IF;

  UPDATE public.barbearias b
  SET
    nome = trim(p_nome),
    endereco = p_endereco,
    telefone = NULLIF(trim(COALESCE(p_telefone, '')), ''),
    email = CASE
      WHEN p_email IS NULL OR trim(p_email) = '' THEN NULL
      ELSE lower(trim(p_email))
    END,
    horario_abertura = p_horario_abertura,
    horario_fechamento = p_horario_fechamento,
    dias_funcionamento = ARRAY(
      SELECT DISTINCT t.d::smallint
      FROM unnest(p_dias_funcionamento) AS t(d)
      ORDER BY 1
    )
  WHERE b.id = p_barbearia_id
  RETURNING b.* INTO r;

  IF r IS NULL THEN
    RAISE EXCEPTION 'Barbearia não encontrada' USING ERRCODE = 'PGRST116';
  END IF;

  RETURN r;
END;
$$;

REVOKE ALL ON FUNCTION public.update_barbearia_dados_tenant(
  uuid, text, text, text, text, time without time zone, time without time zone, smallint[]
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.update_barbearia_dados_tenant(
  uuid, text, text, text, text, time without time zone, time without time zone, smallint[]
) TO authenticated;
