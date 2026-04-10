import type { AgendaUnavailableBlock } from '@/lib/agenda-unavailable'
import type { Agendamento, Barbeiro, Cliente, Servico } from '@/types'

const BID = {
  gabriel: 'demo-barb-1',
  fernando: 'demo-barb-2',
  pedro: 'demo-barb-3',
  lucas: 'demo-barb-4',
} as const

const demoBarbeiros: Barbeiro[] = [
  {
    id: BID.gabriel,
    barbearia_id: 'demo-bb',
    nome: 'Gabriel',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop',
    ativo: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: BID.fernando,
    barbearia_id: 'demo-bb',
    nome: 'Fernando',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop',
    ativo: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: BID.pedro,
    barbearia_id: 'demo-bb',
    nome: 'Pedro',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop',
    ativo: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: BID.lucas,
    barbearia_id: 'demo-bb',
    nome: 'Lucas',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=128&h=128&fit=crop',
    ativo: true,
    created_at: '',
    updated_at: '',
  },
]

function servico(partial: Pick<Servico, 'id' | 'nome' | 'duracao'>): Servico {
  return {
    barbearia_id: 'demo-bb',
    preco: 0,
    ativo: true,
    created_at: '',
    updated_at: '',
    ...partial,
  }
}

function cliente(partial: Pick<Cliente, 'id' | 'nome'>): Cliente {
  return {
    barbearia_id: 'demo-bb',
    telefone: '',
    created_at: '',
    updated_at: '',
    ...partial,
  }
}

/**
 * Dados fictícios para demonstração do calendário (4 profissionais, durações 30–50 min, almoço).
 * `data` deve ser `YYYY-MM-DD`.
 */
