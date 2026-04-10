-- Painel tenant: dono (profiles.role = admin + vínculo em barbearia_users) ou super_admin
-- pode atualizar dados editáveis da barbearia sem depender do UPDATE via PostgREST/RLS.

ALTER TABLE public.barbearias
  ADD COLUMN IF NOT EXISTS horario_abertura TIME,
  ADD COLUMN IF NOT EXISTS horario_fechamento TIME;

CREATE OR REPLACE FUNCTION public.update_barbearia_dados_tenant(
  p_barbearia_id uuid,
  p_nome text,
  p_endereco text,
  p_telefone text,
  p_email text,
  p_horario_abertura time without time zone,
  p_horario_fechamento time without time zone
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
    horario_fechamento = p_horario_fechamento
  WHERE b.id = p_barbearia_id
  RETURNING b.* INTO r;

  IF r IS NULL THEN
    RAISE EXCEPTION 'Barbearia não encontrada' USING ERRCODE = 'PGRST116';
  END IF;

  RETURN r;
END;
$$;

REVOKE ALL ON FUNCTION public.update_barbearia_dados_tenant(
  uuid, text, text, text, text, time without time zone, time without time zone
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.update_barbearia_dados_tenant(
  uuid, text, text, text, text, time without time zone, time without time zone
) TO authenticated;
