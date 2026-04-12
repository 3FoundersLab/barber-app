import { endOfDay, startOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export type RelatorioPeriodoPreset =
  | 'hoje'
  | 'ontem'
  | '7d'
  | '30d'
  | 'mes'
  | 'mes_anterior'
  | 'personalizado'

/** Quantidade de dias de calendário local (início e fim inclusivos). */
export function diasCalendarioInclusivo(inicio: Date, fim: Date): number {
  const s = startOfDay(inicio).getTime()
  const e = startOfDay(fim).getTime()
  return Math.max(1, Math.round((e - s) / 86400000) + 1)
}

/** Chave `YYYY-MM-DD` em horário local. */
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function intervaloPorPreset(
  preset: RelatorioPeriodoPreset,
  personalizadoInicio: Date | null,
  personalizadoFim: Date | null,
  referencia: Date = new Date(),
): { inicio: Date; fim: Date } {
  const ref = startOfDay(referencia)
  if (preset === 'personalizado' && personalizadoInicio && personalizadoFim) {
    const ini = startOfDay(personalizadoInicio)
    const f = endOfDay(personalizadoFim)
    if (ini.getTime() <= f.getTime()) {
      return { inicio: ini, fim: f }
    }
  }
  if (preset === 'hoje') {
    return { inicio: startOfDay(ref), fim: endOfDay(ref) }
  }
  if (preset === 'ontem') {
    const o = subDays(ref, 1)
    return { inicio: startOfDay(o), fim: endOfDay(o) }
  }
  if (preset === '7d') {
    const fim = endOfDay(ref)
    return { inicio: startOfDay(subDays(fim, 6)), fim }
  }
  if (preset === '30d') {
    const fim = endOfDay(ref)
    return { inicio: startOfDay(subDays(fim, 29)), fim }
  }
  if (preset === 'mes') {
    return { inicio: startOfMonth(ref), fim: endOfMonth(ref) }
  }
  if (preset === 'mes_anterior') {
    const m = subMonths(ref, 1)
    return { inicio: startOfMonth(m), fim: endOfMonth(m) }
  }
  if (preset === 'personalizado') {
    const fim = endOfDay(ref)
    return { inicio: startOfDay(subDays(fim, 6)), fim }
  }
  const fim = endOfDay(ref)
  return { inicio: startOfDay(subDays(fim, 6)), fim }
}

/** Texto curto após a variação percentual nos KPIs. */
export function textoComparativoKpi(inicioAtual: Date, fimAtual: Date): string {
  return diasCalendarioInclusivo(inicioAtual, fimAtual) === 1 ? 'vs ontem' : 'vs período anterior'
}

/** Intervalo anterior com a mesma quantidade de dias (calendário local), imediatamente antes de `inicio`. */
export function intervaloAnteriorComparacao(inicio: Date, fim: Date): { inicio: Date; fim: Date } {
  const start = startOfDay(inicio)
  const end = endOfDay(fim)
  const ms = 86400000
  const dias = Math.max(1, Math.round((end.getTime() - start.getTime()) / ms) + 1)
  const fimAnterior = endOfDay(subDays(start, 1))
  const inicioAnterior = startOfDay(subDays(fimAnterior, dias - 1))
  return { inicio: inicioAnterior, fim: fimAnterior }
}
