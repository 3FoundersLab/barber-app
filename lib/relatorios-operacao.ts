import type { Agendamento } from '@/types'

/** Meta de referência para tempo de corte (minutos). */
export const META_TEMPO_CORTE_MIN = 30

export function horarioParaMinutos(horario: string): number {
  const [h, m] = horario.split(':').map((x) => Number(x))
  if (!Number.isFinite(h)) return 0
  const mm = Number.isFinite(m) ? m : 0
  return h * 60 + mm
}

function horaDoAgendamento(horario: string): number {
  const [h] = horario.split(':').map(Number)
  return Number.isFinite(h) ? h : 0
}

function duracaoMinutosCadastro(a: Agendamento): number {
  const d = a.servico?.duracao
  if (typeof d === 'number' && d > 0) return d
  return META_TEMPO_CORTE_MIN
}

/** Duração em minutos: tenta intervalo created→updated no concluído; senão cadastro. */
export function duracaoAtendimentoMinutos(a: Agendamento): number | null {
  if (a.status !== 'concluido') return null
  try {
    const c = new Date(a.created_at).getTime()
    const u = new Date(a.updated_at).getTime()
    const diff = (u - c) / 60000
    if (diff >= 3 && diff <= 240) return diff
  } catch {
    /* ignore */
  }
  const d = a.servico?.duracao
  if (typeof d === 'number' && d > 0) return d
  return null
}

/** Tempo médio (min) por serviço em concluídos, ordenado por volume. */
export function tempoMedioAtendimentoPorServico(list: Agendamento[]) {
  const m = new Map<string, { nome: string; soma: number; n: number }>()
  for (const a of list) {
    const dur = duracaoAtendimentoMinutos(a)
    if (dur == null) continue
    const cur = m.get(a.servico_id) ?? { nome: a.servico?.nome ?? 'Serviço', soma: 0, n: 0 }
    cur.soma += dur
    cur.n += 1
    m.set(a.servico_id, cur)
  }
  return [...m.entries()]
    .map(([id, v]) => ({
      id,
      nome: v.nome,
      mediaMin: v.n > 0 ? v.soma / v.n : 0,
      amostras: v.n,
    }))
    .sort((a, b) => b.amostras - a.amostras)
}

/** Concluídos / total (percentual). */
export function taxaComparecimentoConcluidos(list: Agendamento[]): number {
  const t = list.length
  if (!t) return 0
  return (list.filter((a) => a.status === 'concluido').length / t) * 100
}

/** (Cancelados + faltas) / total. */
export function taxaCancelamentoFalta(list: Agendamento[]): number {
  const t = list.length
  if (!t) return 0
  return (list.filter((a) => a.status === 'cancelado' || a.status === 'faltou').length / t) * 100
}

/**
 * Espera estimada entre atendimentos no mesmo dia e barbeiro (min),
 * usando horários agendados e duração cadastrada do serviço anterior.
 */
export function esperaMediaEstimadaMinutos(list: Agendamento[]) {
  const byKey = new Map<string, Agendamento[]>()
  for (const a of list) {
    if (a.status === 'cancelado') continue
    const key = `${a.data}|${a.barbeiro_id}`
    const arr = byKey.get(key) ?? []
    arr.push(a)
    byKey.set(key, arr)
  }
  const waits: number[] = []
  for (const arr of byKey.values()) {
    if (arr.length < 2) continue
    arr.sort((x, y) => horarioParaMinutos(x.horario) - horarioParaMinutos(y.horario))
    let fimPrev = horarioParaMinutos(arr[0].horario) + duracaoMinutosCadastro(arr[0])
    for (let i = 1; i < arr.length; i++) {
      const ini = horarioParaMinutos(arr[i].horario)
      waits.push(Math.max(0, ini - fimPrev))
      fimPrev = Math.max(fimPrev, ini + duracaoMinutosCadastro(arr[i]))
    }
  }
  if (waits.length === 0) {
    return {
      mediaMin: null as number | null,
      amostras: 0,
      detalhe:
        'Sem sequência de dois ou mais atendimentos no mesmo dia e profissional para estimar fila.',
    }
  }
  const mediaMin = waits.reduce((s, w) => s + w, 0) / waits.length
  return {
    mediaMin,
    amostras: waits.length,
    detalhe: 'Estimativa a partir da sequência de horários e duração cadastrada de cada serviço.',
  }
}

