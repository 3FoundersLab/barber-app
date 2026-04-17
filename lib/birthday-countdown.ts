/**
 * Dias entre o início do dia local `ref` e a próxima ocorrência do aniversário (mês/dia).
 * 0 = hoje é o aniversário. `null` se a string não for uma data ISO (YYYY-MM-DD) válida.
 */
export function daysUntilNextBirthday(birthYmd: string, ref = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthYmd.trim())
  if (!m) return null
  const month = Number(m[2])
  let day = Number(m[3])
  const refY = ref.getFullYear()
  const refM = ref.getMonth()
  const refD = ref.getDate()
  const startToday = new Date(refY, refM, refD).getTime()

  const birthdayTs = (year: number) => {
    let d = day
    if (month === 2 && d === 29) {
      const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
      if (!leap) d = 28
    }
    return new Date(year, month - 1, d).getTime()
  }

  let y = refY
  let bt = birthdayTs(y)
  if (bt < startToday) {
    y += 1
    bt = birthdayTs(y)
  }
  return Math.round((bt - startToday) / 86400000)
}

export type AniversarioEquipeRow = {
  nome: string
  telefone?: string | null
  data_nascimento?: string | null
}

/** Inclui hoje até `diasAntes` dias antes do aniversário (ex.: 3 → janela de 4 dias incluindo o dia do bolo). */
export function listAniversariosEquipeNaJanela(
  rows: AniversarioEquipeRow[],
  diasAntes = 3,
  ref = new Date(),
): { nome: string; telefone: string | null; diasRestantes: number }[] {
  const out: { nome: string; telefone: string | null; diasRestantes: number }[] = []
  for (const r of rows) {
    const raw = typeof r.data_nascimento === 'string' ? r.data_nascimento.trim() : ''
    if (!raw) continue
    const d = daysUntilNextBirthday(raw, ref)
    if (d == null || d < 0 || d > diasAntes) continue
    out.push({
      nome: r.nome,
      telefone: (r.telefone as string | null | undefined) ?? null,
      diasRestantes: d,
    })
  }
  return out.sort((a, b) => a.diasRestantes - b.diasRestantes || a.nome.localeCompare(b.nome, 'pt-BR'))
}
