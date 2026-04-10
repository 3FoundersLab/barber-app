-- Motivo opcional ao cancelar agendamento.
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;

COMMENT ON COLUMN public.agendamentos.motivo_cancelamento IS 'Texto opcional informado ao cancelar o agendamento.';
