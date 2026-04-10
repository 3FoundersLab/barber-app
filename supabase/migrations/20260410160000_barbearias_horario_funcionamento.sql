-- Horário de funcionamento padrão da barbearia (exibição e referência no painel).
ALTER TABLE public.barbearias
  ADD COLUMN IF NOT EXISTS horario_abertura TIME,
  ADD COLUMN IF NOT EXISTS horario_fechamento TIME;

COMMENT ON COLUMN public.barbearias.horario_abertura IS 'Horário em que a barbearia abre (referência)';
COMMENT ON COLUMN public.barbearias.horario_fechamento IS 'Horário em que a barbearia fecha (referência)';
