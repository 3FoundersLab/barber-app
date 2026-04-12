import type { RelatorioCompleto } from '@/types/relatorios'

/** IDs fictícios (formato UUID) só para testes de UI. */
const B1 = '10000000-0000-4000-8000-000000000001'
const B2 = '10000000-0000-4000-8000-000000000002'
const B3 = '10000000-0000-4000-8000-000000000003'
const B4 = '10000000-0000-4000-8000-000000000004'

function diasAbril2026(): { label: string; valor: number; data: Date; categoria: string }[] {
  const out: { label: string; valor: number; data: Date; categoria: string }[] = []
  const valores = [1200, 1350, 980, 1420, 1100, 1280, 990, 1500, 1180, 1300]
  for (let d = 1; d <= 10; d++) {
    out.push({
      label: `${String(d).padStart(2, '0')}/04`,
      valor: valores[d - 1] ?? 1000,
      data: new Date(2026, 3, d),
      categoria: 'servicos',
    })
  }
  return out
}

/** Dados fictícios para testes de componentes, PDF e storybook. */
export const mockRelatorio: RelatorioCompleto = {
  periodo: {
    inicio: new Date(2026, 3, 1),
    fim: new Date(2026, 3, 10),
  },
  kpis: [
    {
      id: '1',
      titulo: 'Faturamento',
      valor: 12450,
      formato: 'moeda',
      variacao: 23,
      tendencia: 'up',
      icone: 'DollarSign',
      cor: 'amber',
    },
    {
      id: '2',
      titulo: 'Atendimentos',
      valor: 847,
      formato: 'numero',
      variacao: 15,
      tendencia: 'up',
      icone: 'Users',
      cor: 'blue',
    },
    {
      id: '3',
      titulo: 'Ocupação',
      valor: 94,
      formato: 'percentual',
      variacao: 5,
      tendencia: 'up',
      icone: 'Calendar',
      cor: 'green',
    },
    {
      id: '4',
      titulo: 'Ticket Médio',
      valor: 147,
      formato: 'moeda',
      variacao: 8,
      tendencia: 'up',
      icone: 'TrendingUp',
      cor: 'purple',
    },
    {
      id: '5',
      titulo: 'Novos Clientes',
      valor: 12,
      formato: 'numero',
      variacao: -5,
      tendencia: 'down',
      icone: 'UserPlus',
      cor: 'red',
    },
  ],
  faturamentoDiario: diasAbril2026(),
  mixReceita: [
    { label: 'Cortes', valor: 45, categoria: 'servicos' },
    { label: 'Barbas', valor: 25, categoria: 'servicos' },
    { label: 'Produtos', valor: 20, categoria: 'produtos' },
    { label: 'Outros', valor: 10, categoria: 'servicos' },
  ],
  ocupacaoHeatmap: (() => {
    const dias = ['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04', '2026-04-05']
    const horasPico = [9, 10, 11, 14, 15, 16, 17, 18]
    const células: { dia: string; hora: number; intensidade: number }[] = []
    for (const dia of dias) {
      for (let h = 0; h < 24; h++) {
        const base = horasPico.includes(h) ? 55 + (h % 5) * 8 : 12 + (h % 7) * 3
        células.push({ dia, hora: h, intensidade: Math.min(100, base + (dia.charCodeAt(8) % 10)) })
      }
    }
    return células
  })(),
  horariosPico: [
    { label: '9h', valor: 42, categoria: 'agendamentos' },
    { label: '10h', valor: 58, categoria: 'agendamentos' },
    { label: '11h', valor: 51, categoria: 'agendamentos' },
    { label: '14h', valor: 38, categoria: 'agendamentos' },
    { label: '15h', valor: 45, categoria: 'agendamentos' },
    { label: '16h', valor: 49, categoria: 'agendamentos' },
    { label: '17h', valor: 44, categoria: 'agendamentos' },
    { label: '18h', valor: 36, categoria: 'agendamentos' },
  ],
  rankingBarbeiros: [
    {
      posicao: 1,
      barbeiroId: B1,
      nome: 'João Pedro',
      foto: undefined,
      faturamento: 8450,
      atendimentos: 156,
      ticketMedio: 54,
      avaliacao: 4.9,
      clientesRetidos: 89,
    },
    {
      posicao: 2,
      barbeiroId: B2,
      nome: 'Marcos Silva',
      faturamento: 7230,
      atendimentos: 142,
      ticketMedio: 51,
      avaliacao: 4.8,
      clientesRetidos: 76,
    },
    {
      posicao: 3,
      barbeiroId: B3,
      nome: 'Ricardo Alves',
      faturamento: 6120,
      atendimentos: 128,
      ticketMedio: 48,
      avaliacao: 4.7,
      clientesRetidos: 62,
    },
    {
      posicao: 4,
      barbeiroId: B4,
      nome: 'Felipe Costa',
      faturamento: 4980,
      atendimentos: 105,
      ticketMedio: 47,
      avaliacao: 4.6,
      clientesRetidos: 51,
    },
  ],
  segmentacaoClientes: [
    {
      segmento: 'vip',
      quantidade: 48,
      percentual: 12,
      valorMedio: 185,
      descricao: 'Alta frequência e ticket elevado nos últimos 90 dias.',
    },
    {
      segmento: 'novo',
      quantidade: 32,
      percentual: 8,
      valorMedio: 92,
      descricao: 'Primeira visita ou cadastro recente.',
    },
    {
      segmento: 'emRisco',
      quantidade: 24,
      percentual: 6,
      valorMedio: 110,
      descricao: 'Sem retorno há mais de 45 dias com histórico relevante.',
    },
    {
      segmento: 'ocasional',
      quantidade: 210,
      percentual: 52,
      valorMedio: 78,
      descricao: 'Visitas esporádicas.',
    },
    {
      segmento: 'inativo',
      quantidade: 88,
      percentual: 22,
      valorMedio: 0,
      descricao: 'Sem visitas concluídas no período analisado.',
    },
  ],
  produtosTop: [
    { label: 'Pomada matte', valor: 86, categoria: 'unidades' },
    { label: 'Óleo para barba', valor: 64, categoria: 'unidades' },
    { label: 'Shampoo premium', valor: 52, categoria: 'unidades' },
    { label: 'Cera modeladora', valor: 41, categoria: 'unidades' },
    { label: 'Spray fixador', valor: 33, categoria: 'unidades' },
  ],
  alertas: [
    {
      tipo: 'positivo',
      titulo: 'Vendas de produtos em alta',
      descricao: 'Crescimento de 23% nas vendas de produtos este mês.',
      valor: 23,
    },
    {
      tipo: 'alerta',
      titulo: 'Cancelamentos nas terças',
      descricao: 'Taxa de cancelamento aumentou 8% nas terças-feiras.',
      valor: 8,
      acaoRecomendada: 'Verificar disponibilidade de barbeiros às terças.',
    },
    {
      tipo: 'oportunidade',
      titulo: 'Clientes da manhã compram mais',
      descricao: 'Clientes que agendam pela manhã têm 15% mais chance de comprar produtos.',
      valor: 15,
    },
  ],
  comparativoPeriodoAnterior: {
    faturamento: 10120,
    atendimentos: 736,
  },
}
