-- Motivo opcional ao cancelar agendamento (check-in usa status em_atendimento no app).
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;

COMMENT ON COLUMN public.agendamentos.motivo_cancelamento IS 'Texto opcional informado ao cancelar o agendamento.';
