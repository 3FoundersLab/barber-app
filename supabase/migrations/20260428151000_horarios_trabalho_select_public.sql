-- Permite que o fluxo de agendamento (cliente) leia jornadas ativas do profissional.
-- Sem essa policy, a validação de jornada pode não encontrar registros e bloquear agendamento.

ALTER TABLE public.horarios_trabalho ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "horarios_trabalho_select_public" ON public.horarios_trabalho;
CREATE POLICY "horarios_trabalho_select_public"
  ON public.horarios_trabalho FOR SELECT
  USING (
    ativo = true
    AND EXISTS (
      SELECT 1
      FROM public.barbeiros b
      WHERE b.id = barbeiro_id
        AND b.ativo = true
        AND (
          b.funcao_equipe IS NULL
          OR b.funcao_equipe IN ('barbeiro', 'barbeiro_lider')
        )
    )
  );
