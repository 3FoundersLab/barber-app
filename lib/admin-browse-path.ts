import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveBarbeariaSlugForUser } from '@/lib/resolve-admin-barbearia-slug'

/**
 * Caminho do dashboard da barbearia com slug (`/b/{slug}/dashboard`).
 * Usado em redirects server-side (`/painel`, home para admin).
 */
export async function getAdminDashboardPathForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return null
  }

  const b = await resolveBarbeariaSlugForUser(supabase, userId)
  if (b?.slug) {
    return `/b/${b.slug}/dashboard`
  }

  if (profile.role === 'super_admin') {
    return '/dashboard'
  }

  return null
}
