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
import { Spinner } from '@/components/ui/spinner'
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
        .select('*')
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
        })))
      } else {
        // Default schedule (Mon-Sat, 9-19)
        setHorarios(
          Array.from({ length: 7 }, (_, i) => ({
            dia_semana: i,
            ativo: i !== 0, // Sunday off
            hora_inicio: '09:00',
            hora_fim: '19:00',
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

  const handleSave = async () => {
    if (!barbeiroId) return
    
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
    const { error: insertError } = await supabase.from('horarios_trabalho').insert(
      horarios.map((h) => ({
        barbeiro_id: barbeiroId,
        dia_semana: h.dia_semana,
        ativo: h.ativo,
        hora_inicio: h.hora_inicio,
        hora_fim: h.hora_fim,
      }))
    )
    if (insertError) {
      setError('Não foi possível salvar os horários')
      setIsSaving(false)
      return
    }
    
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <PageContainer>
        <AppPageHeader
          title="Horários de Trabalho"
          profileHref="/barbeiro/perfil/editar"
          avatarFallback="B"
        />
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <AppPageHeader
        title="Horários de Trabalho"
        profileHref="/barbeiro/perfil/editar"
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
                  <div className="flex flex-1 items-center gap-2">
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
                )}
                
                {!horario.ativo && (
                  <span className="text-sm text-muted-foreground">Fechado</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Button className="w-full" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Spinner className="mr-2" /> : null}
          {isSaving ? 'Salvando...' : 'Salvar Horários'}
        </Button>
      </PageContent>
    </PageContainer>
  )
}
