import type { SupabaseClient } from '@supabase/supabase-js'
import type { Barbearia } from '@/types'

/**
 * RPCs SECURITY DEFINER no banco (scripts/023_barbearia_users_rls_fix_recursion.sql).
 * Evitam 42P17 / 500 em SELECT direto em barbearia_users com RLS encadeado ao PostgREST.
 */

function isMissingDatabaseFunctionError(error: unknown): boolean {
  const e = error as { message?: string; code?: string }
  const m = (e.message ?? '').toLowerCase()
  const c = e.code ?? ''
  return (
    c === '42883' ||
    c === 'PGRST202' ||
    (m.includes('could not find') && m.includes('function')) ||
    (m.includes('function') && m.includes('does not exist'))
  )
}

export type UpdateBarbeariaDadosTenantPayload = {
  p_barbearia_id: string
  p_nome: string
  p_endereco: string | null
  p_telefone: string | null
  p_email: string | null
  /** `HH:MM:SS` ou null (Postgres TIME) */
  p_horario_abertura: string | null
  p_horario_fechamento: string | null
}

/**
 * Atualiza dados da barbearia no painel tenant (script `039_rpc_update_barbearia_dados_tenant.sql`).
 * Não depende do UPDATE REST com RLS. Se a RPC ainda não existir no projeto, retorna `missingFunction: true`.
 */
export async function rpcUpdateBarbeariaDadosTenant(
  supabase: SupabaseClient,
  payload: UpdateBarbeariaDadosTenantPayload,
): Promise<{ row: Barbearia | null; error: unknown; missingFunction: boolean }> {
  const { data, error } = await supabase.rpc('update_barbearia_dados_tenant', payload)
  if (!error && data != null) {
    const raw = Array.isArray(data) ? data[0] : data
    return { row: raw as Barbearia, error: null, missingFunction: false }
  }
  if (error && isMissingDatabaseFunctionError(error)) {
    return { row: null, error, missingFunction: true }
  }
  return { row: null, error: error ?? new Error('RPC update_barbearia_dados_tenant falhou'), missingFunction: false }
}

export type CriarUnidadeBarbeariaTenantPayload = {
  p_barbearia_referencia_id: string
  p_nome: string
  p_slug: string
}

/**
 * Cria nova barbearia (unidade) e vínculo do usuário como admin, espelhando plano/assinatura da referência.
 * Script `040_rpc_criar_unidade_barbearia_tenant.sql`.
 */
export async function rpcCriarUnidadeBarbeariaTenant(
  supabase: SupabaseClient,
  payload: CriarUnidadeBarbeariaTenantPayload,
): Promise<{ row: Barbearia | null; error: unknown; missingFunction: boolean }> {
  const { data, error } = await supabase.rpc('criar_unidade_barbearia_tenant', payload)
  if (!error && data != null) {
    const raw = Array.isArray(data) ? data[0] : data
    return { row: raw as Barbearia, error: null, missingFunction: false }
  }
  if (error && isMissingDatabaseFunctionError(error)) {
    return { row: null, error, missingFunction: true }
  }
  return {
    row: null,
    error: error ?? new Error('RPC criar_unidade_barbearia_tenant falhou'),
    missingFunction: false,
  }
}

/**
 * Exclui a barbearia (unidade) e dados relacionados (CASCADE).
 * Script `041_rpc_remover_unidade_barbearia_tenant.sql`. Admin: exige outra unidade vinculada à conta.
 */
export async function rpcRemoverUnidadeBarbeariaTenant(
  supabase: SupabaseClient,
  payload: { p_barbearia_id: string },
): Promise<{ ok: boolean; error: unknown; missingFunction: boolean }> {
  const { error } = await supabase.rpc('remover_unidade_barbearia_tenant', payload)
  if (!error) {
    return { ok: true, error: null, missingFunction: false }
  }
  if (isMissingDatabaseFunctionError(error)) {
    return { ok: false, error, missingFunction: true }
  }
  return {
    ok: false,
    error: error ?? new Error('RPC remover_unidade_barbearia_tenant falhou'),
    missingFunction: false,
  }
}

export async function rpcGetMyBarbeariaSlug(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_my_barbearia_slug')
  if (error || data == null) return null
  return typeof data === 'string' && data.length > 0 ? data : null
}

export async function rpcGetMyBarbeariaLink(
  supabase: SupabaseClient,
): Promise<{ barbearia_id: string; slug: string } | null> {
  const { data, error } = await supabase.rpc('get_my_barbearia_link')
  if (error || data == null) return null
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') return null
  const barbearia_id = (row as { barbearia_id?: string }).barbearia_id
  const slug = (row as { slug?: string }).slug
  if (!barbearia_id || !slug) return null
  return { barbearia_id, slug }
}

export async function rpcUserIsMemberOfBarbearia(
  supabase: SupabaseClient,
  barbeariaId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('user_is_member_of_barbearia', {
    p_barbearia_id: barbeariaId,
  })
  if (error) return false
  return data === true
}
