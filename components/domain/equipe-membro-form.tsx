'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Cake, Camera, Eye, EyeOff, KeyRound, Phone, UserCircle } from 'lucide-react'
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

  const loginParcial =
    formData.senha.trim().length > 0 || formData.confirmarSenha.trim().length > 0

  useEffect(() => {
    setError(null)
    setPendingAvatarFile(null)
    setShowSenha(false)
    setShowConfirmarSenha(false)
    const b = editingBarbeiro
    if (!b) {
      setFormData(emptyForm())
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
  }, [editingBarbeiro?.id])

  const handleSave = async () => {
    const senha = formData.senha.trim()
    const confirmarSenha = formData.confirmarSenha.trim()
    const wantsNewLogin = senha.length > 0 || confirmarSenha.length > 0
    if (wantsNewLogin) {
      if (senha.length < 6) {
        setError('A senha de acesso deve ter pelo menos 6 caracteres.')
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

      if (senha.length >= 6) {
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

      if (senha.length >= 6) {
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
    }

    setPendingAvatarFile(null)
    setFormData((prev) => ({ ...prev, senha: '', confirmarSenha: '' }))
    setShowSenha(false)
    setShowConfirmarSenha(false)
    setIsSaving(false)
    router.push(equipeListHref)
    router.refresh()
  }

  const senhaObrigatoriaUi = loginParcial
  const emailObrigatorioUi = loginParcial

  return (
    <div className="space-y-4">
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
            defaultValue={['ident', 'contato']}
            className="px-4 sm:px-6"
          >
            <AccordionItem value="ident">
              <AccordionTrigger className="items-center py-4 hover:no-underline">
                <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                  <UserCircle className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">Identificação</span>
                    <span className="text-xs font-normal text-muted-foreground">Nome, função e situação na equipe</span>
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
                    <span className="text-xs font-normal text-muted-foreground">Telefone e e-mail</span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label htmlFor="equipe-membro-email">
                      E-mail {emailObrigatorioUi ? <Req /> : null}
                    </Label>
                    <Input
                      id="equipe-membro-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: normalizeEmailInput(e.target.value) })}
                      placeholder="nome@exemplo.com"
                      inputMode="email"
                      autoComplete="email"
                      aria-required={emailObrigatorioUi}
                    />
                    {emailObrigatorioUi ? (
                      <p className="text-xs text-muted-foreground">Obrigatório ao definir senha de acesso abaixo.</p>
                    ) : null}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="login">
              <AccordionTrigger className="items-center py-4 hover:no-underline">
                <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                  <KeyRound className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">Acesso ao painel (login)</span>
                    <span className="text-xs font-normal text-muted-foreground">Senha para entrar em /login com o e-mail</span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-2">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  O profissional usa o e-mail da seção Contato. Ao salvar, o e-mail do cadastro precisa coincidir com o
                  usado na API de criação de conta.
                </p>
                {editingBarbeiro?.user_id ? (
                  <p className="text-xs text-muted-foreground">
                    Conta já vinculada: deixe as senhas em branco para manter a atual ou preencha para trocar.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Opcional: sem senha, o membro permanece só no cadastro da equipe (sem login no app).
                  </p>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="equipe-membro-senha">
                      {editingBarbeiro?.user_id ? 'Nova senha' : 'Senha'}{' '}
                      {senhaObrigatoriaUi ? <Req /> : null}
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
                      {editingBarbeiro?.user_id ? 'Confirmar nova senha' : 'Confirmar senha'}{' '}
                      {senhaObrigatoriaUi ? <Req /> : null}
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
              </AccordionContent>
            </AccordionItem>

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

      <div className="flex flex-col-reverse gap-3 border-t border-border/60 bg-muted/10 pt-4 sm:flex-row sm:justify-end sm:gap-3">
        <Button
          variant="outline"
          type="button"
          disabled={isSaving}
          onClick={() => router.push(equipeListHref)}
        >
          Cancelar
        </Button>
        <Button onClick={() => void handleSave()} disabled={isSaving || !formData.nome.trim()}>
          {isSaving ? <Spinner className="mr-2" /> : null}
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
