import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enviarLembreteCobrancaRenovacao } from '@/lib/email/lembrete-cobranca-assinatura'

type RowExpirada = {
  assinatura_id: string
  barbearia_id: string
  barbearia_nome: string
  email_contato: string | null
  data_expiracao: string
}

function autorizadoCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  const auth = request.headers.get('authorization')?.trim()
  const expected = secret ? `Bearer ${secret}` : null
  return Boolean(secret && expected && auth === expected)
}

async function processarExpiracao() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: 'Supabase service não configurado no servidor.' },
      { status: 503 },
    )
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.rpc('marcar_assinaturas_expiradas_como_pendente')

  if (error) {
    return NextResponse.json(
      { error: 'Falha ao processar assinaturas expiradas', detalhe: error.message },
      { status: 500 },
    )
  }

  const rows = (data ?? []) as RowExpirada[]
  let emailsEnviados = 0
  const emailsIgnorados: { assinatura_id: string; motivo: string }[] = []

  for (const row of rows) {
    const email = row.email_contato?.trim()
    if (!email) {
      emailsIgnorados.push({ assinatura_id: row.assinatura_id, motivo: 'sem_email_barbearia' })
      continue
    }

    const resultado = await enviarLembreteCobrancaRenovacao({
      destinatario: email,
      nomeBarbearia: row.barbearia_nome || 'Barbearia',
      dataExpiracao: row.data_expiracao,
    })

    if (resultado.enviado) {
      emailsEnviados += 1
    } else if (resultado.motivo === 'sem_api_key') {
      emailsIgnorados.push({ assinatura_id: row.assinatura_id, motivo: 'resend_nao_configurado' })
    } else {
      emailsIgnorados.push({
        assinatura_id: row.assinatura_id,
        motivo: resultado.detalhe ?? 'erro_envio',
      })
    }
  }

  return NextResponse.json({
    assinaturasMarcadasPendente: rows.length,
    emailsEnviados,
    emailsIgnorados: emailsIgnorados.length > 0 ? emailsIgnorados : undefined,
  })
}

/**
 * Cron (ex.: Vercel): invocação diária em GET com Authorization: Bearer CRON_SECRET.
 * Marca assinaturas ativas vencidas como pendente e envia lembrete por e-mail (Resend) quando houver destinatário.
 */
export async function GET(request: NextRequest) {
  if (!autorizadoCron(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  return processarExpiracao()
}

/** Mesma lógica para testes manuais ou integrações que usem POST. */
export async function POST(request: NextRequest) {
  if (!autorizadoCron(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  return processarExpiracao()
}
