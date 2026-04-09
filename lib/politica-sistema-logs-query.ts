import type { SupabaseClient } from '@supabase/supabase-js'

import type { PoliticaSistemaLog } from '@/types'

const LOG_SELECT = `
  *,
  barbearia:barbearias(id, nome),
  actor_profile:profiles!politica_sistema_logs_actor_user_id_fkey(id, nome, email)
`

export type PoliticaLogsFilters = {
  dateFrom: string | null
  dateTo: string | null
  tipoEvento: string
  status: string
  barbeariaId: string | null
  searchText: string
}

function endOfDayIso(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d) return new Date(dateKey).toISOString()
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}

function startOfDayIso(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d) return new Date(dateKey).toISOString()
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
}

/** Remove caracteres que quebram o padrão ILIKE do PostgREST. */
function searchPattern(raw: string): string | null {
  const t = raw.trim().replace(/[%_,]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!t) return null
  return `%${t}%`
}

export async function fetchPoliticaSistemaLogsPage(
  supabase: SupabaseClient,
  filters: PoliticaLogsFilters,
  page: number,
  pageSize: number,
): Promise<{ rows: PoliticaSistemaLog[]; total: number; error: string | null }> {
  const from = Math.max(0, (page - 1) * pageSize)
  const to = from + pageSize - 1

  let query = supabase
    .from('politica_sistema_logs')
    .select(LOG_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters.dateFrom) {
    query = query.gte('created_at', startOfDayIso(filters.dateFrom))
  }
  if (filters.dateTo) {
    query = query.lte('created_at', endOfDayIso(filters.dateTo))
  }
  if (filters.tipoEvento && filters.tipoEvento !== 'todos') {
    query = query.eq('tipo_evento', filters.tipoEvento)
  }
  if (filters.status && filters.status !== 'todos') {
    query = query.eq('status_execucao', filters.status)
  }
  if (filters.barbeariaId) {
    query = query.eq('barbearia_id', filters.barbeariaId)
  }

  const p = searchPattern(filters.searchText)
  if (p) {
    if (filters.barbeariaId) {
      query = query.or(`descricao.ilike.${p},mensagem_erro.ilike.${p},tipo_evento.ilike.${p}`)
    } else {
      const { data: barMatches, error: barErr } = await supabase
        .from('barbearias')
        .select('id')
        .or(`nome.ilike.${p},email.ilike.${p}`)

      if (barErr) {
        return { rows: [], total: 0, error: 'Não foi possível aplicar a busca por barbearia.' }
      }

      const ids = (barMatches ?? []).map((b) => b.id as string)
      const parts = [`descricao.ilike.${p}`, `mensagem_erro.ilike.${p}`, `tipo_evento.ilike.${p}`]
      if (ids.length > 0) {
        parts.push(`barbearia_id.in.(${ids.join(',')})`)
      }
      query = query.or(parts.join(','))
    }
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    return { rows: [], total: 0, error: 'Não foi possível carregar os logs.' }
  }

  return {
    rows: (data ?? []) as PoliticaSistemaLog[],
    total: count ?? 0,
    error: null,
  }
}

const EXPORT_CAP = 5000

export async function fetchPoliticaSistemaLogsExport(
  supabase: SupabaseClient,
  filters: PoliticaLogsFilters,
): Promise<{ rows: PoliticaSistemaLog[]; error: string | null }> {
  let query = supabase
    .from('politica_sistema_logs')
    .select(LOG_SELECT)
    .order('created_at', { ascending: false })
    .limit(EXPORT_CAP)

  if (filters.dateFrom) {
    query = query.gte('created_at', startOfDayIso(filters.dateFrom))
  }
  if (filters.dateTo) {
    query = query.lte('created_at', endOfDayIso(filters.dateTo))
  }
  if (filters.tipoEvento && filters.tipoEvento !== 'todos') {
    query = query.eq('tipo_evento', filters.tipoEvento)
  }
  if (filters.status && filters.status !== 'todos') {
    query = query.eq('status_execucao', filters.status)
  }
  if (filters.barbeariaId) {
    query = query.eq('barbearia_id', filters.barbeariaId)
  }

  const p = searchPattern(filters.searchText)
  if (p) {
    if (filters.barbeariaId) {
      query = query.or(`descricao.ilike.${p},mensagem_erro.ilike.${p},tipo_evento.ilike.${p}`)
    } else {
      const { data: barMatches, error: barErr } = await supabase
        .from('barbearias')
        .select('id')
        .or(`nome.ilike.${p},email.ilike.${p}`)

      if (barErr) {
        return { rows: [], error: 'Não foi possível exportar: busca por barbearia falhou.' }
      }

      const ids = (barMatches ?? []).map((b) => b.id as string)
      const parts = [`descricao.ilike.${p}`, `mensagem_erro.ilike.${p}`, `tipo_evento.ilike.${p}`]
      if (ids.length > 0) {
        parts.push(`barbearia_id.in.(${ids.join(',')})`)
      }
      query = query.or(parts.join(','))
    }
  }

  const { data, error } = await query

  if (error) {
    return { rows: [], error: 'Não foi possível exportar os logs.' }
  }

  return { rows: (data ?? []) as PoliticaSistemaLog[], error: null }
}

export function logsToCsv(rows: PoliticaSistemaLog[]): string {
  const headers = [
    'Data/Hora (ISO)',
    'Tipo',
    'Barbearia',
    'Descrição',
    'Status',
    'Usuário',
    'E-mail usuário',
    'Mensagem erro',
    'Detalhes (JSON)',
  ]

  const esc = (cell: string) => {
    const s = cell.replace(/"/g, '""')
    return `"${s}"`
  }

  const lines = [headers.join(';')]

  for (const r of rows) {
    const detalhes =
      r.detalhes && typeof r.detalhes === 'object'
        ? JSON.stringify(r.detalhes)
        : ''
    lines.push(
      [
        esc(r.created_at),
        esc(r.tipo_evento),
        esc(r.barbearia?.nome ?? ''),
        esc(r.descricao),
        esc(r.status_execucao),
        esc(r.actor_profile?.nome ?? ''),
        esc(r.actor_profile?.email ?? ''),
        esc(r.mensagem_erro ?? ''),
        esc(detalhes),
      ].join(';'),
    )
  }

  return '\uFEFF' + lines.join('\r\n')
}
