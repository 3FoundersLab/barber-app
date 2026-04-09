import type { SupabaseClient } from '@supabase/supabase-js'
import { clearAuthPersistenceMeta } from '@/lib/auth-session-persistence'

/** Encerra sessão no Supabase e remove metadados de “Manter conectado” no browser. */
export async function signOutWithPersistenceClear(supabase: SupabaseClient) {
  clearAuthPersistenceMeta()
  await supabase.auth.signOut()
}
