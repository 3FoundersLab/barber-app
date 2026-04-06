import type { Plano, PlanoBeneficio } from '@/types'

export function parsePlanoBeneficios(raw: unknown): PlanoBeneficio[] {
  if (!Array.isArray(raw)) return []
  const out: PlanoBeneficio[] = []
  for (const item of raw) {
    if (item == null || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const texto =
      typeof o.texto === 'string' ? o.texto : typeof o.text === 'string' ? o.text : ''
    out.push({ texto, ativo: Boolean(o.ativo) })
  }
  return out
}

export function beneficiosAtivosTexto(list: PlanoBeneficio[]): string[] {
  return list.filter((b) => b.ativo && b.texto.trim()).map((b) => b.texto.trim())
}

function legacyLinhasResumo(plano: Pick<Plano, 'limite_barbeiros' | 'limite_agendamentos'>): string[] {
  const lines: string[] = []
  if (plano.limite_barbeiros != null) {
    lines.push(`Até ${plano.limite_barbeiros} barbeiros`)
  }
  if (plano.limite_agendamentos != null) {
    lines.push(`Até ${plano.limite_agendamentos} agendamentos`)
  }
  return lines
}

/** Textos a exibir como benefícios do plano (ativos); fallback para limites legados se a lista nova estiver vazia. */
export function linhasBeneficiosPlano(plano: Plano): string[] {
  const fromDb = beneficiosAtivosTexto(parsePlanoBeneficios(plano.beneficios))
  if (fromDb.length > 0) return fromDb
  return legacyLinhasResumo(plano)
}
