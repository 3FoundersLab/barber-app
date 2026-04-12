-- Espelho da migration Supabase: origem e data de nascimento para relatórios de público.
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS origem_canal TEXT,
  ADD COLUMN IF NOT EXISTS data_nascimento DATE;
