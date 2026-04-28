'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Cake, CalendarClock, Camera, Eye, EyeOff, Phone, UserCircle } from 'lucide-react'
import { BarbeiroFotoUpload } from '@/components/shared/barbeiro-foto-upload'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { DIAS_SEMANA } from '@/lib/constants'
import { EQUIPE_FUNCAO_OPTIONS, parseEquipeFuncao } from '@/lib/equipe-funcao'
import { maskTelefoneBr, normalizeEmailInput } from '@/lib/format-contato'
import { createClient } from '@/lib/supabase/client'
import { removeBarbeiroFotoStorage, uploadBarbeiroFoto } from '@/lib/supabase/upload-barbeiro-foto'
import type { Barbeiro, EquipeFuncao } from '@/types'

export type EquipeMembroFormProps = {
  barbeariaId: string
  /** Slug da URL do tenant (`/[slug]/...`) — usado para validar acesso na API de login do profissional. */
  tenantSlug: string
  /** `null` = novo membro */
  editingBarbeiro: Barbeiro | null
  equipeListHref: string
}

const HORARIOS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00',
]

type DiaHorarioForm = {
  dia_semana: number
  ativo: boolean
  hora_inicio: string
  hora_fim: string
  pausas: { nome: string; pausa_inicio: string; pausa_fim: string }[]
}

function timeFromDb(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 5)
}

function buildDefaultHorariosSemana(): DiaHorarioForm[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dia_semana: i,
    ativo: i !== 0,
    hora_inicio: '09:00',
    hora_fim: '18:00',
    pausas: [{ nome: 'Almoço', pausa_inicio: '12:00', pausa_fim: '13:00' }],
  }))
}

function emptyForm() {
  return {
    nome: '',
    telefone: '',
    email: '',
    data_nascimento: '',
    ativo: true,
    funcao_equipe: 'barbeiro' as EquipeFuncao,
    avatar: '',
    senha: '',
    confirmarSenha: '',
  }
}

function Req() {
  return (
    <span className="text-destructive" aria-hidden="true">
      *
    </span>
  )
}

