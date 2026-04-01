import type { SupabaseClient } from '@supabase/supabase-js'

export type SessionProfileRow = {
  role: string
  ativo: boolean | null
}

/** PostgREST/Postgres quando a coluna `ativo` ainda não existe (migration 014 não aplicada). */
function isMissingAtivoColumnError(err: { message?: string } | null | undefined): boolean {
  const m = (err?.message ?? '').toLowerCase()
  if (!m.includes('ativo')) return false
  return (
    m.includes('does not exist') ||
    m.includes('column') ||
    m.includes('schema cache') ||
    m.includes('could not find')
  )
}

/**
 * Lê role + ativo para middleware/login. Se `ativo` não existir no banco, faz fallback só em `role` e assume ativo.
 */
export async function fetchSessionProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<SessionProfileRow | null> {
  const primary = await supabase
    .from('profiles')
    .select('role, ativo')
    .eq('id', userId)
    .single()

  if (!primary.error && primary.data) {
    return primary.data as SessionProfileRow
  }

  if (primary.error && isMissingAtivoColumnError(primary.error)) {
    const fallback = await supabase.from('profiles').select('role').eq('id', userId).single()
    if (fallback.data && typeof (fallback.data as { role?: string }).role === 'string') {
      return { role: (fallback.data as { role: string }).role, ativo: true }
    }
  }

  return null
}
