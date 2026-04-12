/** Classificação heurística do nome do serviço para mix de receita (agendamentos concluídos). */
export function classificarServicoReceita(nome: string | undefined): 'cortes' | 'barbas' | 'outros' {
  const n = (nome ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (n.includes('barba')) return 'barbas'
  if (n.includes('corte') || n.includes('hair') || n.includes('cabelo') || n.includes('pezinho'))
    return 'cortes'
  return 'outros'
}
