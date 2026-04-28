ALTER TABLE public.agendamentos
ADD COLUMN IF NOT EXISTS confirmado_cliente_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_agendamentos_confirmado_cliente_em
  ON public.agendamentos (confirmado_cliente_em);
