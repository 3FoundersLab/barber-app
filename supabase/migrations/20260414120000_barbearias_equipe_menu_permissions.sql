-- Permissões de menu do painel tenant por função de equipe (moderador, barbeiro_líder).

ALTER TABLE public.barbearias
  ADD COLUMN IF NOT EXISTS equipe_menu_permissions jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.barbearias.equipe_menu_permissions IS
  'JSON com chaves moderador e barbeiro_lider; cada uma mapeia segmentos de rota (ex.: dashboard, clientes) para boolean.';
