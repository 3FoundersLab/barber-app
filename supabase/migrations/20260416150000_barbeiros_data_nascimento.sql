-- Data de nascimento opcional da equipe (alertas no painel).
ALTER TABLE public.barbeiros
  ADD COLUMN IF NOT EXISTS data_nascimento date;

COMMENT ON COLUMN public.barbeiros.data_nascimento IS 'Opcional; usado para lembrar aniversários da equipe no painel (até 3 dias antes).';
