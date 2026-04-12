-- Campos opcionais para segmentação e relatórios de público.
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS origem_canal TEXT,
  ADD COLUMN IF NOT EXISTS data_nascimento DATE;

COMMENT ON COLUMN public.clientes.origem_canal IS 'Canal de aquisição (ex.: instagram, walk_in) para relatórios.';
COMMENT ON COLUMN public.clientes.data_nascimento IS 'Data de nascimento opcional para faixa etária nos relatórios.';
