import { parseAgendaClockToMinutes } from '@/lib/constants'

type AppointmentLike = {
  horario: string
  servico?: {
    duracao?: number | null
  } | null
}

const DEFAULT_APPOINTMENT_DURATION_MIN = 30
const MIN_SERVICE_DURATION_MIN = 5

function normalizeClockLabel(value: string): string {
  const parsed = parseAgendaClockToMinutes(value)
  if (parsed == null) return value
  const hh = String(Math.floor(parsed / 60)).padStart(2, '0')
  const mm = String(parsed % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

function normalizeDurationMinutes(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(MIN_SERVICE_DURATION_MIN, Math.floor(value))
}

export function listAvailableStartSlots(params: {
  slotStrings: string[]
  dayStart: string
  dayEnd: string
  targetDurationMinutes: number
  appointments: AppointmentLike[]
  enforceDurationOverlap?: boolean
}): string[] {
  const {
    slotStrings,
    dayStart,
    dayEnd,
    targetDurationMinutes,
    appointments,
    enforceDurationOverlap = true,
  } = params
  const dayStartMin = parseAgendaClockToMinutes(dayStart)
  const dayEndMin = parseAgendaClockToMinutes(dayEnd)
  if (dayStartMin == null || dayEndMin == null || dayEndMin <= dayStartMin) return []

  const targetDuration = normalizeDurationMinutes(targetDurationMinutes, DEFAULT_APPOINTMENT_DURATION_MIN)
  const occupiedStartSlots = new Set(
    appointments
      .map((appointment) => normalizeClockLabel(appointment.horario))
      .filter((label) => /^\d{2}:\d{2}$/.test(label)),
  )
  const occupiedRanges = appointments
    .map((appointment) => {
      const start = parseAgendaClockToMinutes(appointment.horario)
      if (start == null) return null
      const duration = normalizeDurationMinutes(
        appointment.servico?.duracao,
        DEFAULT_APPOINTMENT_DURATION_MIN,
      )
      return { start, end: start + duration }
    })
    .filter((range): range is { start: number; end: number } => range != null)

  return slotStrings.filter((slot) => {
    const start = parseAgendaClockToMinutes(slot)
    if (start == null) return false
    if (occupiedStartSlots.has(normalizeClockLabel(slot))) return false
    const end = start + targetDuration
    if (start < dayStartMin || end > dayEndMin) return false
    if (!enforceDurationOverlap) return true
    return occupiedRanges.every((busy) => end <= busy.start || start >= busy.end)
  })
}
