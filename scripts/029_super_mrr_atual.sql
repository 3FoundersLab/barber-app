-- MRR atual na plataforma: soma do preço mensal de referência (planos.preco_mensal)
-- de todas as assinaturas com status ativa. RLS do chamador aplica-se (super_admin vê tudo).

CREATE OR REPLACE FUNCTION public.super_mrr_atual()
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(p.preco_mensal::numeric), 0)
  FROM public.assinaturas a
  INNER JOIN public.planos p ON p.id = a.plano_id
  WHERE a.status = 'ativa';
$$;

COMMENT ON FUNCTION public.super_mrr_atual() IS
  'Soma de planos.preco_mensal para assinaturas ativas (equivalente de MRR quando a base do plano é mensal).';

GRANT EXECUTE ON FUNCTION public.super_mrr_atual() TO authenticated;
