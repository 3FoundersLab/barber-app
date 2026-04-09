-- Auditoria de execuções e alterações ligadas a políticas do sistema (cobrança, expiração, planos, etc.).
-- Leitura apenas para super_admin; inserção por super_admin ou service_role (cron / edge).

CREATE TABLE IF NOT EXISTS public.politica_sistema_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo_evento TEXT NOT NULL,
  barbearia_id UUID REFERENCES public.barbearias(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  status_execucao TEXT NOT NULL CHECK (status_execucao IN ('sucesso', 'pendente', 'erro')),
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  detalhes JSONB,
  mensagem_erro TEXT
);

CREATE INDEX IF NOT EXISTS idx_politica_sistema_logs_created_at ON public.politica_sistema_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_politica_sistema_logs_barbearia ON public.politica_sistema_logs (barbearia_id);
CREATE INDEX IF NOT EXISTS idx_politica_sistema_logs_tipo ON public.politica_sistema_logs (tipo_evento);
CREATE INDEX IF NOT EXISTS idx_politica_sistema_logs_status ON public.politica_sistema_logs (status_execucao);

ALTER TABLE public.politica_sistema_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "politica_sistema_logs_select_super_admin" ON public.politica_sistema_logs
  FOR SELECT
  USING ((SELECT public.is_super_admin()));

CREATE POLICY "politica_sistema_logs_insert_super_admin" ON public.politica_sistema_logs
  FOR INSERT
  WITH CHECK ((SELECT public.is_super_admin()));

COMMENT ON TABLE public.politica_sistema_logs IS
  'Log de auditoria de políticas de negócio (cobrança, expiração, ativação de planos). Inserir também via service_role em jobs.';
