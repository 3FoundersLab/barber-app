import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

const ALLOWED_TYPES = [
  'confirmacao_tratamento',
  'acesso',
  'correcao',
  'anonimizacao_bloqueio_eliminacao',
  'portabilidade',
  'informacao_compartilhamento',
  'revogacao_consentimento',
  'revisao_decisao_automatizada',
] as const

function buildProtocol(date = new Date()): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `LGPD-${y}${m}${d}-${rand}`
}

async function requireUser() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return { supabase, user }
}

export async function GET() {
  const auth = await requireUser()
  if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data, error } = await auth.supabase
    .from('lgpd_solicitacoes')
    .select('id, protocolo, tipo_solicitacao, status, descricao, created_at, updated_at')
    .eq('titular_user_id', auth.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Não foi possível listar solicitações.' }, { status: 500 })
  }

  return NextResponse.json({ requests: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireUser()
  if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const type = String(body.type ?? '').trim()
  const description = String(body.description ?? '').trim().slice(0, 2500)

  if (!ALLOWED_TYPES.includes(type as (typeof ALLOWED_TYPES)[number])) {
    return NextResponse.json({ error: 'Tipo de solicitação inválido.' }, { status: 400 })
  }

  const protocolo = buildProtocol()
  const { data, error } = await auth.supabase
    .from('lgpd_solicitacoes')
    .insert({
      titular_user_id: auth.user.id,
      protocolo,
      tipo_solicitacao: type,
      descricao: description || null,
      status: 'aberta',
    })
    .select('id, protocolo, tipo_solicitacao, status, descricao, created_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Não foi possível abrir a solicitação.' }, { status: 500 })
  }

  return NextResponse.json({ request: data }, { status: 201 })
}
