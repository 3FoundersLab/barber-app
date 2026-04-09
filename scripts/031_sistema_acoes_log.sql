-- Histórico de ações na plataforma (auditoria por super admin).
-- Leitura/inserção apenas para super_admin; actor_user_id preenchido por trigger se omitido.

CREATE TABLE IF NOT EXISTS public.sistema_acoes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tipo_acao TEXT NOT NULL CHECK (tipo_acao IN ('criacao', 'edicao', 'exclusao')),
  entidade TEXT NOT NULL,
  entidade_id UUID,
  entidade_nome TEXT,
  resumo_acao TEXT NOT NULL,
  descricao TEXT,
  payload_antes JSONB,
  payload_depois JSONB,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_sistema_acoes_log_created_at ON public.sistema_acoes_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sistema_acoes_log_actor ON public.sistema_acoes_log (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_sistema_acoes_log_entidade ON public.sistema_acoes_log (entidade);
CREATE INDEX IF NOT EXISTS idx_sistema_acoes_log_tipo ON public.sistema_acoes_log (tipo_acao);
CREATE INDEX IF NOT EXISTS idx_sistema_acoes_log_entidade_id ON public.sistema_acoes_log (entidade_id);

CREATE OR REPLACE FUNCTION public.sistema_acoes_log_set_actor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.actor_user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.actor_user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sistema_acoes_log_set_actor ON public.sistema_acoes_log;
CREATE TRIGGER trg_sistema_acoes_log_set_actor
  BEFORE INSERT ON public.sistema_acoes_log
  FOR EACH ROW
  EXECUTE FUNCTION public.sistema_acoes_log_set_actor();

ALTER TABLE public.sistema_acoes_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sistema_acoes_log_select_super_admin" ON public.sistema_acoes_log
  FOR SELECT
  USING ((SELECT public.is_super_admin()));

CREATE POLICY "sistema_acoes_log_insert_super_admin" ON public.sistema_acoes_log
  FOR INSERT
  WITH CHECK ((SELECT public.is_super_admin()));

COMMENT ON TABLE public.sistema_acoes_log IS
  'Auditoria de ações manuais do super admin (CRUD). Inserir após operações bem-sucedidas; payloads opcionais para diff.';
