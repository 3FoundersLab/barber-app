-- Estrutura mínima de governança LGPD:
-- 1) trilha de consentimento (cookies/analytics)
-- 2) solicitações de direitos do titular (art. 18)

CREATE TABLE IF NOT EXISTS public.consentimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  finalidade TEXT NOT NULL,
  base_legal TEXT NOT NULL,
  versao_politica TEXT NOT NULL,
  aceito BOOLEAN NOT NULL,
  ip INET NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consentimentos_user_created_at
  ON public.consentimentos(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consentimentos_finalidade_created_at
  ON public.consentimentos(finalidade, created_at DESC);

ALTER TABLE public.consentimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consentimentos_insert_public" ON public.consentimentos;
DROP POLICY IF EXISTS "consentimentos_select_own" ON public.consentimentos;

-- Usuários autenticados e anônimos podem registrar consentimento.
CREATE POLICY "consentimentos_insert_public"
  ON public.consentimentos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Titular autenticado consegue ver seus próprios registros.
CREATE POLICY "consentimentos_select_own"
  ON public.consentimentos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.lgpd_solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titular_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  protocolo TEXT NOT NULL UNIQUE,
  tipo_solicitacao TEXT NOT NULL CHECK (
    tipo_solicitacao IN (
      'confirmacao_tratamento',
      'acesso',
      'correcao',
      'anonimizacao_bloqueio_eliminacao',
      'portabilidade',
      'informacao_compartilhamento',
      'revogacao_consentimento',
      'revisao_decisao_automatizada'
    )
  ),
  descricao TEXT NULL,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (
    status IN ('aberta', 'em_analise', 'concluida', 'indeferida')
  ),
  resposta TEXT NULL,
  responded_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lgpd_solicitacoes_titular_created_at
  ON public.lgpd_solicitacoes(titular_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lgpd_solicitacoes_status_created_at
  ON public.lgpd_solicitacoes(status, created_at DESC);

ALTER TABLE public.lgpd_solicitacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lgpd_solicitacoes_select_own" ON public.lgpd_solicitacoes;
DROP POLICY IF EXISTS "lgpd_solicitacoes_insert_own" ON public.lgpd_solicitacoes;

CREATE POLICY "lgpd_solicitacoes_select_own"
  ON public.lgpd_solicitacoes FOR SELECT
  TO authenticated
  USING (titular_user_id = auth.uid());

CREATE POLICY "lgpd_solicitacoes_insert_own"
  ON public.lgpd_solicitacoes FOR INSERT
  TO authenticated
  WITH CHECK (titular_user_id = auth.uid());
