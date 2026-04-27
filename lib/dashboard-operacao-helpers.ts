import { HORARIOS_PADRAO } from '@/lib/constants'
import { parseHorarioToMinutes } from '@/lib/build-admin-dashboard-status-hoje'
import type { Barbearia } from '@/types'

/** Capacidade teórica de “slots” (intervalo fixo) × barbeiros na escala, menos ocupados. */
export function estimarSlotsVagosHoje(
  barbearia: Barbearia,
  nBarbeirosEscalados: number,
  ocupados: number,
  intervaloMin = 30,
): number {
  const n = Math.max(0, Math.round(nBarbeirosEscalados))
  if (n <= 0) return 0
  const openM = parseHorarioToMinutes(barbearia.horario_abertura ?? HORARIOS_PADRAO.inicio)
  const closeM = parseHorarioToMinutes(barbearia.horario_fechamento ?? HORARIOS_PADRAO.fim)
  if (openM == null || closeM == null) return 0
  const span = Math.max(0, closeM - openM)
  const slotsPorProf = Math.max(0, Math.floor(span / intervaloMin))
  const teorico = slotsPorProf * n
  return Math.max(0, teorico - Math.max(0, ocupados))
}
