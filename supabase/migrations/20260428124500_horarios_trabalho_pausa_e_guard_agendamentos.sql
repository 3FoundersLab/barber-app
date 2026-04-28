-- Jornada do barbeiro com pausa opcional (ex.: almoço) e bloqueio no agendamento.

ALTER TABLE public.horarios_trabalho
  ADD COLUMN IF NOT EXISTS pausa_inicio TIME,
  ADD COLUMN IF NOT EXISTS pausa_fim TIME;

COMMENT ON COLUMN public.horarios_trabalho.pausa_inicio IS
  'Início opcional da pausa no dia (ex.: almoço).';
COMMENT ON COLUMN public.horarios_trabalho.pausa_fim IS
  'Fim opcional da pausa no dia (ex.: almoço).';

ALTER TABLE public.horarios_trabalho
  DROP CONSTRAINT IF EXISTS horarios_trabalho_dia_semana_check;

ALTER TABLE public.horarios_trabalho
  ADD CONSTRAINT horarios_trabalho_dia_semana_check
  CHECK (dia_semana BETWEEN 0 AND 6);

ALTER TABLE public.horarios_trabalho
  DROP CONSTRAINT IF EXISTS horarios_trabalho_horas_validas_check;

ALTER TABLE public.horarios_trabalho
  ADD CONSTRAINT horarios_trabalho_horas_validas_check
  CHECK (hora_inicio < hora_fim);

ALTER TABLE public.horarios_trabalho
  DROP CONSTRAINT IF EXISTS horarios_trabalho_pausa_consistente_check;

ALTER TABLE public.horarios_trabalho
  ADD CONSTRAINT horarios_trabalho_pausa_consistente_check
  CHECK (
    (pausa_inicio IS NULL AND pausa_fim IS NULL)
    OR (
      pausa_inicio IS NOT NULL
      AND pausa_fim IS NOT NULL
      AND pausa_inicio < pausa_fim
      AND pausa_inicio > hora_inicio
      AND pausa_fim < hora_fim
    )
  );

CREATE OR REPLACE FUNCTION public.agendamentos_guard_dentro_jornada_barbeiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_dia_semana INTEGER;
  v_hora_inicio TIME;
  v_hora_fim TIME;
  v_pausa_inicio TIME;
  v_pausa_fim TIME;
  v_duracao_nova INTEGER;
  v_fim_novo TIME;
BEGIN
  -- Só valida quando o estado ocupa agenda.
  IF NEW.status NOT IN ('agendado', 'em_atendimento', 'concluido') THEN
    RETURN NEW;
  END IF;

  v_dia_semana := EXTRACT(DOW FROM NEW.data)::INTEGER;

  SELECT ht.hora_inicio, ht.hora_fim, ht.pausa_inicio, ht.pausa_fim
    INTO v_hora_inicio, v_hora_fim, v_pausa_inicio, v_pausa_fim
  FROM public.horarios_trabalho ht
  WHERE ht.barbeiro_id = NEW.barbeiro_id
    AND ht.dia_semana = v_dia_semana
    AND ht.ativo = true
  LIMIT 1;

  IF v_hora_inicio IS NULL OR v_hora_fim IS NULL THEN
    RAISE EXCEPTION
      USING
        ERRCODE = '23514',
        MESSAGE = 'Fora da jornada: o profissional não possui horário de trabalho ativo neste dia.';
  END IF;

  SELECT GREATEST(COALESCE(s.duracao, 30), 5)
    INTO v_duracao_nova
  FROM public.servicos s
  WHERE s.id = NEW.servico_id;

  IF v_duracao_nova IS NULL THEN
    v_duracao_nova := 30;
  END IF;

  v_fim_novo := NEW.horario + make_interval(mins => v_duracao_nova);

  IF NEW.horario < v_hora_inicio OR v_fim_novo > v_hora_fim THEN
    RAISE EXCEPTION
      USING
        ERRCODE = '23514',
        MESSAGE = 'Fora da jornada: o horário informado está fora do expediente do profissional.';
  END IF;

  IF v_pausa_inicio IS NOT NULL
     AND v_pausa_fim IS NOT NULL
     AND NEW.horario < v_pausa_fim
     AND v_fim_novo > v_pausa_inicio THEN
    RAISE EXCEPTION
      USING
        ERRCODE = '23514',
        MESSAGE = 'Horário indisponível: o atendimento se sobrepõe à pausa do profissional.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agendamentos_guard_dentro_jornada_barbeiro ON public.agendamentos;
CREATE TRIGGER trg_agendamentos_guard_dentro_jornada_barbeiro
  BEFORE INSERT OR UPDATE OF barbeiro_id, servico_id, data, horario, status
  ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.agendamentos_guard_dentro_jornada_barbeiro();
