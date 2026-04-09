export function labelAssinaturaStatus(status: string): string {
  const map: Record<string, string> = {
    pendente: 'Pagamento pendente',
    ativa: 'Ativa',
    inadimplente: 'Inadimplente',
    cancelada: 'Cancelada',
  }
  return map[status] ?? status
}
