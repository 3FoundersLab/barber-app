/** Faixa em que um profissional não atende (almoço, folga, etc.). Horários `HH:MM`. */
export type AgendaUnavailableBlock = {
  barbeiroId: string
  start: string
  end: string
  label?: string
}