async function parseApiError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string }
    if (typeof j.error === 'string' && j.error.trim()) return j.error.trim()
  } catch {
    /* ignore */
  }
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export function EquipeMembroForm({ barbeariaId, tenantSlug, editingBarbeiro, equipeListHref }: EquipeMembroFormProps) {
  const router = useRouter()
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false)
  const [horariosSemana, setHorariosSemana] = useState<DiaHorarioForm[]>(buildDefaultHorariosSemana)

  useEffect(() => {
    setError(null)
    setPendingAvatarFile(null)
    setShowSenha(false)
    setShowConfirmarSenha(false)
    const b = editingBarbeiro
    if (!b) {
      setFormData(emptyForm())
      setHorariosSemana(buildDefaultHorariosSemana())
      return
    }
    setFormData({
      nome: b.nome,
      telefone: maskTelefoneBr(b.telefone || ''),
      email: normalizeEmailInput(b.email || ''),
      data_nascimento: b.data_nascimento ? b.data_nascimento.slice(0, 10) : '',
      ativo: b.ativo,
      funcao_equipe: parseEquipeFuncao(b.funcao_equipe),
      avatar: b.avatar || '',
      senha: '',
      confirmarSenha: '',
    })
    void (async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('horarios_trabalho')
        .select('dia_semana, ativo, hora_inicio, hora_fim, pausas:horarios_trabalho_pausas(nome, pausa_inicio, pausa_fim)')
        .eq('barbeiro_id', b.id)
        .order('dia_semana')
      if (data && data.length > 0) {
        const byDay = new Map<number, DiaHorarioForm>()
        for (const row of data) {
          const horaInicio = timeFromDb(row.hora_inicio)
          const horaFim = timeFromDb(row.hora_fim)
          byDay.set(row.dia_semana, {
            dia_semana: row.dia_semana,
            ativo: row.ativo,
            hora_inicio: horaInicio || '09:00',
            hora_fim: horaFim || '18:00',
            pausas: (row.pausas ?? []).map((p) => ({
              nome: p.nome,
              pausa_inicio: timeFromDb(p.pausa_inicio) || '12:00',
              pausa_fim: timeFromDb(p.pausa_fim) || '13:00',
            })),
          })
        }
        setHorariosSemana(
          Array.from({ length: 7 }, (_, i) => byDay.get(i) ?? buildDefaultHorariosSemana()[i]!),
        )
      } else {
        setHorariosSemana(buildDefaultHorariosSemana())
      }
    })()
  }, [editingBarbeiro?.id])

  const handleToggleDiaHorario = (dia: number) => {
    setHorariosSemana((prev) => prev.map((h) => (h.dia_semana === dia ? { ...h, ativo: !h.ativo } : h)))
  }

  const handleHorarioDiaChange = (dia: number, field: 'hora_inicio' | 'hora_fim', value: string) => {
    setHorariosSemana((prev) => prev.map((h) => (h.dia_semana === dia ? { ...h, [field]: value } : h)))
  }

  const handleAdicionarPausaDia = (dia: number) => {
    setHorariosSemana((prev) =>
      prev.map((h) => {
        if (h.dia_semana !== dia) return h
        return {
          ...h,
          pausas: [...h.pausas, { nome: `Pausa ${h.pausas.length + 1}`, pausa_inicio: '12:00', pausa_fim: '13:00' }],
        }
      }),
    )
  }

  const handlePausaDiaChange = (
    dia: number,
    idx: number,
    field: 'nome' | 'pausa_inicio' | 'pausa_fim',
    value: string,
  ) => {
    setHorariosSemana((prev) =>
      prev.map((h) =>
        h.dia_semana === dia
          ? {
              ...h,
              pausas: h.pausas.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
            }
          : h,
      ),
    )
  }

  const handleRemoverPausaDia = (dia: number, idx: number) => {
    setHorariosSemana((prev) =>
      prev.map((h) => (h.dia_semana === dia ? { ...h, pausas: h.pausas.filter((_, i) => i !== idx) } : h)),
    )
  }

  const handleSave = async () => {
    const senha = formData.senha.trim()
    const confirmarSenha = formData.confirmarSenha.trim()
    if (senha.length < 6) {
      setError('A senha de acesso é obrigatória e deve ter pelo menos 6 caracteres.')
      return
    }
    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem.')
      return
    }
    const emailTrim = formData.email.trim()
    if (!emailTrim) {
      setError('Informe o e-mail do membro para criar ou usar o login.')
      return
    }

    setIsSaving(true)
    setError(null)
    const supabase = createClient()

    const funcao = formData.funcao_equipe
    const avatarForRow = funcao === 'moderador' ? null : formData.avatar.trim() || null

    const barbeiroData = {
      barbearia_id: barbeariaId,
      nome: formData.nome.trim(),
      telefone: formData.telefone || null,
      email: formData.email || null,
      data_nascimento: formData.data_nascimento?.trim() ? formData.data_nascimento.trim() : null,
      ativo: formData.ativo,
      funcao_equipe: funcao,
      avatar: avatarForRow,
    }

    const syncFotoStorage = async (barbeiroId: string): Promise<boolean> => {
      if (funcao === 'moderador') {
        await removeBarbeiroFotoStorage(supabase, barbeariaId, barbeiroId)
        return true
      }
      if (pendingAvatarFile) {
        const res = await uploadBarbeiroFoto(supabase, barbeariaId, barbeiroId, pendingAvatarFile)
        if ('error' in res) {
          setError(res.error)
          return false
        }
        const { error: avatarErr } = await supabase
          .from('barbeiros')
          .update({ avatar: res.publicUrl })
          .eq('id', barbeiroId)
        if (avatarErr) {
          setError('Cadastro salvo, mas não foi possível associar a foto.')
          return false
        }
        return true
      }
      if (!formData.avatar.trim() && editingBarbeiro?.avatar) {
        await removeBarbeiroFotoStorage(supabase, barbeariaId, barbeiroId)
      }
      return true
    }

    const syncHorariosTrabalho = async (barbeiroId: string): Promise<boolean> => {
      if (funcao === 'moderador') {
        const { error: deleteErr } = await supabase.from('horarios_trabalho').delete().eq('barbeiro_id', barbeiroId)
        if (deleteErr) {
          setError('Não foi possível atualizar os horários do membro.')
          return false
        }
        return true
      }
      for (const h of horariosSemana) {
        if (!h.ativo) continue
        if (h.hora_inicio >= h.hora_fim) {
          setError(`Em ${DIAS_SEMANA[h.dia_semana]}, o início deve ser menor que o fim.`)
          return false
        }
        const sortedPausas = [...h.pausas].sort((a, b) => a.pausa_inicio.localeCompare(b.pausa_inicio))
        for (let i = 0; i < sortedPausas.length; i++) {
          const p = sortedPausas[i]!
          if (p.nome.trim().length < 2) {
            setError(`Em ${DIAS_SEMANA[h.dia_semana]}, nomeie cada pausa com pelo menos 2 caracteres.`)
            return false
          }
          if (!(p.pausa_inicio < p.pausa_fim)) {
            setError(`Em ${DIAS_SEMANA[h.dia_semana]}, a pausa "${p.nome}" deve começar antes de terminar.`)
            return false
          }
          if (!(p.pausa_inicio > h.hora_inicio && p.pausa_fim < h.hora_fim)) {
            setError(`Em ${DIAS_SEMANA[h.dia_semana]}, a pausa "${p.nome}" deve ficar dentro da jornada.`)
            return false
          }
          if (i > 0 && p.pausa_inicio < sortedPausas[i - 1]!.pausa_fim) {
            setError(`Em ${DIAS_SEMANA[h.dia_semana]}, as pausas não podem se sobrepor.`)
            return false
          }
        }
      }
      const { error: deleteErr } = await supabase.from('horarios_trabalho').delete().eq('barbeiro_id', barbeiroId)
      if (deleteErr) {
        setError('Não foi possível atualizar os horários do membro.')
        return false
      }
      const payload = horariosSemana.map((h) => ({
        barbeiro_id: barbeiroId,
        dia_semana: h.dia_semana,
        ativo: h.ativo,
        hora_inicio: h.hora_inicio,
        hora_fim: h.hora_fim,
      }))
      const { data: insertedRows, error: insertErr } = await supabase
        .from('horarios_trabalho')
        .insert(payload.map((h) => ({ ...h, pausa_inicio: null, pausa_fim: null })))
        .select('id, dia_semana')
      if (insertErr) {
        setError('Não foi possível salvar os horários do membro.')
        return false
      }
      const pausesPayload =
        insertedRows?.flatMap((row) => {
          const day = horariosSemana.find((h) => h.dia_semana === row.dia_semana)
          if (!day || !day.ativo) return []
          return day.pausas.map((p) => ({
            horario_trabalho_id: row.id,
            nome: p.nome.trim(),
            pausa_inicio: p.pausa_inicio,
            pausa_fim: p.pausa_fim,
          }))
        }) ?? []
      if (pausesPayload.length > 0) {
        const { error: pausesErr } = await supabase.from('horarios_trabalho_pausas').insert(pausesPayload)
        if (pausesErr) {
          setError('Horários salvos, mas não foi possível salvar as pausas do membro.')
          return false
        }
      }
      return true
    }

    if (editingBarbeiro) {
      const { error: updateError } = await supabase
        .from('barbeiros')
        .update(barbeiroData)
        .eq('id', editingBarbeiro.id)
      if (updateError) {
        setError('Não foi possível salvar as alterações')
        setIsSaving(false)
        return
      }
      const ok = await syncFotoStorage(editingBarbeiro.id)
      if (!ok) {
        setIsSaving(false)
        router.push(equipeListHref)
        router.refresh()
        return
      }
      const horariosOk = await syncHorariosTrabalho(editingBarbeiro.id)
      if (!horariosOk) {
        setIsSaving(false)
        return
      }

      if (editingBarbeiro.user_id) {
        const res = await fetch('/api/tenant/equipe-barbeiro-conta', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            barbearia_id: barbeariaId,
            slug: tenantSlug,
            barbeiro_id: editingBarbeiro.id,
            new_password: senha,
          }),
        })
        if (!res.ok) {
          setError(await parseApiError(res))
          setIsSaving(false)
          return
        }
      } else {
        const res = await fetch('/api/tenant/equipe-barbeiro-conta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            barbearia_id: barbeariaId,
            slug: tenantSlug,
            barbeiro_id: editingBarbeiro.id,
            password: senha,
            nome: formData.nome.trim(),
            email: formData.email.trim(),
          }),
        })
        if (!res.ok) {
          setError(await parseApiError(res))
          setIsSaving(false)
          return
        }
      }
    } else {
      const { data: created, error: insertError } = await supabase
        .from('barbeiros')
        .insert(barbeiroData)
        .select('id')
        .single()
      if (insertError || !created) {
        setError('Não foi possível criar o membro da equipe')
        setIsSaving(false)
        return
      }
      const ok = await syncFotoStorage(created.id)
      if (!ok) {
        setIsSaving(false)
        router.push(equipeListHref)
        router.refresh()
        return
      }
      const horariosOk = await syncHorariosTrabalho(created.id)
      if (!horariosOk) {
        setIsSaving(false)
        return
      }

      const res = await fetch('/api/tenant/equipe-barbeiro-conta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          barbearia_id: barbeariaId,
          slug: tenantSlug,
          barbeiro_id: created.id,
          password: senha,
          nome: formData.nome.trim(),
          email: formData.email.trim(),
        }),
      })
      if (!res.ok) {
        setError(
          `${await parseApiError(res)} O cadastro do membro foi salvo; você pode corrigir os dados e tentar criar o login de novo ao salvar.`,
        )
        setIsSaving(false)
        return
      }
    }

    setPendingAvatarFile(null)
    setFormData((prev) => ({ ...prev, senha: '', confirmarSenha: '' }))
    setShowSenha(false)
    setShowConfirmarSenha(false)
    setIsSaving(false)
    router.push(equipeListHref)
    router.refresh()
  }

  const senhaObrigatoriaUi = true
  const canSubmit =
    formData.nome.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.senha.trim().length > 0 &&
    formData.confirmarSenha.trim().length > 0

  return (
    <div className="space-y-4 pb-24">
      {error ? (
        <Alert
          variant="danger"
          onClose={() => setError(null)}
          autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
        >
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      ) : null}

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <CardContent className="p-0 sm:p-0">
          <Accordion
            key={editingBarbeiro?.id ?? 'novo'}
            type="multiple"
            defaultValue={['ident']}
            className="px-4 sm:px-6"
          >
            <AccordionItem value="ident">
              <AccordionTrigger className="items-center py-4 hover:no-underline">
                <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                  <UserCircle className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">Identificação e acesso</span>
                    <span className="text-xs font-normal text-muted-foreground">Nome, e-mail, senha, função e situação</span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-2">
                <div className="space-y-2">
                  <Label htmlFor="equipe-membro-nome">
                    Nome completo <Req />
                  </Label>
                  <Input
                    id="equipe-membro-nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Como aparece para clientes e no painel"
                    className="text-base sm:text-sm"
                    autoComplete="name"
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipe-membro-email">
                    E-mail <Req />
                  </Label>
                  <Input
                    id="equipe-membro-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: normalizeEmailInput(e.target.value) })}
                    placeholder="nome@exemplo.com"
                    inputMode="email"
                    autoComplete="email"
                    aria-required="true"
                  />
                  <p className="text-xs text-muted-foreground">Obrigatório para o login do profissional.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="equipe-membro-senha">
                      {editingBarbeiro?.user_id ? 'Nova senha' : 'Senha'} <Req />
                      <span className="font-normal text-muted-foreground"> (mín. 6)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="equipe-membro-senha"
                        type={showSenha ? 'text' : 'password'}
                        value={formData.senha}
                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        autoComplete="new-password"
                        placeholder="••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSenha((p) => !p)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="equipe-membro-confirmar-senha">
                      {editingBarbeiro?.user_id ? 'Confirmar nova senha' : 'Confirmar senha'} <Req />
                    </Label>
                    <div className="relative">
                      <Input
                        id="equipe-membro-confirmar-senha"
                        type={showConfirmarSenha ? 'text' : 'password'}
                        value={formData.confirmarSenha}
                        onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                        autoComplete="new-password"
                        placeholder="••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmarSenha((p) => !p)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={showConfirmarSenha ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                      >
                        {showConfirmarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipe-membro-funcao">
                    Função na equipe <Req />
                  </Label>
                  <Select
                    value={formData.funcao_equipe}
                    onValueChange={(v) => {
                      const next = v as EquipeFuncao
                      setPendingAvatarFile(null)
                      setFormData({
                        ...formData,
                        funcao_equipe: next,
                        ...(next === 'moderador' ? { avatar: '' } : {}),
                      })
                    }}
                  >
                    <SelectTrigger id="equipe-membro-funcao" className="w-full">
                      <SelectValue placeholder="Escolha a função" />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPE_FUNCAO_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Moderadores não entram na lista de profissionais do agendamento público; barbeiro e barbeiro líder
                    entram.
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 px-4 py-3.5">
                  <div className="min-w-0 space-y-0.5">
                    <Label htmlFor="equipe-membro-ativo" className="cursor-pointer text-sm font-medium leading-none">
                      Ativo na equipe
                    </Label>
                    <p className="text-xs text-muted-foreground">Inativos ficam ocultos na agenda até você reativar.</p>
                  </div>
                  <Switch
                    id="equipe-membro-ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                    className="shrink-0"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contato">
              <AccordionTrigger className="items-center py-4 hover:no-underline">
                <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                  <Phone className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">Contato</span>
                    <span className="text-xs font-normal text-muted-foreground">Telefone do profissional (opcional)</span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-2">
                <div className="max-w-full space-y-2 sm:max-w-[16rem]">
                  <Label htmlFor="equipe-membro-telefone">Telefone</Label>
                  <Input
                    id="equipe-membro-telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: maskTelefoneBr(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {formData.funcao_equipe !== 'moderador' ? (
              <AccordionItem value="horarios">
                <AccordionTrigger className="items-center py-4 hover:no-underline">
                  <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                    <CalendarClock className="size-4 shrink-0 text-primary" aria-hidden />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-semibold text-foreground">Jornada de trabalho</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        Dias, horários e pausa (almoço) para o agendamento
                      </span>
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-2">
                  {horariosSemana.map((horario) => (
                    <div key={horario.dia_semana} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`equipe-dia-${horario.dia_semana}`}
                          checked={horario.ativo}
                          onCheckedChange={() => handleToggleDiaHorario(horario.dia_semana)}
                        />
                        <Label htmlFor={`equipe-dia-${horario.dia_semana}`} className="text-sm font-medium">
                          {DIAS_SEMANA[horario.dia_semana]}
                        </Label>
                      </div>
                      {horario.ativo ? (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Select
                              value={horario.hora_inicio}
                              onValueChange={(v) =>
                                handleHorarioDiaChange(horario.dia_semana, 'hora_inicio', v)
                              }
                            >
                              <SelectTrigger className="w-[95px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {HORARIOS.map((h) => (
                                  <SelectItem key={h} value={h}>
                                    {h}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-muted-foreground">-</span>
                            <Select
                              value={horario.hora_fim}
                              onValueChange={(v) => handleHorarioDiaChange(horario.dia_semana, 'hora_fim', v)}
                            >
                              <SelectTrigger className="w-[95px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {HORARIOS.map((h) => (
                                  <SelectItem key={h} value={h}>
                                    {h}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Pausas do dia</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAdicionarPausaDia(horario.dia_semana)}
                              >
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
                                    onChange={(e) =>
                                      handlePausaDiaChange(horario.dia_semana, idx, 'nome', e.target.value)
                                    }
                                    className="h-9 w-[140px]"
                                    placeholder="Nome da pausa"
                                  />
                                  <Select
                                    value={p.pausa_inicio}
                                    onValueChange={(v) =>
                                      handlePausaDiaChange(horario.dia_semana, idx, 'pausa_inicio', v)
                                    }
                                  >
                                    <SelectTrigger className="w-[95px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {HORARIOS.map((h) => (
                                        <SelectItem key={h} value={h}>
                                          {h}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <span className="text-muted-foreground">-</span>
                                  <Select
                                    value={p.pausa_fim}
                                    onValueChange={(v) =>
                                      handlePausaDiaChange(horario.dia_semana, idx, 'pausa_fim', v)
                                    }
                                  >
                                    <SelectTrigger className="w-[95px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {HORARIOS.map((h) => (
                                        <SelectItem key={h} value={h}>
                                          {h}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => handleRemoverPausaDia(horario.dia_semana, idx)}
                                  >
                                    Remover
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">Sem atendimento neste dia.</p>
                      )}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ) : null}

            {formData.funcao_equipe !== 'moderador' ? (
              <AccordionItem value="foto">
                <AccordionTrigger className="items-center py-4 hover:no-underline">
                  <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                    <Camera className="size-4 shrink-0 text-primary" aria-hidden />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-semibold text-foreground">Foto no agendamento</span>
                      <span className="text-xs font-normal text-muted-foreground">Visível para clientes na agenda</span>
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <BarbeiroFotoUpload
                    barbeariaId={barbeariaId}
                    barbeiroId={editingBarbeiro?.id ?? null}
                    remoteAvatarUrl={formData.avatar}
                    pendingWebpFile={pendingAvatarFile}
                    onRemoteAvatarUrlChange={(url) => setFormData({ ...formData, avatar: url })}
                    onPendingWebpFileChange={setPendingAvatarFile}
                    fallbackLetter={(formData.nome.trim().charAt(0) || '?').toUpperCase()}
                    disabled={isSaving}
                    onError={(msg) => setError(msg)}
                  />
                </AccordionContent>
              </AccordionItem>
            ) : null}

            <AccordionItem value="nasc">
              <AccordionTrigger className="items-center py-4 hover:no-underline">
                <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                  <Cake className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">Aniversário</span>
                    <span className="text-xs font-normal text-muted-foreground">Data de nascimento (opcional)</span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="max-w-full space-y-2 sm:max-w-[12rem]">
                  <Label htmlFor="equipe-membro-nasc">Data de nascimento</Label>
                  <Input
                    id="equipe-membro-nasc"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    className="w-full tabular-nums"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <div className="sticky bottom-16 z-20 -mx-1 flex flex-col-reverse gap-2 border-t border-border/60 bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:bottom-0 sm:flex-row sm:justify-end sm:gap-3">
        <Button
          variant="outline"
          type="button"
          disabled={isSaving}
          onClick={() => router.push(equipeListHref)}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button onClick={() => void handleSave()} disabled={isSaving || !canSubmit} className="w-full sm:w-auto">
          {isSaving ? <Spinner className="mr-2" /> : null}
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
