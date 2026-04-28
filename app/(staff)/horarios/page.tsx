'use client'

import { useEffect, useState } from 'react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { HorariosScheduleSkeleton } from '@/components/shared/loading-skeleton'
import { DIAS_SEMANA } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { HorarioTrabalho } from '@/types'

const HORARIOS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00'
]

interface DiaHorario {
  dia_semana: number
  ativo: boolean
  hora_inicio: string
  hora_fim: string
  pausas: { nome: string; pausa_inicio: string; pausa_fim: string }[]
}

export default function BarbeiroHorariosPage() {
  const [horarios, setHorarios] = useState<DiaHorario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [barbeiroId, setBarbeiroId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadHorarios() {
      const supabase = createClient()
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Usuário não autenticado')
        setIsLoading(false)
        return
      }

      const { data: barbeiro } = await supabase
        .from('barbeiros')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!barbeiro) {
        setError('Barbeiro não encontrado')
        setIsLoading(false)
        return
      }

      setBarbeiroId(barbeiro.id)
      
      const { data, error: queryError } = await supabase
        .from('horarios_trabalho')
        .select('id, dia_semana, ativo, hora_inicio, hora_fim, pausas:horarios_trabalho_pausas(nome, pausa_inicio, pausa_fim)')
        .eq('barbeiro_id', barbeiro.id)
        .order('dia_semana')
      
      if (queryError) {
        setError('Não foi possível carregar os horários')
      } else if (data && data.length > 0) {
        setHorarios(data.map((h) => ({
          dia_semana: h.dia_semana,
          ativo: h.ativo,
          hora_inicio: h.hora_inicio,
          hora_fim: h.hora_fim,
          pausas: (h.pausas ?? []).map((p) => ({
            nome: p.nome,
            pausa_inicio: p.pausa_inicio,
            pausa_fim: p.pausa_fim,
          })),
        })))
      } else {
        // Default schedule (Mon-Sat, 9-19)
        setHorarios(
          Array.from({ length: 7 }, (_, i) => ({
            dia_semana: i,
            ativo: i !== 0, // Sunday off
            hora_inicio: '09:00',
            hora_fim: '19:00',
            pausas: [{ nome: 'Almoço', pausa_inicio: '12:00', pausa_fim: '13:00' }],
          }))
        )
      }
      
      setIsLoading(false)
    }
    
    loadHorarios()
  }, [])

  const handleToggle = (diaSemana: number) => {
    setHorarios((prev) =>
      prev.map((h) =>
        h.dia_semana === diaSemana ? { ...h, ativo: !h.ativo } : h
      )
    )
  }

  const handleHorarioChange = (diaSemana: number, field: 'hora_inicio' | 'hora_fim', value: string) => {
    setHorarios((prev) =>
      prev.map((h) =>
        h.dia_semana === diaSemana ? { ...h, [field]: value } : h
      )
    )
  }

  const handlePausaChange = (
    diaSemana: number,
    idx: number,
    field: 'nome' | 'pausa_inicio' | 'pausa_fim',
    value: string,
  ) => {
    setHorarios((prev) =>
      prev.map((h) =>
        h.dia_semana === diaSemana
          ? {
              ...h,
              pausas: h.pausas.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
            }
          : h,
      ),
    )
  }

  const handleAdicionarPausa = (diaSemana: number) => {
    setHorarios((prev) =>
      prev.map((h) => {
        if (h.dia_semana !== diaSemana) return h
        return {
          ...h,
          pausas: [...h.pausas, { nome: `Pausa ${h.pausas.length + 1}`, pausa_inicio: '12:00', pausa_fim: '13:00' }],
        }
      }),
    )
  }

  const handleRemoverPausa = (diaSemana: number, idx: number) => {
    setHorarios((prev) =>
      prev.map((h) =>
        h.dia_semana === diaSemana ? { ...h, pausas: h.pausas.filter((_, i) => i !== idx) } : h,
      ),
    )
  }

  const handleSave = async () => {
    if (!barbeiroId) return
    for (const h of horarios) {
      if (!h.ativo) continue
      if (h.hora_inicio >= h.hora_fim) {
        setError(`Em ${DIAS_SEMANA[h.dia_semana]}, o início deve ser menor que o fim.`)
        return
      }
      const sortedPausas = [...h.pausas].sort((a, b) => a.pausa_inicio.localeCompare(b.pausa_inicio))
      for (let i = 0; i < sortedPausas.length; i++) {
        const p = sortedPausas[i]!
        if (p.nome.trim().length < 2) {
          setError(`Em ${DIAS_SEMANA[h.dia_semana]}, dê um nome com pelo menos 2 caracteres para cada pausa.`)
          return
        }
        if (!(p.pausa_inicio < p.pausa_fim)) {
          setError(`Em ${DIAS_SEMANA[h.dia_semana]}, a pausa "${p.nome}" deve começar antes de terminar.`)
          return
        }
        if (!(p.pausa_inicio > h.hora_inicio && p.pausa_fim < h.hora_fim)) {
          setError(`Em ${DIAS_SEMANA[h.dia_semana]}, a pausa "${p.nome}" deve ficar dentro da jornada.`)
          return
        }
        if (i > 0) {
          const anterior = sortedPausas[i - 1]!
          if (p.pausa_inicio < anterior.pausa_fim) {
            setError(`Em ${DIAS_SEMANA[h.dia_semana]}, as pausas não podem se sobrepor.`)
            return
          }
        }
      }
    }
    
    setIsSaving(true)
    setError(null)
    
    const supabase = createClient()
    
    // Delete existing
    const { error: deleteError } = await supabase
      .from('horarios_trabalho')
      .delete()
      .eq('barbeiro_id', barbeiroId)
    if (deleteError) {
      setError('Não foi possível atualizar os horários')
      setIsSaving(false)
      return
    }
    
    // Insert new
    const { data: insertedRows, error: insertError } = await supabase.from('horarios_trabalho').insert(
      horarios.map((h) => ({
        barbeiro_id: barbeiroId,
        dia_semana: h.dia_semana,
        ativo: h.ativo,
        hora_inicio: h.hora_inicio,
        hora_fim: h.hora_fim,
        pausa_inicio: null,
        pausa_fim: null,
      }))
    ).select('id, dia_semana')
    if (insertError) {
      setError('Não foi possível salvar os horários')
      setIsSaving(false)
      return
    }
    const pausesPayload =
      insertedRows?.flatMap((row) => {
        const day = horarios.find((h) => h.dia_semana === row.dia_semana)
        if (!day || !day.ativo) return []
        return day.pausas.map((p) => ({
          horario_trabalho_id: row.id,
          nome: p.nome.trim(),
          pausa_inicio: p.pausa_inicio,
          pausa_fim: p.pausa_fim,
        }))
      }) ?? []
    if (pausesPayload.length > 0) {
      const { error: pausesError } = await supabase.from('horarios_trabalho_pausas').insert(pausesPayload)
      if (pausesError) {
        setError('Horários salvos, mas não foi possível salvar as pausas.')
        setIsSaving(false)
        return
      }
    }
    
    setIsSaving(false)
  }

  return (
    <PageContainer>
      <AppPageHeader
        title="Horários de Trabalho"
        profileHref="/profissional/perfil/editar"
        avatarFallback="B"
      />

      <PageContent className="space-y-4">
        {error && (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {isLoading ? (
          <HorariosScheduleSkeleton />
        ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configure seus horários</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {horarios.map((horario) => (
              <div
                key={horario.dia_semana}
                className="flex items-center gap-4 rounded-lg border p-3"
              >
                <div className="flex min-w-[100px] items-center gap-2">
                  <Switch
                    id={`dia-${horario.dia_semana}`}
                    checked={horario.ativo}
                    onCheckedChange={() => handleToggle(horario.dia_semana)}
                  />
                  <Label
                    htmlFor={`dia-${horario.dia_semana}`}
                    className="text-sm font-medium"
                  >
                    {DIAS_SEMANA[horario.dia_semana].slice(0, 3)}
                  </Label>
                </div>
                
                {horario.ativo && (
                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Select
                        value={horario.hora_inicio}
                        onValueChange={(v) => handleHorarioChange(horario.dia_semana, 'hora_inicio', v)}
                      >
                        <SelectTrigger className="w-[90px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HORARIOS.map((h) => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">-</span>
                      <Select
                        value={horario.hora_fim}
                        onValueChange={(v) => handleHorarioChange(horario.dia_semana, 'hora_fim', v)}
                      >
                        <SelectTrigger className="w-[90px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HORARIOS.map((h) => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Pausas do dia</span>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleAdicionarPausa(horario.dia_semana)}>
                          Adicionar pausa
                        </Button>
                      </div>
                      {horario.pausas.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sem pausa configurada.</p>
                      ) : (
                        horario.pausas.map((p, idx) => (
                          <div key={`${horario.dia_semana}-${idx}`} className="flex flex-wrap items-center gap-2">
                            <Input
                              value={p.nome}
                              onChange={(e) => handlePausaChange(horario.dia_semana, idx, 'nome', e.target.value)}
                              className="h-9 w-[140px]"
                              placeholder="Nome da pausa"
                            />
                            <Select
                              value={p.pausa_inicio}
                              onValueChange={(v) => handlePausaChange(horario.dia_semana, idx, 'pausa_inicio', v)}
                            >
                              <SelectTrigger className="w-[90px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {HORARIOS.map((h) => (
                                  <SelectItem key={h} value={h}>{h}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-muted-foreground">-</span>
                            <Select
                              value={p.pausa_fim}
                              onValueChange={(v) => handlePausaChange(horario.dia_semana, idx, 'pausa_fim', v)}
                            >
                              <SelectTrigger className="w-[90px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {HORARIOS.map((h) => (
                                  <SelectItem key={h} value={h}>{h}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleRemoverPausa(horario.dia_semana, idx)}
                            >
                              Remover
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                
                {!horario.ativo && (
                  <span className="text-sm text-muted-foreground">Fechado</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        )}

        {!isLoading ? (
        <Button className="w-full" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Spinner className="mr-2" /> : null}
          {isSaving ? 'Salvando...' : 'Salvar Horários'}
        </Button>
        ) : (
          <Skeleton className="h-10 w-full" />
        )}
      </PageContent>
    </PageContainer>
  )
}
