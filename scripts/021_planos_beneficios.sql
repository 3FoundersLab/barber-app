-- Benefícios livres por plano: lista de { texto, ativo } (ativo = exibir com “check” no plano)

ALTER TABLE public.planos
  ADD COLUMN IF NOT EXISTS beneficios JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.planos.beneficios IS 'JSON array: [{"texto": "...", "ativo": true|false}]';
