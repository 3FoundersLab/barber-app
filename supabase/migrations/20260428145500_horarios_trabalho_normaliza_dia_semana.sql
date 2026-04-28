-- Saneamento: padroniza dia_semana em 0..6 (domingo = 0).
-- Compatibilidade legado:
-- - 1..7 (domingo = 7) -> 0..6 (domingo = 0)
-- - valores fora da faixa também são normalizados por módulo.

UPDATE public.horarios_trabalho
SET dia_semana = CASE
  WHEN dia_semana = 7 THEN 0
  WHEN dia_semana BETWEEN 0 AND 6 THEN dia_semana
  ELSE ((dia_semana % 7) + 7) % 7
END
WHERE dia_semana NOT BETWEEN 0 AND 6;

ALTER TABLE public.horarios_trabalho
  DROP CONSTRAINT IF EXISTS horarios_trabalho_dia_semana_check;

ALTER TABLE public.horarios_trabalho
  ADD CONSTRAINT horarios_trabalho_dia_semana_check
  CHECK (dia_semana BETWEEN 0 AND 6);
