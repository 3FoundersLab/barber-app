import { Banknote, Cake, CalendarOff, Gift, Package, Sparkles, TrendingUp, UserPlus } from 'lucide-react'
import { formatCurrency, formatTime } from '@/lib/constants'
import { whatsappChatHref } from '@/lib/format-contato'
import type { AlertaDashboard } from '@/types/admin-dashboard'

export type BuildAdminDashboardAlertsInput = {
  base: string
  operacaoLiberada: boolean
  /** Agendamentos de hoje (agendado/em_atendimento) com pagamento ainda pendente e valor > 0 */
  recebimentosPendentesHoje: { horario: string }[]
  /** Produtos com quantidade ≤ mínimo (ou esgotado) */
  estoqueCritico: { nome: string; quantidade: number; minimo: number }[]
  clientesNovosUltimos7Dias: number
  agendamentosHoje: number
  /** média simples de agendamentos/dia nos últimos N dias (dias com operação) */
  mediaAgendamentosRecente: number
  aniversariantesHoje: { nome: string; telefone?: string | null }[]
  /** Membros da equipe com aniversário entre hoje e os próximos 3 dias (painel). */
  aniversariosEquipeProximos?: { nome: string; telefone?: string | null; diasRestantes: number }[]
}

function joinHorarios(amostra: { horario: string }[], max = 3): string {
  const slice = amostra.slice(0, max).map((a) => formatTime(a.horario))
  if (amostra.length > max) return `${slice.join(', ')} e outros`
  return slice.join(', ')
}

