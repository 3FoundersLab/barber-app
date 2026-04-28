import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAgendaDemoForDate } from '@/lib/agenda-demo-data'

function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

function buildDemoPayload(id: string) {
  const [baseId, datePart] = id.split('__')
  if (!baseId?.startsWith('demo-a')) return null
  const date = datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : null
  if (!date) return null

  const demo = getAgendaDemoForDate(date).agendamentos.find((a) => `${a.id}__${date}` === id)
  if (!demo) return null

  return {
    id,
    data: demo.data,
    horario: demo.horario,
    status: demo.status,
    valor: demo.valor,
    confirmado_cliente_em: null,
    cliente: demo.cliente ? { nome: demo.cliente.nome, telefone: demo.cliente.telefone ?? null } : null,
    barbeiro: demo.barbeiro ? { nome: demo.barbeiro.nome } : null,
    servico: demo.servico ? { nome: demo.servico.nome, duracao: demo.servico.duracao ?? null } : null,
    barbearia: { nome: 'Barbearia Demo' },
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  if (!id) return NextResponse.json({ error: 'Agendamento inválido.' }, { status: 400 })
  if (id.startsWith('demo-')) {
    const demoData = buildDemoPayload(id)
    if (!demoData) {
      return NextResponse.json({ error: 'Agendamento demo não encontrado.' }, { status: 404 })
    }
    return NextResponse.json({ data: demoData })
  }

  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Configuração do servidor incompleta (SUPABASE_SERVICE_ROLE_KEY).' },
      { status: 500 },
    )
  }

  const { data, error } = await supabase
    .from('agendamentos')
    .select(
      `
      id,
      data,
      horario,
      status,
      valor,
      confirmado_cliente_em,
      cliente:clientes(nome, telefone),
      barbeiro:barbeiros(nome),
      servico:servicos(nome, duracao),
      barbearia:barbearias(nome)
    `,
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ data })
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  if (!id) return NextResponse.json({ error: 'Agendamento inválido.' }, { status: 400 })
  const body = await request.json().catch(() => ({}))
  const action = body?.action === 'cancel' ? 'cancel' : 'confirm'
  if (id.startsWith('demo-')) {
    const demoData = buildDemoPayload(id)
    if (!demoData) {
      return NextResponse.json({ error: 'Agendamento demo não encontrado.' }, { status: 404 })
    }
    if (action === 'cancel') {
      return NextResponse.json({ ok: true, cancelledAt: new Date().toISOString(), demo: true })
    }
    return NextResponse.json({ ok: true, confirmedAt: new Date().toISOString(), demo: true })
  }

  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Configuração do servidor incompleta (SUPABASE_SERVICE_ROLE_KEY).' },
      { status: 500 },
    )
  }

  const { data: row, error: findError } = await supabase
    .from('agendamentos')
    .select('id, status, confirmado_cliente_em')
    .eq('id', id)
    .maybeSingle()

  if (findError || !row) {
    return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 })
  }

  if (row.status !== 'agendado') {
    return NextResponse.json(
      { error: 'Este agendamento não pode mais ser confirmado.' },
      { status: 409 },
    )
  }

  if (action === 'confirm' && row.confirmado_cliente_em) {
    return NextResponse.json({ ok: true, alreadyConfirmed: true })
  }

  if (action === 'cancel') {
    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({
        status: 'cancelado',
        motivo_cancelamento: 'Cancelado pelo cliente via link de confirmação.',
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Não foi possível cancelar o agendamento.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, cancelled: true })
  }

  const nowIso = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('agendamentos')
    .update({ confirmado_cliente_em: nowIso })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Não foi possível confirmar o agendamento.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, confirmedAt: nowIso })
}
