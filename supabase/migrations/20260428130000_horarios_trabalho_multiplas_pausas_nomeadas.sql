-- Permite múltiplas pausas nomeadas por jornada e integra no guard de agendamentos.

CREATE TABLE IF NOT EXISTS public.horarios_trabalho_pausas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horario_trabalho_id UUID NOT NULL REFERENCES public.horarios_trabalho(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  pausa_inicio TIME NOT NULL,
  pausa_fim TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT horarios_trabalho_pausas_nome_nao_vazio_check CHECK (length(trim(nome)) >= 2),
  CONSTRAINT horarios_trabalho_pausas_intervalo_check CHECK (pausa_inicio < pausa_fim)
);

CREATE INDEX IF NOT EXISTS idx_horarios_trabalho_pausas_horario
  ON public.horarios_trabalho_pausas (horario_trabalho_id);

ALTER TABLE public.horarios_trabalho_pausas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "horarios_trabalho_pausas_select_public" ON public.horarios_trabalho_pausas;
CREATE POLICY "horarios_trabalho_pausas_select_public"
  ON public.horarios_trabalho_pausas FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.horarios_trabalho ht
      WHERE ht.id = horario_trabalho_id
        AND ht.ativo = true
    )
  );

DROP POLICY IF EXISTS "horarios_trabalho_pausas_insert_admin" ON public.horarios_trabalho_pausas;
CREATE POLICY "horarios_trabalho_pausas_insert_admin"
  ON public.horarios_trabalho_pausas FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.horarios_trabalho ht
      JOIN public.barbeiros b ON b.id = ht.barbeiro_id
      JOIN public.barbearia_users bu ON bu.barbearia_id = b.barbearia_id
      WHERE ht.id = horario_trabalho_id
        AND bu.user_id = auth.uid()
        AND bu.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "horarios_trabalho_pausas_update_admin" ON public.horarios_trabalho_pausas;
CREATE POLICY "horarios_trabalho_pausas_update_admin"
  ON public.horarios_trabalho_pausas FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.horarios_trabalho ht
      JOIN public.barbeiros b ON b.id = ht.barbeiro_id
      JOIN public.barbearia_users bu ON bu.barbearia_id = b.barbearia_id
      WHERE ht.id = horario_trabalho_id
        AND bu.user_id = auth.uid()
        AND bu.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.horarios_trabalho ht
      JOIN public.barbeiros b ON b.id = ht.barbeiro_id
      JOIN public.barbearia_users bu ON bu.barbearia_id = b.barbearia_id
      WHERE ht.id = horario_trabalho_id
        AND bu.user_id = auth.uid()
        AND bu.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "horarios_trabalho_pausas_delete_admin" ON public.horarios_trabalho_pausas;
CREATE POLICY "horarios_trabalho_pausas_delete_admin"
  ON public.horarios_trabalho_pausas FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.horarios_trabalho ht
      JOIN public.barbeiros b ON b.id = ht.barbeiro_id
      JOIN public.barbearia_users bu ON bu.barbearia_id = b.barbearia_id
      WHERE ht.id = horario_trabalho_id
        AND bu.user_id = auth.uid()
        AND bu.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.horarios_trabalho_pausas_guard_consistencia()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_hora_inicio TIME;
  v_hora_fim TIME;
  v_overlap_id UUID;
BEGIN
  SELECT ht.hora_inicio, ht.hora_fim
    INTO v_hora_inicio, v_hora_fim
  FROM public.horarios_trabalho ht
  WHERE ht.id = NEW.horario_trabalho_id;

  IF v_hora_inicio IS NULL OR v_hora_fim IS NULL THEN
    RAISE EXCEPTION
      USING ERRCODE = '23514',
            MESSAGE = 'A pausa precisa estar vinculada a uma jornada válida.';
  END IF;

  IF NEW.pausa_inicio <= v_hora_inicio OR NEW.pausa_fim >= v_hora_fim THEN
    RAISE EXCEPTION
      USING ERRCODE = '23514',
            MESSAGE = 'A pausa deve ficar dentro da jornada.';
  END IF;

  SELECT p.id
    INTO v_overlap_id
  FROM public.horarios_trabalho_pausas p
  WHERE p.horario_trabalho_id = NEW.horario_trabalho_id
    AND p.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND NEW.pausa_inicio < p.pausa_fim
    AND p.pausa_inicio < NEW.pausa_fim
  LIMIT 1;

  IF v_overlap_id IS NOT NULL THEN
    RAISE EXCEPTION
      USING ERRCODE = '23514',
            MESSAGE = 'As pausas não podem se sobrepor no mesmo dia.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_horarios_trabalho_pausas_guard_consistencia ON public.horarios_trabalho_pausas;
CREATE TRIGGER trg_horarios_trabalho_pausas_guard_consistencia
  BEFORE INSERT OR UPDATE OF horario_trabalho_id, pausa_inicio, pausa_fim
  ON public.horarios_trabalho_pausas
  FOR EACH ROW
  EXECUTE FUNCTION public.horarios_trabalho_pausas_guard_consistencia();

CREATE OR REPLACE FUNCTION public.agendamentos_guard_dentro_jornada_barbeiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_dia_semana INTEGER;
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

  SELECT ht.id, ht.hora_inicio, ht.hora_fim, ht.pausa_inicio, ht.pausa_fim
    INTO v_horario_trabalho_id, v_hora_inicio, v_hora_fim, v_pausa_inicio, v_pausa_fim
  FROM public.horarios_trabalho ht
  WHERE ht.barbeiro_id = NEW.barbeiro_id
    AND ht.dia_semana = v_dia_semana
    AND ht.ativo = true
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
