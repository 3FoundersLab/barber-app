-- Garante consistência de validade (fim_em) com ciclo (periodicidade) no backend.
-- Regra: quando fim_em vier preenchido, recalcula por inicio_em + periodicidade.
-- Preserva fim_em NULL (casos legados/intencionais de assinatura sem expiração explícita).

CREATE OR REPLACE FUNCTION public.calc_assinatura_fim_por_periodicidade(
  p_inicio_em date,
  p_periodicidade text
)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    (
      p_inicio_em + CASE lower(btrim(COALESCE(p_periodicidade, 'mensal')))
        WHEN 'mensal' THEN interval '1 month'
        WHEN 'trimestral' THEN interval '3 months'
        WHEN 'semestral' THEN interval '6 months'
        WHEN 'anual' THEN interval '12 months'
        ELSE interval '1 month'
      END
    )::date - 1
$$;

CREATE OR REPLACE FUNCTION public.assinaturas_sync_fim_em_por_periodicidade()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.inicio_em IS NULL OR NEW.fim_em IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.fim_em := public.calc_assinatura_fim_por_periodicidade(NEW.inicio_em, NEW.periodicidade);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assinaturas_sync_fim_em_por_periodicidade ON public.assinaturas;

CREATE TRIGGER trg_assinaturas_sync_fim_em_por_periodicidade
BEFORE INSERT OR UPDATE OF inicio_em, periodicidade, fim_em
ON public.assinaturas
FOR EACH ROW
EXECUTE FUNCTION public.assinaturas_sync_fim_em_por_periodicidade();

-- Corrige dados existentes que tenham fim_em preenchido e desalinhado do ciclo.
UPDATE public.assinaturas a
SET fim_em = public.calc_assinatura_fim_por_periodicidade(a.inicio_em, a.periodicidade)
WHERE
  a.inicio_em IS NOT NULL
  AND a.fim_em IS NOT NULL
  AND a.fim_em <> public.calc_assinatura_fim_por_periodicidade(a.inicio_em, a.periodicidade);
