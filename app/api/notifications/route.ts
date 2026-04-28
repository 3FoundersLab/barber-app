import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { normalizeDashboardNotificationState } from '@/lib/dashboard-notification-state'
import type { AlertaDashboardTipo } from '@/types/admin-dashboard'

const TIPOS_VALIDOS: AlertaDashboardTipo[] = ['urgente', 'atencao', 'especial', 'info', 'sucesso']
const CHAVES_MUTED_VALIDAS = [
  ...TIPOS_VALIDOS,
  'atencao:estoque',
  'atencao:confirmacao_agendamento',
  'atencao:movimento',
] as const

function isValidMutedKeyList(v: unknown): v is string[] {
  return (
    Array.isArray(v) &&
    v.every((x) => typeof x === 'string' && CHAVES_MUTED_VALIDAS.includes(x as (typeof CHAVES_MUTED_VALIDAS)[number]))
  )
}

function isStringRecord(v: unknown): v is Record<string, string> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  for (const [, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val !== 'string') return false
  }
  return true
}

async function requireBarbeariaAccess(barbeariaId: string, slug: string | undefined) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }
  const resolved = await resolveAdminBarbeariaId(supabase, user.id, slug ? { slug } : undefined)
  if (!resolved || resolved !== barbeariaId) {
    return { response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }
  }
  return { supabase, user }
}

/** Lê preferências de notificações do dashboard (RLS + sessão). */
export async function GET(request: NextRequest) {
  const barbeariaId = request.nextUrl.searchParams.get('barbeariaId')?.trim()
  const slug = request.nextUrl.searchParams.get('slug')?.trim() || undefined
  if (!barbeariaId) {
    return NextResponse.json({ error: 'barbeariaId obrigatório' }, { status: 400 })
  }

  const auth = await requireBarbeariaAccess(barbeariaId, slug)
  if ('response' in auth) return auth.response

  const { data: row } = await auth.supabase
    .from('dashboard_notification_states')
    .select('read_ids, archived_ids, muted_types, read_at')
    .eq('barbearia_id', barbeariaId)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  const state = normalizeDashboardNotificationState(row)
  return NextResponse.json(state)
}

/** Atualiza preferências (substitui o documento do par barbearia + usuário). */
export async function PUT(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const barbeariaId = String(body.barbearia_id ?? '').trim()
  const slug = typeof body.slug === 'string' ? body.slug.trim() || undefined : undefined
  if (!barbeariaId) {
    return NextResponse.json({ error: 'barbearia_id obrigatório' }, { status: 400 })
  }

  const auth = await requireBarbeariaAccess(barbeariaId, slug)
  if ('response' in auth) return auth.response

  const read_ids = Array.isArray(body.read_ids) ? body.read_ids.filter((x): x is string => typeof x === 'string') : []
  const archived_ids = Array.isArray(body.archived_ids)
    ? body.archived_ids.filter((x): x is string => typeof x === 'string')
    : []
  const muted_types = isValidMutedKeyList(body.muted_types) ? body.muted_types : []
  const read_at = isStringRecord(body.read_at) ? body.read_at : {}

  const { error } = await auth.supabase.from('dashboard_notification_states').upsert(
    {
      barbearia_id: barbeariaId,
      user_id: auth.user.id,
      read_ids,
      archived_ids,
      muted_types,
      read_at,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'barbearia_id,user_id' },
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
