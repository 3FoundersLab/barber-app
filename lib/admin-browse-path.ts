import type { SupabaseClient } from '@supabase/supabase-js'

function embedSlug(
  row: { barbearias: unknown } | null,
): string | null {
  if (!row) return null
  const b = row.barbearias as { slug: string } | { slug: string }[] | null | undefined
  if (Array.isArray(b)) return b[0]?.slug ?? null
  return b?.slug ?? null
}

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

  const { data: row } = await supabase
    .from('barbearia_users')
    .select('barbearia_id, barbearias(slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const slug = embedSlug(row)
  if (slug) return `/b/${slug}/dashboard`

  if (profile.role === 'super_admin') {
    return '/dashboard'
  }

  return null
}
