'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { PageContent, PageTitle } from '@/components/shared/page-container'
import { TeamMemberCard } from '@/components/domain/team-member-card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarbeiroFotoUpload } from '@/components/shared/barbeiro-foto-upload'
import { EQUIPE_FUNCAO_OPTIONS, parseEquipeFuncao } from '@/lib/equipe-funcao'
import { uploadBarbeiroFoto, removeBarbeiroFotoStorage } from '@/lib/supabase/upload-barbeiro-foto'
import { TeamMemberCardSkeleton } from '@/components/shared/loading-skeleton'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import { Spinner } from '@/components/ui/spinner'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { maskTelefoneBr, normalizeEmailInput } from '@/lib/format-contato'
import { cn } from '@/lib/utils'
import type { Barbeiro, EquipeFuncao } from '@/types'

const EQUIPE_PAGE_SIZE_OPTIONS = [12, 24, 36, 48] as const
type EquipePageSize = (typeof EQUIPE_PAGE_SIZE_OPTIONS)[number]

function pageNumberItems(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const set = new Set<number>([1, total])
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) set.add(i)
  }
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) out.push('ellipsis')
    out.push(p)
    prev = p
  }
  return out
}

export default function TenantEquipePage() {
  const { slug, base } = useTenantAdminBase()

  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<EquipePageSize>(12)
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingBarbeiro, setEditingBarbeiro] = useState<Barbeiro | null>(null)
  const [barbeiroParaExcluir, setBarbeiroParaExcluir] = useState<Barbeiro | null>(null)

  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    ativo: true,
    funcao_equipe: 'barbeiro' as EquipeFuncao,
    avatar: '',
  })

  useEffect(() => {
    loadBarbeiros()
  }, [slug])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, pageSize])

  const filteredBarbeiros = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return barbeiros
    return barbeiros.filter(
      (b) =>
        b.nome.toLowerCase().includes(q) || (b.email?.toLowerCase().includes(q) ?? false),
    )
  }, [searchTerm, barbeiros])

  const totalFiltered = filteredBarbeiros.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const paginatedBarbeiros = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredBarbeiros.slice(start, start + pageSize)
  }, [filteredBarbeiros, page, pageSize])

  const rangeStart = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalFiltered)
  const pageItems = useMemo(() => pageNumberItems(page, totalPages), [page, totalPages])

  async function loadBarbeiros() {
    const supabase = createClient()
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Usuário não autenticado')
      setBarbeiros([])
      setIsLoading(false)
      return
    }

    const barbeariaIdResolved = await resolveAdminBarbeariaId(supabase, user.id, { slug })

    if (!barbeariaIdResolved) {
      setError('Barbearia não encontrada para este usuário')
      setBarbeiros([])
      setIsLoading(false)
      return
    }

    setBarbeariaId(barbeariaIdResolved)

    const { data, error: queryError } = await supabase
      .from('barbeiros')
      .select('*')
      .eq('barbearia_id', barbeariaIdResolved)
      .order('nome')

    if (queryError) {
      setError('Não foi possível carregar a equipe')
      setBarbeiros([])
    } else if (data) {
      setBarbeiros(data)
    }

    setIsLoading(false)
  }

  const handleOpenNew = () => {
    setEditingBarbeiro(null)
    setPendingAvatarFile(null)
    setFormData({
      nome: '',
      telefone: '',
      email: '',
      ativo: true,
      funcao_equipe: 'barbeiro',
      avatar: '',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (barbeiro: Barbeiro) => {
    setEditingBarbeiro(barbeiro)
    setPendingAvatarFile(null)
    setFormData({
      nome: barbeiro.nome,
      telefone: maskTelefoneBr(barbeiro.telefone || ''),
      email: normalizeEmailInput(barbeiro.email || ''),
      ativo: barbeiro.ativo,
      funcao_equipe: parseEquipeFuncao(barbeiro.funcao_equipe),
      avatar: barbeiro.avatar || '',
    })
    setIsDialogOpen(true)
  }

  const solicitarExclusaoBarbeiro = (id: string) => {
    const b = barbeiros.find((x) => x.id === id)
    if (b) setBarbeiroParaExcluir(b)
  }

  const confirmarExclusaoBarbeiro = async () => {
    if (!barbeiroParaExcluir) return
    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('barbeiros')
      .delete()
      .eq('id', barbeiroParaExcluir.id)
    setBarbeiroParaExcluir(null)
    if (deleteError) {
      setError('Não foi possível excluir o membro')
      return
    }
    loadBarbeiros()
  }

  const handleSave = async () => {
    if (!barbeariaId) return

    setIsSaving(true)
    setError(null)
    const supabase = createClient()

    const funcao = formData.funcao_equipe
    const avatarForRow =
      funcao === 'moderador' ? null : formData.avatar.trim() || null

    const barbeiroData = {
      barbearia_id: barbeariaId,
      nome: formData.nome.trim(),
      telefone: formData.telefone || null,
      email: formData.email || null,
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
        loadBarbeiros()
        return
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
        loadBarbeiros()
        return
      }
    }

    setPendingAvatarFile(null)
    setIsSaving(false)
    setIsDialogOpen(false)
    loadBarbeiros()
  }

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader greetingOnly profileHref={`${base}/configuracoes`} avatarFallback="A" />

      <PageContent className="space-y-4 md:space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <PageTitle className="min-w-0 truncate">Equipe</PageTitle>
          <Button type="button" className="w-full shrink-0 sm:w-auto" size="sm" onClick={handleOpenNew}>
            <Plus className="mr-1 h-4 w-4" />
            Novo
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
            <Label
              htmlFor="equipe-page-size"
              className="shrink-0 whitespace-nowrap text-sm text-muted-foreground"
            >
              Itens
            </Label>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v) as EquipePageSize)}
            >
              <SelectTrigger id="equipe-page-size" className="h-9 w-[4.75rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPE_PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        ) : null}

        <div
          className={
            isLoading || barbeiros.length > 0
              ? 'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 lg:grid-cols-4 lg:gap-4 xl:grid-cols-6'
              : undefined
          }
        >
          {isLoading ? (
            Array.from({ length: Math.min(pageSize, 48) }).map((_, i) => (
              <TeamMemberCardSkeleton key={i} />
            ))
          ) : filteredBarbeiros.length > 0 ? (
            paginatedBarbeiros.map((barbeiro) => (
              <TeamMemberCard
                key={barbeiro.id}
                barbeiro={barbeiro}
                onEdit={handleEdit}
                onDelete={solicitarExclusaoBarbeiro}
              />
            ))
          ) : (
            <Card className="col-span-full border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm.trim() ? 'Nenhum membro encontrado' : 'Nenhum membro na equipe'}
                </p>
                {!searchTerm.trim() && (
                  <Button size="sm" className="mt-3" onClick={handleOpenNew}>
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar membro
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {!isLoading && totalFiltered > 0 ? (
          <div className="border-t border-border/60 pt-4">
            <Pagination className="mx-0 flex w-full max-w-full flex-col items-center gap-2">
              <PaginationContent className="flex h-9 flex-row flex-wrap items-center justify-center gap-1">
                <PaginationItem>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1 px-2.5"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>
                </PaginationItem>
                {pageItems.map((item, idx) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`e-${idx}`} className="flex h-9 items-center">
                      <PaginationEllipsis className="size-9" />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item} className="flex h-9 items-center">
                      <Button
                        type="button"
                        variant={item === page ? 'default' : 'ghost'}
                        size="icon"
                        className={cn(
                          'h-9 min-w-9',
                          item === page && 'pointer-events-none font-semibold',
                        )}
                        onClick={() => setPage(item)}
                        aria-label={`Página ${item}`}
                        aria-current={item === page ? 'page' : undefined}
                      >
                        {item}
                      </Button>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1 px-2.5"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Próxima página"
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
              <p className="text-center text-xs text-muted-foreground">
                {rangeStart}–{rangeEnd} de {totalFiltered}{' '}
                {totalFiltered === 1 ? 'membro' : 'membros'} · Página {page} de {totalPages}
              </p>
            </Pagination>
          </div>
        ) : null}
      </PageContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg lg:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBarbeiro ? 'Editar membro' : 'Novo membro'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-x-4 lg:gap-y-4 lg:space-y-0">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="funcao_equipe">Função</Label>
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
                <SelectTrigger id="funcao_equipe" className="w-full">
                  <SelectValue placeholder="Função na equipe" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPE_FUNCAO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Moderadores não aparecem na escolha de profissional no agendamento público; barbeiros e barbeiros líder sim.
              </p>
            </div>

            {formData.funcao_equipe !== 'moderador' && barbeariaId ? (
              <div className="lg:col-span-2">
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
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: maskTelefoneBr(e.target.value) })}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: normalizeEmailInput(e.target.value) })}
                placeholder="email@exemplo.com"
                inputMode="email"
                autoComplete="email"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-3 lg:col-span-2">
              <Label htmlFor="ativo" className="cursor-pointer">
                Ativo na equipe
              </Label>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.nome}>
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={barbeiroParaExcluir != null}
        onOpenChange={(open) => {
          if (!open) setBarbeiroParaExcluir(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir membro da equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              {barbeiroParaExcluir
                ? `“${barbeiroParaExcluir.nome}” será removido da equipe. Esta ação não pode ser desfeita.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmarExclusaoBarbeiro()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TenantPanelPageContainer>
  )
}
