'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronsUpDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  buildAgendaSlotStrings,
  HORARIOS_PADRAO,
  parseAgendaClockToMinutes,
  resolveBarbeariaAgendaTimeRange,
} from '@/lib/constants'
import { listAvailableStartSlots } from '@/lib/agenda-availability'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { cn } from '@/lib/utils'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import type { Agendamento, Barbeiro, Cliente, Servico } from '@/types'

function formatYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function normalizeHorarioLabel(h: string, fallback: string): string {
  if (!h) return fallback
  const s = h.includes('T') ? (h.split('T')[1] ?? h) : h
  const match = /^(\d{1,2}):(\d{2})/.exec(s)
  if (!match) return fallback
  return `${match[1]!.padStart(2, '0')}:${match[2]}`
}

export interface AppointmentAdminFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  barbeariaId: string | null
  barbeiros: Barbeiro[]
  /** Data inicial do formulário (modo criar). */
  initialDate: Date
  /** Se definido, o diálogo entra em modo edição. */
  editing: Agendamento | null
  /** Barbeiro pré-selecionado no filtro da agenda (modo criar). */
  defaultBarbeiroId?: string
  onSaved: (savedDataYmd: string) => void
  onError: (message: string) => void
  /** Com dados fictícios ativos, o envio fica bloqueado (evita gravar no banco com a demo na tela). */
  demoDataActive?: boolean
  /** Abertura/fechamento da barbearia (grade e lista de horários do formulário). */
  agendaTimeRange?: { start: string; end: string }
}

