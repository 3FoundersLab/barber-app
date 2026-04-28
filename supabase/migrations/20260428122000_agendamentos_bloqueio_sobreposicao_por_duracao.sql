-- Impede sobreposição de agendamentos por barbeiro/data considerando duração do serviço.

CREATE INDEX IF NOT EXISTS idx_agendamentos_barbeiro_data_status
  ON public.agendamentos (barbeiro_id, data, status);

CREATE OR REPLACE FUNCTION public.agendamentos_guard_sem_sobreposicao()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_duracao_nova INTEGER;
  v_conflito_id UUID;
BEGIN
  -- Só valida quando o novo estado ocupa agenda.
  IF NEW.status NOT IN ('agendado', 'em_atendimento', 'concluido') THEN
    RETURN NEW;
  END IF;

  SELECT GREATEST(COALESCE(s.duracao, 30), 5)
    INTO v_duracao_nova
  FROM public.servicos s
  WHERE s.id = NEW.servico_id;

  IF v_duracao_nova IS NULL THEN
    v_duracao_nova := 30;
  END IF;

  SELECT a.id
    INTO v_conflito_id
  FROM public.agendamentos a
  JOIN public.servicos s_exist ON s_exist.id = a.servico_id
  WHERE a.barbeiro_id = NEW.barbeiro_id
    AND a.data = NEW.data
    AND a.status IN ('agendado', 'em_atendimento', 'concluido')
    AND a.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND NEW.horario < (a.horario + make_interval(mins => GREATEST(COALESCE(s_exist.duracao, 30), 5)))
    AND a.horario < (NEW.horario + make_interval(mins => v_duracao_nova))
  LIMIT 1;

  IF v_conflito_id IS NOT NULL THEN
    RAISE EXCEPTION
      USING
        ERRCODE = '23514',
        MESSAGE = 'Conflito de horário: já existe agendamento que se sobrepõe para este profissional.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agendamentos_guard_sem_sobreposicao ON public.agendamentos;
CREATE TRIGGER trg_agendamentos_guard_sem_sobreposicao
  BEFORE INSERT OR UPDATE OF barbeiro_id, servico_id, data, horario, status
  ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.agendamentos_guard_sem_sobreposicao();
