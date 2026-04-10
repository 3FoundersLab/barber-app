import type { Barbeiro, EquipeFuncao } from '@/types'

export type { EquipeFuncao }

export const EQUIPE_FUNCAO_OPTIONS: { value: EquipeFuncao; label: string }[] = [
  { value: 'barbeiro', label: 'Barbeiro' },
  { value: 'barbeiro_lider', label: 'Barbeiro Líder' },
  { value: 'moderador', label: 'Moderador' },
]

export function parseEquipeFuncao(value: string | null | undefined): EquipeFuncao {
  if (value === 'moderador' || value === 'barbeiro_lider' || value === 'barbeiro') {
    return value
  }
  return 'barbeiro'
}

export function labelEquipeFuncao(funcao: EquipeFuncao | null | undefined): string {
  const key = parseEquipeFuncao(funcao ?? undefined)
  return EQUIPE_FUNCAO_OPTIONS.find((o) => o.value === key)?.label ?? 'Barbeiro'
}

/** Profissionais que aparecem na escolha de barbeiro no agendamento. */
export function isBarbeiroAgendavel(b: Pick<Barbeiro, 'funcao_equipe'>): boolean {
  return b.funcao_equipe !== 'moderador'
}
