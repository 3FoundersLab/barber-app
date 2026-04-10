-- Amplia funcao_equipe com valor barbeiro_lider (bases que já rodaram 033 com CHECK antigo).

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.barbeiros'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%funcao_equipe%'
  LOOP
    EXECUTE format('ALTER TABLE public.barbeiros DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.barbeiros
  ADD CONSTRAINT barbeiros_funcao_equipe_check
  CHECK (funcao_equipe IN ('barbeiro', 'barbeiro_lider', 'moderador'));

COMMENT ON COLUMN public.barbeiros.funcao_equipe IS 'barbeiro e barbeiro_lider: atendem e aparecem no agendamento; moderador: equipe sem agenda de cortes.';
