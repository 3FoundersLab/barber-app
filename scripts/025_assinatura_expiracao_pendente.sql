-- Renovação: ao vencer fim_em, a assinatura volta para pendente (pagamento pendente) até o super admin confirmar.
-- Barbearia sem assinatura ativa fica com status_cadastro = pagamento_pendente (trigger).
-- Processamento em lote: função marcar_assinaturas_expiradas_como_pendente() (service_role / cron).

CREATE INDEX IF NOT EXISTS idx_assinaturas_ativa_fim_em
  ON public.assinaturas (status, fim_em)
  WHERE status = 'ativa' AND fim_em IS NOT NULL;

-- Quando não existe mais assinatura ativa para a barbearia, o cadastro volta a “pagamento pendente”.
CREATE OR REPLACE FUNCTION public.sync_barbearia_quando_sem_assinatura_ativa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid uuid;
BEGIN
  v_bid := COALESCE(NEW.barbearia_id, OLD.barbearia_id);
  IF v_bid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.assinaturas x
    WHERE x.barbearia_id = v_bid
      AND x.status = 'ativa'
  ) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.barbearias
  SET status_cadastro = 'pagamento_pendente'
  WHERE id = v_bid;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS assinaturas_sync_barbearia_sem_ativa_trigger ON public.assinaturas;

CREATE TRIGGER assinaturas_sync_barbearia_sem_ativa_trigger
  AFTER INSERT OR UPDATE OF status ON public.assinaturas
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_barbearia_quando_sem_assinatura_ativa();

COMMENT ON FUNCTION public.sync_barbearia_quando_sem_assinatura_ativa() IS
  'Define status_cadastro da barbearia como pagamento_pendente quando não há assinatura ativa.';

-- Marca assinaturas ativas vencidas como pendente; retorna linhas afetadas (para lembrete por e-mail).
CREATE OR REPLACE FUNCTION public.marcar_assinaturas_expiradas_como_pendente()
RETURNS TABLE (
  assinatura_id uuid,
  barbearia_id uuid,
  barbearia_nome text,
  email_contato text,
  data_expiracao date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.assinaturas a
  SET status = 'pendente'
  FROM public.barbearias b
  WHERE a.barbearia_id = b.id
    AND a.status = 'ativa'
    AND a.fim_em IS NOT NULL
    AND a.fim_em <= CURRENT_DATE
  RETURNING
    a.id AS assinatura_id,
    a.barbearia_id,
    b.nome AS barbearia_nome,
    b.email AS email_contato,
    a.fim_em AS data_expiracao;
END;
$$;

COMMENT ON FUNCTION public.marcar_assinaturas_expiradas_como_pendente() IS
  'Passa assinaturas ativas com fim_em <= hoje para pendente; uso via service_role (cron).';

REVOKE ALL ON FUNCTION public.marcar_assinaturas_expiradas_como_pendente() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marcar_assinaturas_expiradas_como_pendente() TO service_role;