export function AppointmentAdminFormDialog({
  open,
  onOpenChange,
  barbeariaId,
  barbeiros,
  initialDate,
  editing,
  defaultBarbeiroId,
  onSaved,
  onError,
  demoDataActive = false,
  agendaTimeRange: agendaTimeRangeProp,
}: AppointmentAdminFormDialogProps) {
  const { base } = useTenantAdminBase()
  const agendaTimeRange = useMemo(
    () => agendaTimeRangeProp ?? resolveBarbeariaAgendaTimeRange(null, null),
    [agendaTimeRangeProp],
  )
  const horarioFallback = agendaTimeRange.start
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoadingRefs, setIsLoadingRefs] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)
  const [clienteComboOpen, setClienteComboOpen] = useState(false)
  const [busyAppointments, setBusyAppointments] = useState<
    { id: string; horario: string; servico: { duracao: number } | null }[]
  >([])
  const [jornadaDia, setJornadaDia] = useState<{
    hora_inicio: string
    hora_fim: string
    pausas: { nome: string; pausa_inicio: string; pausa_fim: string }[]
  } | null>(null)

  const [clienteId, setClienteId] = useState('')
  const [barbeiroId, setBarbeiroId] = useState('')
  const [servicoId, setServicoId] = useState('')
  const [dataStr, setDataStr] = useState(formatYMD(initialDate))
  const [horario, setHorario] = useState(horarioFallback)
  const [observacoes, setObservacoes] = useState('')
  const selectedServico = servicos.find((s) => s.id === servicoId)

  const slotOptions = useMemo(() => {
    const base = buildAgendaSlotStrings(
      agendaTimeRange.start,
      agendaTimeRange.end,
      HORARIOS_PADRAO.intervalo,
    )
    const duracaoServico = selectedServico?.duracao
    const available =
      typeof duracaoServico === 'number'
        ? listAvailableStartSlots({
            slotStrings: base,
            dayStart: agendaTimeRange.start,
            dayEnd: agendaTimeRange.end,
            targetDurationMinutes: duracaoServico,
            appointments: busyAppointments
              .filter((appointment) => !editing || appointment.id !== editing.id)
              .map((appointment) => ({
                horario: appointment.horario,
                servico: appointment.servico,
              })),
          })
        : base
    const comJornada = (() => {
      if (!jornadaDia) return available
      const inicioJornada = parseAgendaClockToMinutes(jornadaDia.hora_inicio)
      const fimJornada = parseAgendaClockToMinutes(jornadaDia.hora_fim)
      const pausas = jornadaDia.pausas
        .map((p) => ({
          inicio: parseAgendaClockToMinutes(p.pausa_inicio),
          fim: parseAgendaClockToMinutes(p.pausa_fim),
        }))
        .filter((p): p is { inicio: number; fim: number } => p.inicio != null && p.fim != null && p.fim > p.inicio)
      if (inicioJornada == null || fimJornada == null || fimJornada <= inicioJornada) return []
      const duracaoServico = Math.max(selectedServico?.duracao ?? 30, 5)
      return available.filter((slot) => {
        const inicio = parseAgendaClockToMinutes(slot)
        if (inicio == null) return false
        const fim = inicio + duracaoServico
        if (inicio < inicioJornada || fim > fimJornada) return false
        if (pausas.some((p) => inicio < p.fim && fim > p.inicio)) return false
        return true
      })
    })()
    const h = normalizeHorarioLabel(horario, horarioFallback)
    if (h && !comJornada.includes(h)) return [h, ...comJornada].sort()
    return comJornada
  }, [
    horario,
    agendaTimeRange.start,
    agendaTimeRange.end,
    horarioFallback,
    selectedServico,
    busyAppointments,
    editing,
    jornadaDia,
  ])

  useEffect(() => {
    if (!open || !barbeariaId) return
    let cancelled = false
    setIsLoadingRefs(true)
    setLoadError(null)

    async function load() {
      const supabase = createClient()
      const [cRes, sRes] = await Promise.all([
        supabase.from('clientes').select('*').eq('barbearia_id', barbeariaId).order('nome'),
        supabase.from('servicos').select('*').eq('barbearia_id', barbeariaId).eq('ativo', true).order('nome'),
      ])
      if (cancelled) return
      if (cRes.error || sRes.error) {
        setLoadError('Não foi possível carregar clientes ou serviços')
        setClientes([])
        setServicos([])
      } else {
        setClientes(cRes.data ?? [])
        setServicos(sRes.data ?? [])
      }
      setIsLoadingRefs(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, barbeariaId])

  useEffect(() => {
    if (!open) setClienteComboOpen(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (editing) {
      setClienteId(editing.cliente_id)
      setBarbeiroId(editing.barbeiro_id)
      setServicoId(editing.servico_id)
      setDataStr(editing.data)
      setHorario(normalizeHorarioLabel(editing.horario, horarioFallback))
      setObservacoes(editing.observacoes ?? '')
      return
    }
    setClienteId('')
    const preferredBarber =
      defaultBarbeiroId && barbeiros.some((b) => b.id === defaultBarbeiroId)
        ? defaultBarbeiroId
        : barbeiros[0]?.id ?? ''
    setBarbeiroId(preferredBarber)
    setServicoId('')
    setDataStr(formatYMD(initialDate))
    setHorario(horarioFallback)
    setObservacoes('')
  }, [open, editing, initialDate, defaultBarbeiroId, barbeiros, horarioFallback])

  useEffect(() => {
    if (!open || !barbeariaId || !barbeiroId || !dataStr) {
      setBusyAppointments([])
      setJornadaDia(null)
      return
    }
    let cancelled = false
    async function loadAvailability() {
      setIsLoadingAvailability(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('agendamentos')
        .select('id, horario, status, servico:servicos(duracao)')
        .eq('barbearia_id', barbeariaId)
        .eq('barbeiro_id', barbeiroId)
        .eq('data', dataStr)
        .in('status', ['agendado', 'em_atendimento', 'concluido'])

      const [y, m, d] = dataStr.split('-').map(Number)
      const dow = new Date(y, m - 1, d).getDay()
      const { data: jornadaData } = await supabase
        .from('horarios_trabalho')
        .select('hora_inicio, hora_fim, pausas:horarios_trabalho_pausas(nome, pausa_inicio, pausa_fim)')
        .eq('barbeiro_id', barbeiroId)
        .eq('dia_semana', dow)
        .eq('ativo', true)
        .maybeSingle()

      if (cancelled) return
      if (error) {
        setBusyAppointments([])
      } else {
        setBusyAppointments(data ?? [])
      }
      setJornadaDia(jornadaData ?? null)
      setIsLoadingAvailability(false)
    }
    void loadAvailability()
    return () => {
      cancelled = true
    }
  }, [open, barbeariaId, barbeiroId, dataStr])

  useEffect(() => {
    const normalized = normalizeHorarioLabel(horario, horarioFallback)
    if (!normalized) return
    if (slotOptions.includes(normalized)) return
    setHorario('')
  }, [horario, horarioFallback, slotOptions])

  const selectedCliente = useMemo(
    () => clientes.find((c) => c.id === clienteId) ?? null,
    [clientes, clienteId],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (demoDataActive) {
      onError('Desative "Dados fictícios" na agenda para salvar no banco.')
      return
    }
    if (!barbeariaId || !clienteId || !barbeiroId || !servicoId || !dataStr || !horario) {
      onError('Preencha cliente, barbeiro, serviço, data e horário')
      return
    }
    const servico = servicos.find((s) => s.id === servicoId)
    if (!servico) {
      onError('Serviço inválido')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()
    const horarioNorm = normalizeHorarioLabel(horario, horarioFallback)
    const payload = {
      barbearia_id: barbeariaId,
      cliente_id: clienteId,
      barbeiro_id: barbeiroId,
      servico_id: servicoId,
      data: dataStr,
      horario: horarioNorm,
      valor: servico.preco,
      observacoes: observacoes.trim() || null,
    }

    const { data: currentBusy, error: availabilityError } = await supabase
      .from('agendamentos')
      .select('id, horario, status, servico:servicos(duracao)')
      .eq('barbearia_id', barbeariaId)
      .eq('barbeiro_id', barbeiroId)
      .eq('data', dataStr)
      .in('status', ['agendado', 'em_atendimento', 'concluido'])

    if (availabilityError) {
      setIsSubmitting(false)
      onError('Não foi possível validar a disponibilidade deste horário')
      return
    }

    const stillAvailable =
      listAvailableStartSlots({
        slotStrings: [horarioNorm],
        dayStart: agendaTimeRange.start,
        dayEnd: agendaTimeRange.end,
        targetDurationMinutes: servico.duracao,
        appointments: (currentBusy ?? [])
          .filter((appointment) => !editing || appointment.id !== editing.id)
          .map((appointment) => ({
            horario: appointment.horario,
            servico: appointment.servico,
          })),
      }).length > 0

    if (!stillAvailable) {
      setIsSubmitting(false)
      onError('Este horário acabou de ficar indisponível. Escolha outro horário.')
      return
    }

    const [y, m, d] = dataStr.split('-').map(Number)
    const dow = new Date(y, m - 1, d).getDay()
    const { data: jornadaAtual } = await supabase
      .from('horarios_trabalho')
      .select('hora_inicio, hora_fim, pausas:horarios_trabalho_pausas(nome, pausa_inicio, pausa_fim)')
      .eq('barbeiro_id', barbeiroId)
      .eq('dia_semana', dow)
      .eq('ativo', true)
      .maybeSingle()

    if (!jornadaAtual) {
      setIsSubmitting(false)
      onError('O profissional não possui jornada ativa para este dia.')
      return
    }

    const iniJornada = parseAgendaClockToMinutes(jornadaAtual.hora_inicio)
    const fimJornada = parseAgendaClockToMinutes(jornadaAtual.hora_fim)
    const iniAtend = parseAgendaClockToMinutes(horarioNorm)
    const fimAtend = iniAtend != null ? iniAtend + Math.max(servico.duracao, 5) : null
    const pausas = (jornadaAtual.pausas ?? [])
      .map((p) => ({
        inicio: parseAgendaClockToMinutes(p.pausa_inicio),
        fim: parseAgendaClockToMinutes(p.pausa_fim),
      }))
      .filter((p): p is { inicio: number; fim: number } => p.inicio != null && p.fim != null && p.fim > p.inicio)
    const foraJornada =
      iniJornada == null ||
      fimJornada == null ||
      iniAtend == null ||
      fimAtend == null ||
      iniAtend < iniJornada ||
      fimAtend > fimJornada
    const conflitaPausa = !foraJornada && pausas.some((p) => iniAtend < p.fim && fimAtend > p.inicio)
    if (foraJornada || conflitaPausa) {
      setIsSubmitting(false)
      onError('Este horário não está dentro da jornada do profissional.')
      return
    }

    if (editing) {
      const { error: upErr } = await supabase
        .from('agendamentos')
        .update(payload)
        .eq('id', editing.id)
      setIsSubmitting(false)
      if (upErr) {
        if (
          upErr.code === '23514' ||
          upErr.message.includes('Conflito de horário') ||
          upErr.message.includes('Fora da jornada') ||
          upErr.message.includes('pausa')
        ) {
          onError('Este horário não está disponível na jornada do profissional.')
        } else {
          onError('Não foi possível atualizar o agendamento')
        }
        return
      }
      onSaved(dataStr)
      onOpenChange(false)
      return
    }

    const { error: insErr } = await supabase.from('agendamentos').insert({
      ...payload,
      status: 'agendado',
      status_pagamento: 'pendente',
    })
    setIsSubmitting(false)
    if (insErr) {
      if (
        insErr.code === '23514' ||
        insErr.message.includes('Conflito de horário') ||
        insErr.message.includes('Fora da jornada') ||
        insErr.message.includes('pausa')
      ) {
        onError('Este horário não está disponível na jornada do profissional.')
      } else {
        onError('Não foi possível criar o agendamento')
      }
      return
    }
    onSaved(dataStr)
    onOpenChange(false)
  }

  const canSubmit =
    Boolean(barbeariaId && clienteId && barbeiroId && servicoId && dataStr && horario) &&
    !isLoadingRefs &&
    !loadError &&
    !demoDataActive

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] max-w-md overflow-hidden sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar agendamento' : 'Novo agendamento'}</DialogTitle>
        </DialogHeader>

        {isLoadingRefs ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-8 w-8" />
          </div>
        ) : loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : (
          <form id="appointment-admin-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
            {demoDataActive && (
              <Alert variant="info">
                <AlertTitle>
                  {
                    'Com dados fictícios ativos não é possível gravar agendamentos reais. Desligue o interruptor "Dados fictícios" na página de agendamentos.'
                  }
                </AlertTitle>
              </Alert>
            )}
            {clientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum cliente cadastrado.{' '}
                <Link href={`${base}/clientes`} className="font-medium text-primary underline-offset-4 hover:underline">
                  Ir para Clientes
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="appt-cliente">Cliente</Label>
                <p className="text-xs text-muted-foreground">
                  Pesquise por nome ou celular quando a lista for grande.
                </p>
                <Popover open={clienteComboOpen} onOpenChange={setClienteComboOpen} modal>
                  <PopoverTrigger asChild>
                    <Button
                      id="appt-cliente"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={clienteComboOpen}
                      className="h-10 w-full justify-between font-normal"
                    >
                      <span className="truncate text-left">
                        {selectedCliente ? (
                          <span className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                            <span className="font-medium">{selectedCliente.nome}</span>
                            {selectedCliente.telefone ? (
                              <span className="truncate text-xs font-normal text-muted-foreground">
                                {selectedCliente.telefone}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Selecione o cliente...</span>
                        )}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="z-[60] w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." />
                      <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {clientes.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.id}
                              keywords={[c.nome, c.telefone].filter((x): x is string => Boolean(x))}
                              onSelect={() => {
                                setClienteId(c.id)
                                setClienteComboOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4 shrink-0',
                                  clienteId === c.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="truncate font-medium">{c.nome}</span>
                                <span className="truncate text-xs text-muted-foreground">
                                  {c.telefone || '—'}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {barbeiros.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Cadastre barbeiros na equipe para agendar.
              </p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="appt-barbeiro">Barbeiro</Label>
                <Select value={barbeiroId} onValueChange={setBarbeiroId}>
                  <SelectTrigger id="appt-barbeiro" className="w-full">
                    <SelectValue placeholder="Selecione o barbeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {barbeiros.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {servicos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum serviço ativo. Cadastre serviços nas configurações da barbearia.
              </p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="appt-servico">Serviço</Label>
                <Select value={servicoId} onValueChange={setServicoId}>
                  <SelectTrigger id="appt-servico" className="w-full">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicos.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedServico && (
                  <p className="text-xs text-muted-foreground">
                    Valor: {selectedServico.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ·{' '}
                    {selectedServico.duracao} min
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appt-data">Data</Label>
                <input
                  id="appt-data"
                  type="date"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={dataStr}
                  onChange={(ev) => setDataStr(ev.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appt-horario">Horário</Label>
                <Select value={horario} onValueChange={setHorario}>
                  <SelectTrigger id="appt-horario" className="w-full">
                    <SelectValue placeholder="Horário" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {slotOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isLoadingAvailability ? (
                  <p className="text-xs text-muted-foreground">Carregando disponibilidade...</p>
                ) : selectedServico && slotOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Nenhum horário disponível para este serviço nesta data.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appt-obs">Observações (opcional)</Label>
              <Textarea
                id="appt-obs"
                value={observacoes}
                onChange={(ev) => setObservacoes(ev.target.value)}
                rows={3}
                placeholder="Notas internas"
                className="resize-none"
              />
            </div>
          </form>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="appointment-admin-form"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? <Spinner className="h-4 w-4" /> : editing ? 'Salvar' : 'Agendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
