-- Ao salvar assinatura com status ativa e fim_em <= hoje, passa para pendente na hora
-- (mesma regra que marcar_assinaturas_expiradas_como_pendente / cron).
-- Sem isto, só o job diário alterava o status após editar a data de expiração.

CREATE OR REPLACE FUNCTION public.assinaturas_demote_if_expired()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'ativa'
    AND NEW.fim_em IS NOT NULL
    AND NEW.fim_em <= CURRENT_DATE
  THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pendente';
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'ativa' THEN
      -- Continua ativa mas data já venceu: rebaixa (ex.: editou fim_em para o passado).
      NEW.status := 'pendente';
    END IF;
    -- UPDATE de não-ativa -> ativa: não rebaixa (confirmar pagamento / reativação).
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assinaturas_demote_expired_trigger ON public.assinaturas;

CREATE TRIGGER assinaturas_demote_expired_trigger
  BEFORE INSERT OR UPDATE ON public.assinaturas
  FOR EACH ROW
  EXECUTE FUNCTION public.assinaturas_demote_if_expired();

COMMENT ON FUNCTION public.assinaturas_demote_if_expired() IS
  'INSERT ativa vencida ou UPDATE que mantém ativa com fim_em <= hoje -> pendente; ativação (não-ativa->ativa) preserva ativa.';
