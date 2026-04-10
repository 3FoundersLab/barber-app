// BarberTool - Constants

import type { AppointmentStatus, PaymentStatus, UserRole } from '@/types'

// Status Labels
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  agendado: 'Agendado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  faltou: 'Faltou',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  barbeiro: 'Barbeiro',
  cliente: 'Cliente',
}

// Status Colors (Tailwind classes)
export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, { bg: string; text: string }> = {
  agendado: { bg: 'bg-accent/20', text: 'text-accent-foreground' },
  concluido: { bg: 'bg-success/20', text: 'text-success' },
  cancelado: { bg: 'bg-destructive/20', text: 'text-destructive' },
  faltou: { bg: 'bg-warning/20', text: 'text-warning-foreground' },
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string }> = {
  pendente: { bg: 'bg-warning/20', text: 'text-warning-foreground' },
  pago: { bg: 'bg-success/20', text: 'text-success' },
}

// Dias da Semana
export const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

export const DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Horários padrão
export const HORARIOS_PADRAO = {
  inicio: '09:00',
  fim: '19:00',
  intervalo: 30, // minutos
}

// Formatação de moeda
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Formatação de data
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(d)
}

/** Ex.: "Quarta-feira, 08 de jan. de 2026" — para cabeçalho da agenda diária. */
export function formatDateWeekdayLong(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const raw = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function formatTime(time: string): string {
  return time.slice(0, 5) // HH:MM
}

// Duração em texto
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

// Rotas iniciais por role (URLs sem segmento de papel; admin usa `/painel` para resolver slug)
export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  super_admin: '/dashboard',
  admin: '/painel',
  barbeiro: '/agenda',
  cliente: '/inicio',
}

// API Endpoints base
export const API_ENDPOINTS = {
  agendamentos: '/api/agendamentos',
  servicos: '/api/servicos',
  barbeiros: '/api/barbeiros',
  clientes: '/api/clientes',
  barbearias: '/api/barbearias',
}
