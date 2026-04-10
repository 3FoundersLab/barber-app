/**
 * Converte erros técnicos (Supabase/Postgres/rede) em mensagens seguras para o usuário final.
 */

export type ToUserFriendlyErrorOptions = {
  /** Usada quando o erro não pode ser mapeado com segurança */
  fallback?: string
}

const DEFAULT_FALLBACK = 'Não foi possível concluir a operação. Tente de novo em instantes.'

const PG_CODE_MESSAGES: Record<string, string> = {
  '23505': 'Este registro já existe ou conflita com outro cadastro.',
  '23503': 'Não é possível concluir porque há dados relacionados em outro lugar.',
  '23502': 'Faltam informações obrigatórias para salvar.',
  '42501': 'Você não tem permissão para esta ação. Se precisar de acesso, fale com o administrador.',
  'PGRST116': 'Registro não encontrado.',
  PGRST301: 'Sua sessão expirou ou é inválida. Saia e entre novamente.',
  PGRST302: 'Sua sessão expirou ou é inválida. Saia e entre novamente.',
  '22P02': 'Algum dado foi informado em formato inválido.',
  '57014': 'A operação demorou demais. Tente novamente.',
}

function extractMessage(error: unknown): string | null {
  if (error == null) return null
  if (typeof error === 'string') {
    const t = error.trim()
    return t.length ? t : null
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }
  if (typeof error === 'object' && 'message' in error) {
    const m = (error as { message?: unknown }).message
    if (typeof m === 'string' && m.trim()) return m.trim()
  }
  return null
}

function extractCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const c = (error as { code?: unknown }).code
    if (typeof c === 'string' && c.length > 0) return c
  }
  return undefined
}

function mapByMessageLower(raw: string): string | null {
  const m = raw.toLowerCase()

  if (
    m.includes('jwt') ||
    (m.includes('expired') && m.includes('token')) ||
    m.includes('pgrst301') ||
    m.includes('pgrst302') ||
    m.includes('no suitable key') ||
    m.includes('invalid claim')
  ) {
    return PG_CODE_MESSAGES.PGRST301
  }

  if (
    m.includes('permission denied') ||
    m.includes('row-level security') ||
    m.includes('rls') ||
    m.includes('violates row-level security')
  ) {
    return PG_CODE_MESSAGES['42501']
  }

  if (m.includes('duplicate key') || m.includes('unique constraint') || m.includes('already exists')) {
    return PG_CODE_MESSAGES['23505']
  }

  if (m.includes('foreign key') || m.includes('violates foreign key')) {
    return PG_CODE_MESSAGES['23503']
  }

  if (m.includes('null value') && m.includes('violates not-null')) {
    return PG_CODE_MESSAGES['23502']
  }

  if (m.includes('invalid input syntax') || m.includes('invalid text representation')) {
    return PG_CODE_MESSAGES['22P02']
  }

  if (
    m.includes('network') ||
    m.includes('fetch failed') ||
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    m.includes('networkerror') ||
    m.includes('econnrefused') ||
    m.includes('enotfound')
  ) {
    return 'Não foi possível conectar. Verifique sua internet e tente de novo.'
  }

  if (m.includes('timeout') || m.includes('canceling statement due to statement timeout')) {
    return PG_CODE_MESSAGES['57014']
  }

  return null
}

/** Indica se a string parece erro técnico (não deve ir direto para a UI). */
function looksTechnicalMessage(raw: string): boolean {
  const m = raw.toLowerCase()
  if (m.length > 220) return true
  return (
    /\bpostgres\b/.test(m) ||
    /\bpgrst\d*\b/i.test(m) ||
    /\bsqlstate\b/i.test(m) ||
    /\brelation\b/.test(m) &&
      (m.includes('does not exist') || m.includes('não existe') || m.includes('nao existe')) ||
    /column\s+"?[\w.]+"?\s+does not exist/i.test(m) ||
    /\bsyntax error\b/i.test(m) ||
    /\bat\s+[\w/.]+\.(ts|js|tsx|jsx):\d+/i.test(m) ||
    m.includes('stack') && m.includes('error')
  )
}

/**
 * Retorna mensagem amigável para exibir em alertas/toasts.
 * Erros já redigidos em português e curtos podem ser preservados se não parecerem técnicos.
 */
export function toUserFriendlyErrorMessage(
  error: unknown,
  options?: ToUserFriendlyErrorOptions,
): string {
  const fallback = options?.fallback ?? DEFAULT_FALLBACK
  const raw = extractMessage(error)
  if (!raw) return fallback

  const code = extractCode(error)
  if (code && PG_CODE_MESSAGES[code]) {
    return PG_CODE_MESSAGES[code]
  }

  const byMsg = mapByMessageLower(raw)
  if (byMsg) return byMsg

  if (!looksTechnicalMessage(raw)) {
    return raw
  }

  return fallback
}

/** Extrai `error` de JSON de API e aplica o mesmo mapeamento. */
export function userFriendlyMessageFromApiJson(
  json: unknown,
  fallback: string,
): string {
  if (!json || typeof json !== 'object') return fallback
  const err = (json as { error?: unknown }).error
  if (typeof err !== 'string' || !err.trim()) return fallback
  return toUserFriendlyErrorMessage(err, { fallback })
}