export function buildAdminDashboardAlerts(input: BuildAdminDashboardAlertsInput): AlertaDashboard[] {
  const out: AlertaDashboard[] = []
  const { base, operacaoLiberada } = input

  if (!operacaoLiberada) {
    return [
      {
        id: 'info-plano',
        tipo: 'info',
        titulo: 'Modo de ativação',
        descricao:
          'Após a confirmação do pagamento, alertas operacionais (estoque, recebimentos, oportunidades) aparecem aqui automaticamente.',
        acao: 'Ver assinatura',
        link: `${base}/assinatura`,
        icone: Sparkles,
      },
    ]
  }

  const nPend = input.recebimentosPendentesHoje.length
  if (nPend > 0) {
    out.push({
      id: 'recebimento-hoje',
      tipo: 'urgente',
      titulo:
        nPend === 1
          ? '1 atendimento de hoje sem confirmação de pagamento'
          : `${nPend} atendimentos de hoje sem confirmação de pagamento`,
      descricao:
        nPend <= 3
          ? `Horários: ${joinHorarios(input.recebimentosPendentesHoje)}. Confirme na comanda ou no caixa.`
          : `Inclui horários como ${joinHorarios(input.recebimentosPendentesHoje)}. Revise na lista de agendamentos.`,
      acao: 'Ver agendamentos',
      link: `${base}/agendamentos`,
      icone: Banknote,
    })
  }

  const crit = input.estoqueCritico
  if (crit.length > 0) {
    const [p] = crit
    const rest = crit.length - 1
    out.push({
      id: 'estoque-critico',
      tipo: 'atencao',
      titulo:
        crit.length === 1
          ? `Estoque crítico: ${p.nome}`
          : `${crit.length} itens no estoque precisam de atenção`,
      descricao:
        crit.length === 1
          ? p.quantidade <= 0
            ? 'Produto esgotado — repor antes de vender.'
            : `Apenas ${p.quantidade} unidade(s); mínimo sugerido ${p.minimo}.`
          : `${p.nome} (${p.quantidade} un.) e +${rest} itens, evite ruptura.`,
      acao: 'Ver estoque',
      link: `${base}/estoque`,
      icone: Package,
    })
  }

  const { agendamentosHoje, mediaAgendamentosRecente } = input
  if (
    mediaAgendamentosRecente >= 2 &&
    agendamentosHoje < Math.max(1, Math.floor(mediaAgendamentosRecente * 0.65))
  ) {
    out.push({
      id: 'movimento-abaixo-media',
      tipo: 'atencao',
      titulo: 'Movimento abaixo do seu ritmo recente',
      descricao: `Hoje há ${agendamentosHoje} agendamento(s); sua média recente gira em torno de ${mediaAgendamentosRecente.toFixed(1)} por dia. Divulgue horários ou ofertas.`,
      acao: 'Abrir agenda',
      link: `${base}/agendamentos`,
      icone: CalendarOff,
    })
  }

  if (input.clientesNovosUltimos7Dias > 0) {
    out.push({
      id: 'clientes-novos',
      tipo: 'info',
      titulo:
        input.clientesNovosUltimos7Dias === 1
          ? '1 novo cliente nos últimos 7 dias'
          : `${input.clientesNovosUltimos7Dias} novos clientes nos últimos 7 dias`,
      descricao: 'Ótimo momento para mensagem de boas-vindas ou indicação de plano.',
      acao: 'Ver clientes',
      link: `${base}/clientes`,
      icone: UserPlus,
    })
  }

  const aniversariantes = input.aniversariantesHoje
  if (aniversariantes.length > 0) {
    const primeiro = aniversariantes[0]
    const primeiroNome = primeiro.nome.trim().split(/\s+/)[0] || primeiro.nome.trim()
    const msg = `Oi, ${primeiroNome}! 🎉\n\nPassando para te desejar um feliz aniversário em nome da barbearia. Que seu dia seja incrível!`
    const wa = primeiro.telefone ? whatsappChatHref(primeiro.telefone, msg) : null
    const nomesExtras = aniversariantes
      .slice(1, 3)
      .map((a) => a.nome.trim().split(/\s+/)[0] || a.nome.trim())
      .join(', ')
    const extrasCount = Math.max(0, aniversariantes.length - 1)

    out.push({
      id: 'aniversariantes-hoje',
      tipo: 'especial',
      titulo:
        aniversariantes.length === 1
          ? `Hoje é aniversário de ${primeiro.nome}`
          : `Hoje ${aniversariantes.length} clientes fazem aniversário`,
      descricao:
        aniversariantes.length === 1
          ? wa
            ? 'Enviar parabéns no WhatsApp para fortalecer o relacionamento.'
            : 'Cliente sem telefone válido para WhatsApp. Atualize o cadastro para facilitar o contato.'
          : wa
            ? nomesExtras
              ? `${primeiro.nome}, ${nomesExtras}${extrasCount > 2 ? ' e outros' : ''}. Envie parabéns pelo WhatsApp.`
              : `${primeiro.nome} e outros clientes estão de aniversário hoje.`
            : `${primeiro.nome} e outros clientes estão de aniversário hoje.`,
      acao: wa ? 'Enviar parabéns' : 'Ver clientes',
      link: wa ?? `${base}/clientes`,
      linkTarget: wa ? '_blank' : '_self',
      icone: Gift,
    })
  }

  const equipeAniv = input.aniversariosEquipeProximos ?? []
  if (equipeAniv.length > 0) {
    const sorted = [...equipeAniv].sort(
      (a, b) => a.diasRestantes - b.diasRestantes || a.nome.localeCompare(b.nome, 'pt-BR'),
    )
    const primeiroWa = sorted.find((x) => x.diasRestantes === 0 && x.telefone)
    const waNome =
      primeiroWa?.nome.trim().split(/\s+/)[0] || primeiroWa?.nome.trim() || ''
    const wa = primeiroWa?.telefone
      ? whatsappChatHref(
          primeiroWa.telefone,
          `Oi, ${waNome}! 🎉\n\nFeliz aniversário em nome do time da barbearia!`,
        )
      : null
    const linhas = sorted.map((x) => {
      if (x.diasRestantes === 0) return `${x.nome} — hoje`
      if (x.diasRestantes === 1) return `${x.nome} — amanhã`
      return `${x.nome} — em ${x.diasRestantes} dias`
    })
    const primeiro = sorted[0]
    const tituloUm =
      primeiro.diasRestantes === 0
        ? `Aniversário na equipe: ${primeiro.nome}`
        : `Em ${primeiro.diasRestantes} dia(s), aniversário de ${primeiro.nome}`
    out.push({
      id: 'aniversario-equipe-proximo',
      tipo: 'especial',
      titulo: equipeAniv.length === 1 ? tituloUm : `${equipeAniv.length} aniversários na equipe em até 3 dias`,
      descricao: linhas.join(' · '),
      acao: wa ? 'Parabéns no WhatsApp' : 'Ver equipe',
      link: wa ?? `${base}/equipe`,
      linkTarget: wa ? '_blank' : '_self',
      icone: Cake,
    })
  }

  if (out.length === 0) {
    out.push({
      id: 'tudo-certo',
      tipo: 'sucesso',
      titulo: 'Nenhum alerta crítico agora',
      descricao: 'Recebimentos e estoque estão sob controle no que monitoramos neste painel.',
      acao: 'Ver relatórios',
      link: `${base}/relatorios`,
      icone: TrendingUp,
    })
  }

  return out
}

export type DashboardResumoTendencia = {
  mediaFat7d: number
  /** texto curto para leitura rápida */
  insightLinha: string
}

export function buildDashboardResumoTendencia(
  pontos: { faturamento: number }[],
  faturamentoMesParcial: number,
  diaDoMes: number,
): DashboardResumoTendencia {
  const ultimos7 = pontos.slice(-7)
  const soma7 = ultimos7.reduce((s, p) => s + p.faturamento, 0)
  const mediaFat7d = ultimos7.length ? soma7 / ultimos7.length : 0

  let insightLinha = `Média de faturamento (últimos 7 dias): ${formatCurrency(Math.round(mediaFat7d * 100) / 100)} por dia.`
  if (diaDoMes >= 3 && faturamentoMesParcial > 0) {
    const ritmo = (faturamentoMesParcial / diaDoMes) * 30
    insightLinha += ` Ritmo linear do mês (estimativa): ~${formatCurrency(Math.round(ritmo * 100) / 100)}.`
  }

  return { mediaFat7d, insightLinha }
}
