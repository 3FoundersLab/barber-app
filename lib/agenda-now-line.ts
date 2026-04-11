/** Chave do dia local `YYYY-MM-DD` (igual à grade de agendamentos). */
export function agendaLocalDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Posição vertical da linha “agora” dentro da área da timeline (sem cabeçalho de coluna),
 * em pixels desde o topo do bloco da grade.
 */
export function getAgendaNowLineTopPx(
  now: Date,
  referenceDayKey: string | null,
  dayStartMin: number,
  dayEndMin: number,
  slotMinutes: number,
  rowHeightPx: number,
): number | null {
  if (referenceDayKey == null) return null
  if (agendaLocalDayKey(now) !== referenceDayKey) return null
  const precise = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  if (precise < dayStartMin || precise >= dayEndMin) return null
  return ((precise - dayStartMin) / slotMinutes) * rowHeightPx
}