export type FunilOperacao = {
  agendados: number
  compareceram: number
  finalizaram: number
  pagaram: number
  voltaram: number
}

/** Funil: total → compareceram (concluído ou em atendimento) → concluídos → pagos → clientes com 2+ concluídos no período. */
export function funilOperacao(list: Agendamento[]): FunilOperacao {
  const agendados = list.length
  const compareceram = list.filter((a) => a.status === 'concluido' || a.status === 'em_atendimento').length
  const finalizaram = list.filter((a) => a.status === 'concluido').length
  const pagaram = list.filter((a) => a.status === 'concluido' && a.status_pagamento === 'pago').length
  const porCliente = new Map<string, number>()
  for (const a of list) {
    if (a.status !== 'concluido') continue
    porCliente.set(a.cliente_id, (porCliente.get(a.cliente_id) ?? 0) + 1)
  }
  let voltaram = 0
  for (const n of porCliente.values()) {
    if (n >= 2) voltaram += 1
  }
  return { agendados, compareceram, finalizaram, pagaram, voltaram }
}

export type EficienciaBarbeiro = {
  id: string
  nome: string
  mediaMin: number
  amostras: number
  acimaMeta: boolean
}

export function eficienciaPorBarbeiro(list: Agendamento[], metaMin = META_TEMPO_CORTE_MIN): EficienciaBarbeiro[] {
  const m = new Map<string, { nome: string; soma: number; n: number }>()
  for (const a of list) {
    const dur = duracaoAtendimentoMinutos(a)
    if (dur == null) continue
    const cur = m.get(a.barbeiro_id) ?? { nome: a.barbeiro?.nome ?? '—', soma: 0, n: 0 }
    cur.soma += dur
    cur.n += 1
    m.set(a.barbeiro_id, cur)
  }
  return [...m.entries()]
    .map(([id, v]) => {
      const mediaMin = v.n > 0 ? v.soma / v.n : 0
      return {
        id,
        nome: v.nome,
        mediaMin,
        amostras: v.n,
        acimaMeta: mediaMin > metaMin,
      }
    })
    .sort((a, b) => b.mediaMin - a.mediaMin)
}

export type HeatmapSemanal = {
  /** Linhas: Seg…Dom; colunas: horaInicio…horaFim. */
  grid: number[][]
  max: number
  horaInicio: number
  horaFim: number
  rowLabels: string[]
}

/** Volume por dia da semana (Seg primeiro) e hora do início do agendamento. Exclui cancelados. */
export function heatmapSemanaHorario(
  list: Agendamento[],
  horaInicio = 8,
  horaFim = 22,
): HeatmapSemanal {
  const cols = Math.max(1, horaFim - horaInicio + 1)
  const grid: number[][] = Array.from({ length: 7 }, () => Array(cols).fill(0))
  for (const a of list) {
    if (a.status === 'cancelado') continue
    const parts = a.data.split('-').map(Number)
    if (parts.length !== 3) continue
    const [y, mo, d] = parts
    const dt = new Date(y, mo - 1, d)
    const dow = dt.getDay()
    const row = dow === 0 ? 6 : dow - 1
    const h = horaDoAgendamento(a.horario)
    if (h < horaInicio || h > horaFim) continue
    grid[row][h - horaInicio] += 1
  }
  const max = Math.max(1, ...grid.flat())
  return {
    grid,
    max,
    horaInicio,
    horaFim,
    rowLabels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  }
}
