-- Compatibiliza validação da jornada no trigger de agendamentos
-- para bases com dia_semana em 0..6 (domingo=0) e legado 1..7 (domingo=7).
CREATE OR REPLACE FUNCTION public.agendamentos_guard_dentro_jornada_barbeiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_dia_semana INTEGER;
  v_dia_semana_legado INTEGER;
  v_horario_trabalho_id UUID;
  v_hora_inicio TIME;
  v_hora_fim TIME;
  v_pausa_inicio TIME;
  v_pausa_fim TIME;
  v_duracao_nova INTEGER;
  v_fim_novo TIME;
  v_pausa_nome TEXT;
BEGIN
  IF NEW.status NOT IN ('agendado', 'em_atendimento', 'concluido') THEN
    RETURN NEW;
  END IF;

  v_dia_semana := EXTRACT(DOW FROM NEW.data)::INTEGER;
  v_dia_semana_legado := CASE WHEN v_dia_semana = 0 THEN 7 ELSE v_dia_semana END;

  SELECT ht.id, ht.hora_inicio, ht.hora_fim, ht.pausa_inicio, ht.pausa_fim
    INTO v_horario_trabalho_id, v_hora_inicio, v_hora_fim, v_pausa_inicio, v_pausa_fim
  FROM public.horarios_trabalho ht
  WHERE ht.barbeiro_id = NEW.barbeiro_id
    AND ht.dia_semana IN (v_dia_semana, v_dia_semana_legado)
    AND ht.ativo = true
  ORDER BY
    CASE WHEN ht.dia_semana = v_dia_semana THEN 0 ELSE 1 END,
    ht.hora_inicio
  LIMIT 1;

  IF v_hora_inicio IS NULL OR v_hora_fim IS NULL THEN
    RAISE EXCEPTION
      USING ERRCODE = '23514',
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
      USING ERRCODE = '23514',
            MESSAGE = 'Fora da jornada: o horário informado está fora do expediente do profissional.';
  END IF;

  IF v_horario_trabalho_id IS NOT NULL THEN
    SELECT p.nome
      INTO v_pausa_nome
    FROM public.horarios_trabalho_pausas p
    WHERE p.horario_trabalho_id = v_horario_trabalho_id
      AND NEW.horario < p.pausa_fim
      AND v_fim_novo > p.pausa_inicio
    ORDER BY p.pausa_inicio
    LIMIT 1;
  END IF;

  IF v_pausa_nome IS NULL
     AND v_pausa_inicio IS NOT NULL
     AND v_pausa_fim IS NOT NULL
     AND NEW.horario < v_pausa_fim
     AND v_fim_novo > v_pausa_inicio THEN
    v_pausa_nome := 'Pausa';
  END IF;

  IF v_pausa_nome IS NOT NULL THEN
    RAISE EXCEPTION
      USING ERRCODE = '23514',
            MESSAGE = format('Horário indisponível: o atendimento se sobrepõe à pausa "%s" do profissional.', v_pausa_nome);
  END IF;

  RETURN NEW;
END;
$$;
