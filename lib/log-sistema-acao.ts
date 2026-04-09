import type { SupabaseClient } from '@supabase/supabase-js'

import type { SistemaAcaoTipo } from '@/types'

export type LogSistemaAcaoInput = {
  tipo_acao: SistemaAcaoTipo
  entidade: string
  entidade_id?: string | null
  entidade_nome?: string | null
  resumo_acao: string
  descricao?: string | null
  payload_antes?: Record<string, unknown> | null
  payload_depois?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

/**
 * Registra uma linha em `sistema_acoes_log` (RLS: super_admin).
 * Falhas são ignoradas para não bloquear a operação principal; use apenas após sucesso no CRUD.
 */
export async function logSistemaAcao(
  supabase: SupabaseClient,
  input: LogSistemaAcaoInput,
): Promise<void> {
  const row = {
    tipo_acao: input.tipo_acao,
    entidade: input.entidade,
    entidade_id: input.entidade_id ?? null,
    entidade_nome: input.entidade_nome ?? null,
    resumo_acao: input.resumo_acao,
    descricao: input.descricao ?? null,
    payload_antes: input.payload_antes ?? null,
    payload_depois: input.payload_depois ?? null,
    metadata: input.metadata ?? null,
  }

  const { error } = await supabase.from('sistema_acoes_log').insert(row)
  if (error && process.env.NODE_ENV === 'development') {
    console.warn('[logSistemaAcao]', error.message)
  }
}
