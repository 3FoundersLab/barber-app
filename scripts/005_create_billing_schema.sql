-- BarberTool Billing Schema
-- Estrutura para planos e assinaturas (super admin)

CREATE TABLE IF NOT EXISTS public.planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  preco_mensal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  limite_barbeiros INTEGER,
  limite_agendamentos INTEGER,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  plano_id UUID NOT NULL REFERENCES public.planos(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pendente',
  inicio_em DATE NOT NULL DEFAULT CURRENT_DATE,
  fim_em DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assinaturas_barbearia ON public.assinaturas(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_plano ON public.assinaturas(plano_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON public.assinaturas(status);

ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
