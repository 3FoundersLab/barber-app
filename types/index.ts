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

export type BarbeariaStatusCadastro = 'pagamento_pendente' | 'ativa'

export interface Barbearia {
  id: string
  nome: string
  slug: string
  logo?: string
  endereco?: string
  telefone?: string
  email?: string
  /** Self-service até aprovação do super admin; omitido em bases antigas = ativa */
  status_cadastro?: BarbeariaStatusCadastro
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

/** Papel do membro na equipe da barbearia (tabela `barbeiros`). */
export type EquipeFuncao = 'barbeiro' | 'barbeiro_lider' | 'moderador'

export interface Barbeiro {
  id: string
  barbearia_id: string
  user_id?: string
  nome: string
  avatar?: string
  telefone?: string
  email?: string
  ativo: boolean
  /** Bases antigas podem omitir; tratar como `barbeiro`. */
  funcao_equipe?: EquipeFuncao
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

export type AssinaturaStatus = 'pendente' | 'ativa' | 'inadimplente' | 'cancelada'

/** Item de benefício configurável no plano; `ativo` indica se entra na lista pública com check. */
export interface PlanoBeneficio {
  texto: string
  ativo: boolean
}

export interface Plano {
  id: string
  nome: string
  preco_mensal: number
  limite_barbeiros?: number | null
  limite_agendamentos?: number | null
  beneficios?: PlanoBeneficio[] | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export type AssinaturaPeriodicidade = 'mensal' | 'trimestral' | 'semestral' | 'anual'

export interface Assinatura {
  id: string
  barbearia_id: string
  plano_id: string
  status: AssinaturaStatus
  inicio_em: string
  fim_em?: string | null
  /** Ciclo de cobrança; bases antigas podem omitir (tratar como mensal). */
  periodicidade?: AssinaturaPeriodicidade | string | null
  created_at: string
  updated_at: string
  barbearia?: Barbearia
  plano?: Plano
}

/** Status de execução registrado em log de políticas do sistema. */
export type PoliticaSistemaLogStatus = 'sucesso' | 'pendente' | 'erro'

/** Linha de auditoria (cobrança, expiração, renovação, ativação de plano, etc.). */
export interface PoliticaSistemaLog {
  id: string
  created_at: string
  tipo_evento: string
  barbearia_id: string | null
  descricao: string
  status_execucao: PoliticaSistemaLogStatus
  actor_user_id: string | null
  detalhes: Record<string, unknown> | null
  mensagem_erro: string | null
  barbearia?: Pick<Barbearia, 'id' | 'nome'> | null
  actor_profile?: Pick<Profile, 'id' | 'nome' | 'email'> | null
}

/** Tipo de ação registrada em sistema_acoes_log. */
export type SistemaAcaoTipo = 'criacao' | 'edicao' | 'exclusao'

/** Linha de auditoria de ações manuais (super admin). */
export interface SistemaAcaoLog {
  id: string
  created_at: string
  actor_user_id: string | null
  tipo_acao: SistemaAcaoTipo
  entidade: string
  entidade_id: string | null
  entidade_nome: string | null
  resumo_acao: string
  descricao: string | null
  payload_antes: Record<string, unknown> | null
  payload_depois: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  actor_profile?: Pick<Profile, 'id' | 'nome' | 'email'> | null
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

export type { EstoqueNivel, EstoqueProduto, EstoqueStatusFiltro } from './estoque-produto'

export type {
  Comanda,
  ComandaDescontoModo,
  ComandaFormaPagamento,
  ComandaProdutoDraft,
  ComandaProdutoLinha,
  ComandaServicoDraft,
  ComandaServicoLinha,
  ComandaStatus,
} from './comanda'

// Navigation
export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}
