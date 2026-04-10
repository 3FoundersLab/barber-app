-- Remove uma barbearia (unidade) pelo admin do tenant ou super_admin.
-- Se o DELETE falhar com erro de FK (23503), aplique também `042_comandas_fk_cascade_barbearia_delete.sql`.
-- Mesma regra base que update_barbearia_dados_tenant.
-- Administradores comuns: exige pelo menos 2 unidades vinculadas à conta (não remove a última).

CREATE OR REPLACE FUNCTION public.remover_unidade_barbearia_tenant(p_barbearia_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_allowed boolean;
  v_super boolean;
  v_admin boolean;
  v_links integer;
  v_deleted integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = '28000';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.barbearias WHERE id = p_barbearia_id) THEN
    RAISE EXCEPTION 'Barbearia não encontrada' USING ERRCODE = 'PGRST116';
  END IF;

  SET LOCAL row_security TO off;

  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_uid AND p.role = 'super_admin') INTO v_super;
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_uid AND p.role = 'admin') INTO v_admin;

  SELECT
    (
      v_admin
      AND EXISTS (
        SELECT 1 FROM public.barbearia_users bu
        WHERE bu.barbearia_id = p_barbearia_id AND bu.user_id = v_uid
      )
    )
    OR v_super
  INTO v_allowed;

  IF NOT COALESCE(v_allowed, false) THEN
    RAISE EXCEPTION 'Sem permissão para remover esta unidade' USING ERRCODE = '42501';
  END IF;

  IF v_admin AND NOT v_super THEN
    SELECT count(*)::integer INTO v_links
    FROM public.barbearia_users
    WHERE user_id = v_uid;

    IF COALESCE(v_links, 0) < 2 THEN
      RAISE EXCEPTION 'Não é possível remover a única unidade vinculada à sua conta. Cadastre outra filial antes ou fale com o suporte.'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  DELETE FROM public.barbearias b WHERE b.id = p_barbearia_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF COALESCE(v_deleted, 0) = 0 THEN
    RAISE EXCEPTION 'Barbearia não encontrada' USING ERRCODE = 'PGRST116';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.remover_unidade_barbearia_tenant(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.remover_unidade_barbearia_tenant(uuid) TO authenticated;
