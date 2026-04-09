import type { SupabaseClient } from '@supabase/supabase-js'

import type { SistemaAcaoLog } from '@/types'

const LOG_SELECT = `
  *,
  actor_profile:profiles!sistema_acoes_log_actor_user_id_fkey(id, nome, email)
`

export type SistemaAcoesLogsFilters = {
  dateFrom: string | null
  dateTo: string | null
  tipoAcao: string
  entidade: string
  actorUserId: string | null
  onlyMyActions: boolean
  myUserId: string | null
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

function searchPattern(raw: string): string | null {
  const t = raw.trim().replace(/[%_,]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!t) return null
  return `%${t}%`
}

export async function fetchSistemaAcoesLogsPage(
  supabase: SupabaseClient,
  filters: SistemaAcoesLogsFilters,
  page: number,
  pageSize: number,
): Promise<{ rows: SistemaAcaoLog[]; total: number; error: string | null }> {
  const from = Math.max(0, (page - 1) * pageSize)
  const to = from + pageSize - 1

  let query = supabase
    .from('sistema_acoes_log')
    .select(LOG_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters.dateFrom) {
    query = query.gte('created_at', startOfDayIso(filters.dateFrom))
  }
  if (filters.dateTo) {
    query = query.lte('created_at', endOfDayIso(filters.dateTo))
  }
  if (filters.tipoAcao && filters.tipoAcao !== 'todos') {
    query = query.eq('tipo_acao', filters.tipoAcao)
  }
  if (filters.entidade && filters.entidade !== 'todos') {
    query = query.eq('entidade', filters.entidade)
  }

  if (filters.onlyMyActions && filters.myUserId) {
    query = query.eq('actor_user_id', filters.myUserId)
  } else if (filters.actorUserId) {
    query = query.eq('actor_user_id', filters.actorUserId)
  }

  const p = searchPattern(filters.searchText)
  if (p) {
    const { data: profileMatches, error: profErr } = await supabase
      .from('profiles')
      .select('id')
      .or(`nome.ilike.${p},email.ilike.${p}`)

    if (profErr) {
      return { rows: [], total: 0, error: 'Não foi possível aplicar a busca por usuário.' }
    }

    const profileIds = (profileMatches ?? []).map((row) => row.id as string)
    const parts = [
      `resumo_acao.ilike.${p}`,
      `descricao.ilike.${p}`,
      `entidade_nome.ilike.${p}`,
      `entidade.ilike.${p}`,
    ]
    if (profileIds.length > 0) {
      parts.push(`actor_user_id.in.(${profileIds.join(',')})`)
    }
    query = query.or(parts.join(','))
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    return { rows: [], total: 0, error: 'Não foi possível carregar o histórico de ações.' }
  }

  return {
    rows: (data ?? []) as SistemaAcaoLog[],
    total: count ?? 0,
    error: null,
  }
}

const EXPORT_CAP = 5000

export async function fetchSistemaAcoesLogsExport(
  supabase: SupabaseClient,
  filters: SistemaAcoesLogsFilters,
): Promise<{ rows: SistemaAcaoLog[]; error: string | null }> {
  let query = supabase
    .from('sistema_acoes_log')
    .select(LOG_SELECT)
    .order('created_at', { ascending: false })
    .limit(EXPORT_CAP)

  if (filters.dateFrom) {
    query = query.gte('created_at', startOfDayIso(filters.dateFrom))
  }
  if (filters.dateTo) {
    query = query.lte('created_at', endOfDayIso(filters.dateTo))
  }
  if (filters.tipoAcao && filters.tipoAcao !== 'todos') {
    query = query.eq('tipo_acao', filters.tipoAcao)
  }
  if (filters.entidade && filters.entidade !== 'todos') {
    query = query.eq('entidade', filters.entidade)
  }
  if (filters.onlyMyActions && filters.myUserId) {
    query = query.eq('actor_user_id', filters.myUserId)
  } else if (filters.actorUserId) {
    query = query.eq('actor_user_id', filters.actorUserId)
  }

  const p = searchPattern(filters.searchText)
  if (p) {
    const { data: profileMatches, error: profErr } = await supabase
      .from('profiles')
      .select('id')
      .or(`nome.ilike.${p},email.ilike.${p}`)

    if (profErr) {
      return { rows: [], error: 'Não foi possível exportar: busca por usuário falhou.' }
    }

    const profileIds = (profileMatches ?? []).map((row) => row.id as string)
    const parts = [
      `resumo_acao.ilike.${p}`,
      `descricao.ilike.${p}`,
      `entidade_nome.ilike.${p}`,
      `entidade.ilike.${p}`,
    ]
    if (profileIds.length > 0) {
      parts.push(`actor_user_id.in.(${profileIds.join(',')})`)
    }
    query = query.or(parts.join(','))
  }

  const { data, error } = await query

  if (error) {
    return { rows: [], error: 'Não foi possível exportar o histórico.' }
  }

  return { rows: (data ?? []) as SistemaAcaoLog[], error: null }
}

export function sistemaAcoesLogsToCsv(rows: SistemaAcaoLog[]): string {
  const headers = [
    'Data/Hora (ISO)',
    'Tipo ação',
    'Entidade',
    'ID entidade',
    'Nome entidade',
    'Resumo',
    'Descrição',
    'Usuário',
    'E-mail usuário',
    'Payload antes (JSON)',
    'Payload depois (JSON)',
    'Metadata (JSON)',
  ]

  const esc = (cell: string) => {
    const s = cell.replace(/"/g, '""')
    return `"${s}"`
  }

  const lines = [headers.join(';')]

  for (const r of rows) {
    const antes =
      r.payload_antes && typeof r.payload_antes === 'object' ? JSON.stringify(r.payload_antes) : ''
    const depois =
      r.payload_depois && typeof r.payload_depois === 'object' ? JSON.stringify(r.payload_depois) : ''
    const meta =
      r.metadata && typeof r.metadata === 'object' ? JSON.stringify(r.metadata) : ''

    lines.push(
      [
        esc(r.created_at),
        esc(r.tipo_acao),
        esc(r.entidade),
        esc(r.entidade_id ?? ''),
        esc(r.entidade_nome ?? ''),
        esc(r.resumo_acao),
        esc(r.descricao ?? ''),
        esc(r.actor_profile?.nome ?? ''),
        esc(r.actor_profile?.email ?? ''),
        esc(antes),
        esc(depois),
        esc(meta),
      ].join(';'),
    )
  }

  return '\uFEFF' + lines.join('\r\n')
}
