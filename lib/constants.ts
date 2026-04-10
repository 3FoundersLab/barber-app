// BarberTool - Constants

import type { AppointmentStatus, PaymentStatus, UserRole } from '@/types'

// Status Labels
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  agendado: 'Agendado',
  em_atendimento: 'Em atendimento',
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
  em_atendimento: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-900 dark:text-emerald-100',
  },
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

// Horários padrão da grade / formulário de agendamento (dia completo, slot configurável)
export const HORARIOS_PADRAO = {
  /** Eixo da grade do dia (24 h). */
  inicio: '00:00',
  fim: '24:00',
  intervalo: 15, // minutos (grade e opções de horário no admin)
  /** Valor inicial do seletor ao criar agendamento (a grade continua 24 h). */
  sugestaoNovoHorario: '09:00',
}

/**
 * Converte "HH:mm", ISO parcial ou "24:00" em minutos desde meia-noite.
 * "24:00" → 1440 (fim exclusivo do eixo do dia).
 */
export function parseAgendaClockToMinutes(t: string): number | null {
  if (!t || typeof t !== 'string') return null
  let s = t.trim()
  const tIdx = s.indexOf('T')
  if (tIdx !== -1) s = s.slice(tIdx + 1)
  const match = s.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  if (h === 24 && m === 0) return 24 * 60
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return h * 60 + m
}

/** Gera rótulos HH:mm entre início e fim (fim exclusivo), passo fixo em minutos. */
export function buildAgendaSlotStrings(inicio: string, fim: string, stepMinutes: number): string[] {
  const start = parseAgendaClockToMinutes(inicio)
  const end = parseAgendaClockToMinutes(fim)
  if (start == null || end == null || end <= start) return []
  const step = Math.max(5, Math.min(60, stepMinutes))
  let cur = start
  const out: string[] = []
  while (cur < end) {
    const hh = Math.floor(cur / 60)
    const mm = cur % 60
    out.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
    cur += step
  }
  return out
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
