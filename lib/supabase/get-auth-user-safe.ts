import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

function isAuthLockErrorMessage(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('lock') || m.includes('steal') || m.includes('aborterror')
}

/**
 * Evita quebrar fluxos do cliente em corrida de lock do GoTrue.
 * Tenta `getUser`, e faz fallback para `getSession` quando há lock contention.
 */
export async function getAuthUserSafe(supabase = createClient()): Promise<User | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user ?? null
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!isAuthLockErrorMessage(message)) return null
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      return session?.user ?? null
    } catch {
      return null
    }
  }
}
