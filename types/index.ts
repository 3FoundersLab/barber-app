// BarberTool - Types

// Roles
export type UserRole = 'super_admin' | 'admin' | 'barbeiro' | 'cliente'

// Status
export type AppointmentStatus = 'agendado' | 'concluido' | 'cancelado' | 'faltou'
export type PaymentStatus = 'pendente' | 'pago'

// Entities
export interface Profile {
  id: string
  nome: string
  email: string
  telefone?: string
  avatar?: string
  role: UserRole
  /** false = conta desativada pelo super admin; omitido em bases antigas = ativo */
  ativo?: boolean
  created_at: string
  updated_at: string
}

export interface Barbearia {
  id: string
  nome: string
  slug: string
  logo?: string
  endereco?: string
  telefone?: string
  email?: string
  /** false = desativada pelo super admin; omitido em bases antigas = ativa */
  ativo?: boolean
  created_at: string
  updated_at: string
}

export interface BarbeariaUser {
  id: string
  barbearia_id: string
  user_id: string
  role: UserRole
  created_at: string
  // Relacionamentos
  profile?: Profile
  barbearia?: Barbearia
}

export interface Servico {
  id: string
  barbearia_id: string
  nome: string
  descricao?: string
  preco: number
  duracao: number // minutos
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Barbeiro {
  id: string
  barbearia_id: string
  user_id?: string
  nome: string
  avatar?: string
  telefone?: string
  email?: string
  ativo: boolean
  created_at: string
  updated_at: string
  // Relacionamentos
  profile?: Profile
}

export interface Cliente {
  id: string
  barbearia_id: string
  user_id?: string
  nome: string
  telefone: string
  email?: string
  notas?: string
  created_at: string
  updated_at: string
  // Relacionamentos
  profile?: Profile
}

export interface Agendamento {
  id: string
  barbearia_id: string
  cliente_id: string
  barbeiro_id: string
  servico_id: string
  data: string
  horario: string
  status: AppointmentStatus
  status_pagamento: PaymentStatus
  valor: number
  observacoes?: string
  created_at: string
  updated_at: string
  // Relacionamentos (para exibição)
  cliente?: Cliente
  barbeiro?: Barbeiro
  servico?: Servico
}

export interface HorarioTrabalho {
  id: string
  barbeiro_id: string
  dia_semana: number // 0 = domingo, 6 = sábado
  hora_inicio: string
  hora_fim: string
  ativo: boolean
  created_at: string
}

export type AssinaturaStatus = 'pendente' | 'ativa' | 'trial' | 'inadimplente' | 'cancelada'

export interface Plano {
  id: string
  nome: string
  preco_mensal: number
  limite_barbeiros?: number | null
  limite_agendamentos?: number | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Assinatura {
  id: string
  barbearia_id: string
  plano_id: string
  status: AssinaturaStatus
  inicio_em: string
  fim_em?: string | null
  created_at: string
  updated_at: string
  barbearia?: Barbearia
  plano?: Plano
}

// Auth Context
export interface AuthUser {
  id: string
  email: string
  profile?: Profile
  barbeariaUsers?: BarbeariaUser[]
}

// API Response
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

// List State
export interface ListState<T> {
  items: T[]
  isLoading: boolean
  error: string | null
  isEmpty: boolean
}

// Navigation
export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}
