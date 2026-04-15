import type { SupabaseClient } from '@supabase/supabase-js'
import { rpcGetMyBarbeariaLink, rpcUserIsMemberOfBarbearia } from '@/lib/barbearia-rpc'

/** Contexto da barbearia ativa no painel admin quando o usuário é super_admin (múltiplos vínculos). */
export const SUPER_ADMIN_BARBEARIA_STORAGE_KEY = 'super_admin_barbearia_id'

export type ResolveAdminBarbeariaOptions = {
  /** Slug da URL `/[slug]/...` (painel admin da barbearia) — tem prioridade sobre o contexto em localStorage. */
  slug?: string
}

/**
 * Resolve o `barbearia_id` do painel admin.
 * Com `slug` na URL, valida vínculo do usuário à barbearia desse slug.
 * Super admin pode ter vários vínculos; sem slug na URL usa localStorage após "Acessar barbearia"
 * em /barbearias; senão o vínculo mais recente.
 */
export async function resolveAdminBarbeariaId(
  supabase: SupabaseClient,
  userId: string,
  options?: ResolveAdminBarbeariaOptions,
): Promise<string | null> {
  const slug = options?.slug?.trim()
  if (slug) {
    const { data: barbearia } = await supabase
      .from('barbearias')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!barbearia?.id) return null

    const { data: profileSlug } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (profileSlug?.role === 'super_admin') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SUPER_ADMIN_BARBEARIA_STORAGE_KEY, barbearia.id)
      }
      return barbearia.id
    }

    const isMember = await rpcUserIsMemberOfBarbearia(supabase, barbearia.id)
    if (isMember) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SUPER_ADMIN_BARBEARIA_STORAGE_KEY, barbearia.id)
      }
      return barbearia.id
    }

    const { data: vinculoBarbeiro } = await supabase
      .from('barbeiros')
      .select('id')
      .eq('barbearia_id', barbearia.id)
      .eq('user_id', userId)
      .eq('ativo', true)
      .maybeSingle()

    if (vinculoBarbeiro?.id) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SUPER_ADMIN_BARBEARIA_STORAGE_KEY, barbearia.id)
      }
      return barbearia.id
    }

    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  const role = profile?.role

  if (role === 'super_admin' && typeof window !== 'undefined') {
    const preferred = window.localStorage.getItem(SUPER_ADMIN_BARBEARIA_STORAGE_KEY)?.trim()
    if (preferred) {
      const ok = await rpcUserIsMemberOfBarbearia(supabase, preferred)
      if (ok) return preferred
    }
  }

  const link = await rpcGetMyBarbeariaLink(supabase)
  return link?.barbearia_id ?? null
}
