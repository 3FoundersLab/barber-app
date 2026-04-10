import type { SupabaseClient } from '@supabase/supabase-js'
import { clearAuthPersistenceMeta } from '@/lib/auth-session-persistence'
import { clearTenantUnidadeSessionStorage } from '@/lib/tenant-unidade-session'

/** Encerra sessão no Supabase e remove metadados de “Manter conectado” no browser. */
export async function signOutWithPersistenceClear(supabase: SupabaseClient) {
  clearAuthPersistenceMeta()
  clearTenantUnidadeSessionStorage()
  await supabase.auth.signOut()
}