export function getAgendaDemoForDate(data: string): {
  barbeiros: Barbeiro[]
  agendamentos: Agendamento[]
  unavailable: AgendaUnavailableBlock[]
} {
  const agendamentos: Agendamento[] = [
    {
      id: 'demo-a1',
      barbearia_id: 'demo-bb',
      cliente_id: 'demo-c1',
      barbeiro_id: BID.gabriel,
      servico_id: 'demo-s1',
      data,
      horario: '09:00',
      status: 'agendado',
      status_pagamento: 'pendente',
      valor: 0,
      created_at: '',
      updated_at: '',
      cliente: cliente({ id: 'demo-c1', nome: 'Ricardo Almeida' }),
      servico: servico({ id: 'demo-s1', nome: 'Corte masculino', duracao: 40 }),
    },
    {
      id: 'demo-a2',
      barbearia_id: 'demo-bb',
      cliente_id: 'demo-c2',
      barbeiro_id: BID.gabriel,
      servico_id: 'demo-s2',
      data,
      horario: '11:10',
      status: 'agendado',
      status_pagamento: 'pago',
      valor: 0,
      created_at: '',
      updated_at: '',
      cliente: cliente({ id: 'demo-c2', nome: 'Felipe Nunes' }),
      servico: servico({ id: 'demo-s2', nome: 'Barba + máquina', duracao: 35 }),
    },
    {
      id: 'demo-a3',
      barbearia_id: 'demo-bb',
      cliente_id: 'demo-c3',
      barbeiro_id: BID.gabriel,
      servico_id: 'demo-s3',
      data,
      horario: '15:00',
      status: 'agendado',
      status_pagamento: 'pendente',
      valor: 0,
      created_at: '',
      updated_at: '',
      cliente: cliente({ id: 'demo-c3', nome: 'Marcos Vieira' }),
      servico: servico({ id: 'demo-s3', nome: 'Combo completo', duracao: 50 }),
    },
    {
      id: 'demo-a4',
      barbearia_id: 'demo-bb',
      cliente_id: 'demo-c4',
      barbeiro_id: BID.fernando,
      servico_id: 'demo-s4',
      data,
      horario: '09:30',
      status: 'agendado',
      status_pagamento: 'pago',
      valor: 0,
      created_at: '',
      updated_at: '',
      cliente: cliente({ id: 'demo-c4', nome: 'André Costa' }),
      servico: servico({ id: 'demo-s4', nome: 'Degradê na máquina', duracao: 45 }),
    },
    {
      id: 'demo-a5',
      barbearia_id: 'demo-bb',
      cliente_id: 'demo-c5',
      barbeiro_id: BID.fernando,
      servico_id: 'demo-s5',
      data,
      horario: '14:00',
      status: 'agendado',
      status_pagamento: 'pendente',
      valor: 0,
      created_at: '',
      updated_at: '',
      cliente: cliente({ id: 'demo-c5', nome: 'Bruno Silva' }),
      servico: servico({ id: 'demo-s5', nome: 'Corte + sobrancelha', duracao: 30 }),
    },
    {
      id: 'demo-a6',
      barbearia_id: 'demo-bb',
      cliente_id: 'demo-c6',
      barbeiro_id: BID.fernando,
      servico_id: 'demo-s6',
      data,
      horario: '16:20',
      status: 'agendado',
      status_pagamento: 'pago',
      valor: 0,
      created_at: '',
      updated_at: '',
      cliente: cliente({ id: 'demo-c6', nome: 'Caio Rocha' }),
      servico: servico({ id: 'demo-s6', nome: 'Barba desenhada', duracao: 35 }),
    },
    {
      id: 'demo-a7',
      barbearia_id: 'demo-bb',
      cliente_id: 'demo-c7',
      barbeiro_id: BID.pedro,
      servico_id: 'demo-s7',
      data,
      horario: '10:00',
      status: 'agendado',
      status_pagamento: 'pendente',
      valor: 0,
      created_at: '',
      updated_at: '',
      cliente: cliente({ id: 'demo-c7', nome: 'Diego Martins' }),
      servico: servico({ id: 'demo-s7', nome: 'Corte infantil', duracao: 30 }),
    },
    {
      id: 'demo-a8',
      barbearia_id: 'demo-bb',
      cliente_id: 'demo-c8',
      barbeiro_id: BID.pedro,
      servico_id: 'demo-s8',
      data,
      horario: '13:30',
      status: 'agendado',
      status_pagamento: 'pago',
      valor: 0,
      created_at: '',
      updated_at: '',
      cliente: cliente({ id: 'demo-c8', nome: 'Eduardo Lima' }),
      servico: servico({ id: 'demo-s8', nome: 'Luzes / mechas', duracao: 50 }),
    },
    {
      id: 'demo-a9',
      barbearia_id: 'demo-bb',
      cliente_id: 'demo-c9',
      barbeiro_id: BID.pedro,
      servico_id: 'demo-s1',
      data,
      horario: '17:00',
      status: 'agendado',
      status_pagamento: 'pendente',
      valor: 0,
      created_at: '',
      updated_at: '',
      cliente: cliente({ id: 'demo-c9', nome: 'Gustavo Reis' }),
      servico: servico({ id: 'demo-s1', nome: 'Corte masculino', duracao: 40 }),
    },
    {
      id: 'demo-a10',
      barbearia_id: 'demo-bb',
      cliente_id: 'demo-c10',
      barbeiro_id: BID.lucas,
      servico_id: 'demo-s9',
      data,
      horario: '09:00',
      status: 'agendado',
      status_pagamento: 'pago',
      valor: 0,
      created_at: '',
      updated_at: '',
      cliente: cliente({ id: 'demo-c10', nome: 'Henrique Dias' }),
      servico: servico({ id: 'demo-s9', nome: 'Pezinho na máquina', duracao: 30 }),
    },
    {
      id: 'demo-a11',
      barbearia_id: 'demo-bb',
      cliente_id: 'demo-c11',
      barbeiro_id: BID.lucas,
      servico_id: 'demo-s2',
      data,
      horario: '11:40',
      status: 'agendado',
      status_pagamento: 'pendente',
      valor: 0,
      created_at: '',
      updated_at: '',
      cliente: cliente({ id: 'demo-c11', nome: 'Igor Pires' }),
      servico: servico({ id: 'demo-s2', nome: 'Barba + máquina', duracao: 40 }),
    },
    {
      id: 'demo-a12',
      barbearia_id: 'demo-bb',
      cliente_id: 'demo-c12',
      barbeiro_id: BID.lucas,
      servico_id: 'demo-s3',
      data,
      horario: '15:30',
      status: 'concluido',
      status_pagamento: 'pago',
      valor: 0,
      created_at: '',
      updated_at: '',
      cliente: cliente({ id: 'demo-c12', nome: 'João Pedro' }),
      servico: servico({ id: 'demo-s3', nome: 'Combo completo', duracao: 45 }),
    },
  ]

  const unavailable: AgendaUnavailableBlock[] = [
    { barbeiroId: BID.gabriel, start: '12:00', end: '13:00', label: 'Almoço' },
    { barbeiroId: BID.fernando, start: '12:30', end: '13:30', label: 'Almoço' },
    { barbeiroId: BID.pedro, start: '12:00', end: '12:40', label: 'Almoço' },
    { barbeiroId: BID.lucas, start: '13:00', end: '14:00', label: 'Indisponível' },
  ]

  return { barbeiros: demoBarbeiros, agendamentos, unavailable }
}

/** Profissionais do cenário de demonstração (Gabriel, Fernando, Pedro, Lucas). */
export function getAgendaDemoBarbeiros(): Barbeiro[] {
  return demoBarbeiros
}

/**
 * Mesmo padrão de agendamentos do dia de exemplo, replicado para cada dia do mês,
 * com ids únicos por data (para lista, calendário mensal e grade).
 */
export function getAgendaDemoAgendamentosForMonth(
  year: number,
  monthIndex0: number,
): Agendamento[] {
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  const m = pad(monthIndex0 + 1)
  const out: Agendamento[] = []
  for (let day = 1; day <= lastDay; day++) {
    const data = `${year}-${m}-${pad(day)}`
    const slice = getAgendaDemoForDate(data).agendamentos.map((a) => ({
      ...a,
      id: `${a.id}__${data}`,
      cliente_id: `${a.cliente_id}__${data}`,
      cliente: a.cliente ? { ...a.cliente, id: `${a.cliente.id}__${data}` } : undefined,
    }))
    out.push(...slice)
  }
  return out
}

/** Indisponibilidades (almoço etc.) do demo — iguais para qualquer dia. */
export function getAgendaDemoUnavailableBlocks(): AgendaUnavailableBlock[] {
  return getAgendaDemoForDate('2000-01-01').unavailable
}
