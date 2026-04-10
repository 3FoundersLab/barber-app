-- Estoque persistido + comandas vinculadas a agendamentos (linhas de serviço e produto).
-- Mesmo conteúdo em: supabase/migrations/20260409120000_comandas_estoque.sql
-- Aplique UMA vez: SQL Editor OU `supabase db push` (CLI) — não rode os dois no mesmo banco.

-- ===========================================
-- TABELA: estoque_produtos
-- ===========================================
CREATE TABLE IF NOT EXISTS public.estoque_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Outros',
  quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  minimo INTEGER NOT NULL DEFAULT 0 CHECK (minimo >= 0),
  preco_custo DECIMAL(10, 2),
  preco_venda DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estoque_produtos_barbearia ON public.estoque_produtos(barbearia_id);

-- ===========================================
-- TABELA: comandas
-- ===========================================
CREATE TABLE IF NOT EXISTS public.comandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  agendamento_id UUID UNIQUE REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  numero INTEGER NOT NULL DEFAULT 0,
  barbeiro_id UUID NOT NULL REFERENCES public.barbeiros(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  referencia_data DATE NOT NULL DEFAULT CURRENT_DATE,
  mesa TEXT,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  horario_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  desconto_modo TEXT NOT NULL DEFAULT 'nenhum' CHECK (desconto_modo IN ('nenhum', 'percentual', 'fixo')),
  desconto_valor DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (desconto_valor >= 0),
  taxa_servico_aplicar BOOLEAN NOT NULL DEFAULT FALSE,
  taxa_servico_percentual DECIMAL(5, 2) NOT NULL DEFAULT 10 CHECK (taxa_servico_percentual >= 0 AND taxa_servico_percentual <= 100),
  forma_pagamento TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (barbearia_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_comandas_barbearia ON public.comandas(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_comandas_agendamento ON public.comandas(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_comandas_status ON public.comandas(status);
CREATE INDEX IF NOT EXISTS idx_comandas_referencia_data ON public.comandas(barbearia_id, referencia_data);

-- Número sequencial por barbearia
CREATE OR REPLACE FUNCTION public.comanda_set_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero <= 0 THEN
    SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero
    FROM public.comandas
    WHERE barbearia_id = NEW.barbearia_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comanda_numero ON public.comandas;
CREATE TRIGGER trg_comanda_numero
  BEFORE INSERT ON public.comandas
  FOR EACH ROW
  EXECUTE FUNCTION public.comanda_set_numero();

-- ===========================================
-- TABELAS: linhas da comanda
-- ===========================================
CREATE TABLE IF NOT EXISTS public.comanda_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID NOT NULL REFERENCES public.comandas(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES public.servicos(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL CHECK (preco_unitario >= 0),
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comanda_servicos_comanda ON public.comanda_servicos(comanda_id);

CREATE TABLE IF NOT EXISTS public.comanda_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID NOT NULL REFERENCES public.comandas(id) ON DELETE CASCADE,
  produto_estoque_id UUID NOT NULL REFERENCES public.estoque_produtos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL CHECK (preco_unitario >= 0),
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comanda_produtos_comanda ON public.comanda_produtos(comanda_id);

-- ===========================================
-- TRIGGER: comanda automática ao criar agendamento
-- ===========================================
CREATE OR REPLACE FUNCTION public.agendamento_criar_comanda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.comandas (
    barbearia_id,
    agendamento_id,
    barbeiro_id,
    cliente_id,
    referencia_data,
    horario_inicio,
    status
  ) VALUES (
    NEW.barbearia_id,
    NEW.id,
    NEW.barbeiro_id,
    NEW.cliente_id,
    NEW.data,
    NOW(),
    'aberta'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agendamento_criar_comanda ON public.agendamentos;
CREATE TRIGGER trg_agendamento_criar_comanda
  AFTER INSERT ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.agendamento_criar_comanda();

-- ===========================================
-- TRIGGER: updated_at
-- ===========================================
DROP TRIGGER IF EXISTS set_updated_at ON public.estoque_produtos;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.estoque_produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.comandas;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.comandas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ===========================================
-- RLS
-- ===========================================
ALTER TABLE public.estoque_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanda_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanda_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "estoque_produtos_select_staff" ON public.estoque_produtos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id = estoque_produtos.barbearia_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('admin', 'barbeiro')
    )
  );

CREATE POLICY "estoque_produtos_insert_admin" ON public.estoque_produtos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id = estoque_produtos.barbearia_id
        AND bu.user_id = auth.uid()
        AND bu.role = 'admin'
    )
  );

CREATE POLICY "estoque_produtos_update_staff" ON public.estoque_produtos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id = estoque_produtos.barbearia_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('admin', 'barbeiro')
    )
  );

CREATE POLICY "estoque_produtos_delete_admin" ON public.estoque_produtos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id = estoque_produtos.barbearia_id
        AND bu.user_id = auth.uid()
        AND bu.role = 'admin'
    )
  );

CREATE POLICY "comandas_select_staff" ON public.comandas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id = comandas.barbearia_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('admin', 'barbeiro')
    )
  );

CREATE POLICY "comandas_insert_staff" ON public.comandas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id = comandas.barbearia_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('admin', 'barbeiro')
    )
  );

CREATE POLICY "comandas_update_staff" ON public.comandas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id = comandas.barbearia_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('admin', 'barbeiro')
    )
  );

CREATE POLICY "comandas_delete_admin" ON public.comandas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id = comandas.barbearia_id
        AND bu.user_id = auth.uid()
        AND bu.role = 'admin'
    )
  );

CREATE POLICY "comanda_servicos_staff" ON public.comanda_servicos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.comandas c
      JOIN public.barbearia_users bu ON bu.barbearia_id = c.barbearia_id
      WHERE c.id = comanda_servicos.comanda_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('admin', 'barbeiro')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.comandas c
      JOIN public.barbearia_users bu ON bu.barbearia_id = c.barbearia_id
      WHERE c.id = comanda_servicos.comanda_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('admin', 'barbeiro')
    )
  );

CREATE POLICY "comanda_produtos_staff" ON public.comanda_produtos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.comandas c
      JOIN public.barbearia_users bu ON bu.barbearia_id = c.barbearia_id
      WHERE c.id = comanda_produtos.comanda_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('admin', 'barbeiro')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.comandas c
      JOIN public.barbearia_users bu ON bu.barbearia_id = c.barbearia_id
      WHERE c.id = comanda_produtos.comanda_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('admin', 'barbeiro')
    )
  );
