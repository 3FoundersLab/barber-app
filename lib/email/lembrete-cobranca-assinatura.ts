/**
 * Lembrete de cobrança após vencimento da assinatura (renovação).
 * Usa a API REST do Resend se RESEND_API_KEY estiver definida.
 */

function formatarDataBR(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  if (!y || !m || !d) return isoDate
  return `${d}/${m}/${y}`
}

export type LembreteCobrancaParams = {
  destinatario: string
  nomeBarbearia: string
  dataExpiracao: string
}

export type LembreteCobrancaResult =
  | { enviado: true }
  | { enviado: false; motivo: 'sem_api_key' | 'erro'; detalhe?: string }

export async function enviarLembreteCobrancaRenovacao(
  params: LembreteCobrancaParams,
): Promise<LembreteCobrancaResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL?.trim()
  if (!apiKey || !from) {
    return { enviado: false, motivo: 'sem_api_key' }
  }

  const assunto = `Renovação do plano — pagamento pendente (${params.nomeBarbearia})`
  const dataFmt = formatarDataBR(params.dataExpiracao)
  const html = `
    <p>Olá,</p>
    <p>O período da assinatura da barbearia <strong>${escapeHtml(params.nomeBarbearia)}</strong> atingiu a data de expiração (${dataFmt}).</p>
    <p>O status da assinatura foi definido como <strong>pagamento pendente</strong> até a regularização com o administrador da plataforma.</p>
    <p>Em caso de dúvidas, responda a este e-mail ou use o contato do suporte.</p>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.destinatario],
        subject: assunto,
        html,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return { enviado: false, motivo: 'erro', detalhe: text.slice(0, 500) }
    }
    return { enviado: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { enviado: false, motivo: 'erro', detalhe: msg }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
