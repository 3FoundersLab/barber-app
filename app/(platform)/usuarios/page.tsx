'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  Link2,
  UserCheck,
  UserX,
  Shield,
} from 'lucide-react'
import { PageContainer, PageContent, PageTitle } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  ALERT_DEFAULT_AUTO_CLOSE_MS,
} from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { SuperUsuarioGridSkeleton } from '@/components/shared/loading-skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { normalizeEmailInput } from '@/lib/format-contato'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LABELS } from '@/lib/constants'
import type { Barbearia, Profile, UserRole } from '@/types'
import { cn } from '@/lib/utils'
import { BarbeariasMultiSelect } from '@/components/shared/barbearias-multi-select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const SUPER_USUARIOS_ROLES: UserRole[] = ['super_admin', 'admin']
/** Papel do usuário dentro da barbearia ao vincular por e-mail */
const VINCULO_NA_BARBEARIA_ROLES: UserRole[] = ['admin', 'barbeiro', 'cliente']
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
type UsuariosPageSize = (typeof PAGE_SIZE_OPTIONS)[number]

const USUARIOS_SORT_OPTIONS = [
  { value: 'nome_asc', label: 'Nome (A–Z)' },
  { value: 'nome_desc', label: 'Nome (Z–A)' },
  { value: 'email_asc', label: 'Email (A–Z)' },
  { value: 'email_desc', label: 'Email (Z–A)' },
  { value: 'created_desc', label: 'Mais recentes' },
  { value: 'created_asc', label: 'Mais antigos' },
] as const
type UsuariosSort = (typeof USUARIOS_SORT_OPTIONS)[number]['value']

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

function buildLinksMap(rows: BarbeariaLink[]): Record<string, BarbeariaLink[]> {
  const map: Record<string, BarbeariaLink[]> = {}
  for (const r of rows) {
    if (!map[r.user_id]) map[r.user_id] = []
    map[r.user_id].push(r)
  }
  return map
}

function sameIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sa = new Set(a)
  return b.every((id) => sa.has(id))
}

type BarbeariaLink = {
  id: string
  user_id: string
  role: UserRole
  barbearia: { id: string; nome: string } | null
}

export default function SuperUsuariosPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [linksByUser, setLinksByUser] = useState<Record<string, BarbeariaLink[]>>({})
  const [barbearias, setBarbearias] = useState<Barbearia[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'todos' | 'super'>('todos')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<UsuariosPageSize>(10)
  const [sortBy, setSortBy] = useState<UsuariosSort>('nome_asc')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linksNotice, setLinksNotice] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState<Profile | null>(null)
  const [editProfile, setEditProfile] = useState<Profile | null>(null)
  const [editFormNome, setEditFormNome] = useState('')
  const [editFormEmail, setEditFormEmail] = useState('')
  const [editFormRole, setEditFormRole] = useState<UserRole>('admin')
  const [editFormBarbeariaIds, setEditFormBarbeariaIds] = useState<string[]>([])
  const [editBarbeariaSearchReset, setEditBarbeariaSearchReset] = useState(0)
  const [createBarbeariaSearchReset, setCreateBarbeariaSearchReset] = useState(0)
  const [editBaseline, setEditBaseline] = useState<{
    nome: string
    email: string
    role: UserRole
    barbearia_ids: string[]
  } | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [confirmRevokeLink, setConfirmRevokeLink] = useState<{
    linkId: string
    usuarioNome: string
    barbeariaNome: string
  } | null>(null)
  const [revokingLinkId, setRevokingLinkId] = useState<string | null>(null)
  const [togglingAtivoId, setTogglingAtivoId] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'admin' as UserRole,
    barbearia_ids: [] as string[],
  })
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkSaving, setLinkSaving] = useState(false)
  const [linkForm, setLinkForm] = useState({
    email: '',
    barbearia_id: '',
    role: 'admin' as UserRole,
    createIfMissing: false,
    nome: '',
    password: '',
  })

  const loadAll = useCallback(async () => {
    const supabase = createClient()
    setError(null)
    setLinksNotice(null)

    const { data: auth } = await supabase.auth.getUser()
    setCurrentUserId(auth.user?.id ?? null)

    const { data: profileRows, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['super_admin', 'admin'])
      .order('created_at', { ascending: false })

    if (profilesError) {
      setError('Não foi possível carregar os usuários.')
      setProfiles([])
      setLinksByUser({})
      setIsLoading(false)
      return
    }

    const list = (profileRows || []) as Profile[]
    setProfiles(list)

    const ids = list.map((p) => p.id)
    if (ids.length === 0) {
      setLinksByUser({})
    } else {
      let rows: BarbeariaLink[] | null = null
      let apiFailed = false

      try {
        const res = await fetch(
          `/api/platform/barbearia-links?user_ids=${encodeURIComponent(ids.join(','))}`,
          { credentials: 'include' },
        )
        const json = (await res.json().catch(() => ({}))) as { links?: unknown; error?: string }
        if (res.ok && Array.isArray(json.links)) {
          rows = json.links as unknown as BarbeariaLink[]
        } else if (res.status === 503) {
          apiFailed = true
          setLinksNotice(
            'Configure SUPABASE_SERVICE_ROLE_KEY no servidor para listar vínculos de todos os usuários, ou aplique o script SQL scripts/013_barbearia_users_select_super_admin_is_fn.sql no Supabase.',
          )
        } else if (!res.ok && typeof json.error === 'string') {
          apiFailed = true
          setLinksNotice(json.error)
        }
      } catch {
        apiFailed = true
        // rede: tenta leitura direta abaixo
      }

      if (rows === null) {
        const { data: linkRows, error: linksError } = await supabase
          .from('barbearia_users')
          .select('id, user_id, role, barbearia:barbearias(id, nome)')
          .in('user_id', ids)

        if (linksError) {
          setError('Não foi possível carregar os vínculos com as barbearias.')
          setLinksByUser({})
        } else {
          const map = buildLinksMap((linkRows || []) as unknown as BarbeariaLink[])
          setLinksByUser(map)
          const anyLinks = Object.keys(map).length > 0
          if (apiFailed && !anyLinks && !linksError) {
            setLinksNotice(
              (n) =>
                n ??
                'Não foi possível obter os vínculos pelo servidor. Verifique a service role ou o script SQL 013.',
            )
          }
        }
      } else {
        setLinksByUser(buildLinksMap(rows))
      }
    }

    const { data: barRows } = await supabase.from('barbearias').select('*').order('nome')
    setBarbearias((barRows || []) as Barbearia[])

    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    setPage(1)
  }, [search, tab, sortBy])

  async function handleCreate() {
    if (!form.nome || !form.email || form.password.length < 6) return
    if (form.role === 'admin' && form.barbearia_ids.length === 0) return

    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/platform/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          password: form.password,
          role: form.role,
          barbearia_ids: form.role === 'admin' ? form.barbearia_ids : undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Não foi possível criar o usuário.')
        setIsSaving(false)
        return
      }
    } catch {
      setError('Não foi possível criar o usuário.')
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    setForm({ nome: '', email: '', password: '', role: 'admin', barbearia_ids: [] })
    setIsLoading(true)
    await loadAll()
  }

  async function handleLinkByEmail() {
    const email = linkForm.email.trim().toLowerCase()
    if (!email || !linkForm.barbearia_id) return
    if (linkForm.createIfMissing) {
      if (!linkForm.nome.trim() || linkForm.password.length < 6) return
    }

    setLinkSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/platform/barbearia-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          barbearia_id: linkForm.barbearia_id,
          email,
          role: linkForm.role,
          create_if_missing: linkForm.createIfMissing,
          ...(linkForm.createIfMissing
            ? { nome: linkForm.nome.trim(), password: linkForm.password }
            : {}),
        }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        error?: string
        already_linked?: boolean
        created_user?: boolean
      }
      if (!res.ok) {
        setError(
          typeof json.error === 'string'
            ? json.error
            : 'Não foi possível vincular o usuário à barbearia.',
        )
        setLinkSaving(false)
        return
      }
    } catch {
      setError('Não foi possível vincular o usuário à barbearia.')
      setLinkSaving(false)
      return
    }

    setLinkSaving(false)
    setLinkDialogOpen(false)
    setLinkForm({
      email: '',
      barbearia_id: '',
      role: 'admin',
      createIfMissing: false,
      nome: '',
      password: '',
    })
    setIsLoading(true)
    await loadAll()
  }

  function openEditProfile(p: Profile) {
    setEditBarbeariaSearchReset((t) => t + 1)
    const links = linksByUser[p.id] || []
    const adminBarIds = links
      .filter((l) => l.role === 'admin')
      .map((l) => l.barbearia?.id)
      .filter((id): id is string => Boolean(id))
    setEditProfile(p)
    setEditFormNome(p.nome)
    setEditFormEmail(normalizeEmailInput(p.email || ''))
    setEditFormRole(p.role)
    setEditFormBarbeariaIds([...adminBarIds])
    setEditBaseline({
      nome: p.nome,
      email: p.email,
      role: p.role,
      barbearia_ids: [...adminBarIds],
    })
  }

  function editFormIsDirty(): boolean {
    if (!editBaseline) return false
    const nome = editFormNome.trim()
    const email = editFormEmail.trim().toLowerCase()
    const effBar =
      editFormRole === 'admin' ? editFormBarbeariaIds : ([] as string[])
    const baseBar = editBaseline.role === 'admin' ? editBaseline.barbearia_ids : []
    return (
      nome !== editBaseline.nome.trim() ||
      email !== editBaseline.email.trim().toLowerCase() ||
      editFormRole !== editBaseline.role ||
      !sameIdSet(effBar, baseBar)
    )
  }

  async function handleSaveEdit() {
    if (!editProfile || currentUserId === editProfile.id) return
    const nome = editFormNome.trim()
    const email = editFormEmail.trim().toLowerCase()
    if (!nome || !email) return
    if (editFormRole === 'admin' && editFormBarbeariaIds.length === 0) return
    if (!editFormIsDirty()) {
      setEditProfile(null)
      setEditBaseline(null)
      return
    }

    setIsSavingEdit(true)
    setError(null)
    try {
      const res = await fetch('/api/platform/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editProfile.id,
          nome,
          email,
          role: editFormRole,
          barbearia_ids: editFormRole === 'admin' ? editFormBarbeariaIds : undefined,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Não foi possível salvar as alterações.')
        setIsSavingEdit(false)
        return
      }
    } catch {
      setError('Não foi possível salvar as alterações.')
      setIsSavingEdit(false)
      return
    }

    setIsSavingEdit(false)
    setEditProfile(null)
    setEditBaseline(null)
    setIsLoading(true)
    await loadAll()
  }

  async function handleAtivoToggle(profileId: string, ativo: boolean) {
    setError(null)
    setTogglingAtivoId(profileId)
    try {
      const res = await fetch('/api/platform/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: profileId, ativo }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(
          typeof json.error === 'string'
            ? json.error
            : 'Não foi possível atualizar o status do usuário.',
        )
        setTogglingAtivoId(null)
        return
      }
    } catch {
      setError('Não foi possível atualizar o status do usuário.')
      setTogglingAtivoId(null)
      return
    }
    setTogglingAtivoId(null)
    setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, ativo } : p)))
  }

  async function handleRevokeLink(linkId: string) {
    setError(null)
    setRevokingLinkId(linkId)
    try {
      const res = await fetch(
        `/api/platform/barbearia-links?id=${encodeURIComponent(linkId)}`,
        { method: 'DELETE', credentials: 'include' },
      )
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(
          typeof json.error === 'string'
            ? json.error
            : 'Não foi possível revogar o acesso à barbearia.',
        )
        setRevokingLinkId(null)
        return
      }
      setLinksByUser((prev) => {
        const next = { ...prev }
        for (const uid of Object.keys(next)) {
          next[uid] = next[uid].filter((l) => l.id !== linkId)
        }
        return next
      })
      setConfirmRevokeLink((c) => (c?.linkId === linkId ? null : c))
    } catch {
      setError('Não foi possível revogar o acesso à barbearia.')
    }
    setRevokingLinkId(null)
  }

  const filtered = useMemo(() => {
    let rows = profiles
    if (tab === 'super') {
      rows = rows.filter((p) => p.role === 'super_admin')
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          ROLE_LABELS[p.role].toLowerCase().includes(q),
      )
    }
    return [...rows].sort((a, b) => {
      switch (sortBy) {
        case 'nome_asc':
          return (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
        case 'nome_desc':
          return (b.nome || '').localeCompare(a.nome || '', 'pt-BR', { sensitivity: 'base' })
        case 'email_asc':
          return (a.email || '').localeCompare(b.email || '', 'pt-BR', { sensitivity: 'base' })
        case 'email_desc':
          return (b.email || '').localeCompare(a.email || '', 'pt-BR', { sensitivity: 'base' })
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return 0
      }
    })
  }, [profiles, search, tab, sortBy])

  const totalPages =
    filtered.length === 0 ? 0 : Math.ceil(filtered.length / pageSize)
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  const pageItems = useMemo(
    () => (totalPages > 0 ? pageNumberItems(currentPage, totalPages) : []),
    [currentPage, totalPages],
  )

  return (
    <PageContainer>
      <AppPageHeader greetingOnly profileHref="/conta/editar" avatarFallback="S" />

      <PageContent className="space-y-4 pb-20 md:pb-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              onClick={() => router.back()}
              aria-label="Voltar"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <PageTitle className="min-w-0 truncate">Usuários</PageTitle>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setLinkDialogOpen(true)}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Vincular por e-mail
            </Button>
            <Button type="button" className="w-full sm:w-auto" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo usuário
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Listagem de contas com papéis Super Admin e Admin. Administradores precisam estar vinculados a
          uma barbearia. Use <span className="font-medium text-foreground">Vincular por e-mail</span> para
          associar uma conta já existente (ou criar uma nova) a uma barbearia pelo e-mail. Você pode
          revogar o acesso por barbearia abaixo.
        </p>

        <div className="flex w-full max-w-md gap-2 rounded-lg border bg-muted/40 p-1">
          <Button
            type="button"
            variant={tab === 'todos' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setTab('todos')}
          >
            Todos
          </Button>
          <Button
            type="button"
            variant={tab === 'super' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setTab('super')}
          >
            Super Admins
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou papel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex w-full shrink-0 flex-wrap items-center gap-x-3 gap-y-2 sm:w-auto sm:justify-end">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial sm:min-w-0">
              <Label
                htmlFor="usuarios-sort"
                className="text-sm text-muted-foreground whitespace-nowrap"
              >
                Ordenar
              </Label>
              <Select
                value={sortBy}
                onValueChange={(v) => {
                  const opt = USUARIOS_SORT_OPTIONS.find((o) => o.value === v)
                  if (opt) setSortBy(opt.value)
                }}
              >
                <SelectTrigger
                  id="usuarios-sort"
                  className="h-9 min-w-[9.5rem] flex-1 sm:flex-initial sm:min-w-[10.5rem]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USUARIOS_SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="usuarios-page-size"
                className="text-sm text-muted-foreground whitespace-nowrap"
              >
                Itens
              </Label>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  const n = Number(v)
                  const opt = PAGE_SIZE_OPTIONS.find((x) => x === n)
                  if (opt !== undefined) {
                    setPageSize(opt)
                    setPage(1)
                  }
                }}
              >
                <SelectTrigger id="usuarios-page-size" className="h-9 w-[4.5rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={String(opt)}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {error && (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {linksNotice ? (
          <Alert
            variant="warning"
            onClose={() => setLinksNotice(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertDescription>{linksNotice}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <SuperUsuarioGridSkeleton count={8} />
        ) : (
        <div
          className={
            filtered.length > 0
              ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'space-y-3'
          }
        >
          {filtered.length > 0 ? (
            paginated.map((p) => {
              const links = linksByUser[p.id] || []
              const isSelf = currentUserId === p.id
              const isAtivo = p.ativo !== false

              return (
                <Card
                  key={p.id}
                  className={cn(
                    'flex min-h-0 flex-col',
                    !isAtivo && 'border-muted-foreground/25 bg-muted/20',
                  )}
                >
                  <CardContent className="flex flex-1 flex-col gap-2.5 p-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{p.nome}</p>
                        <Badge
                          variant={p.role === 'super_admin' ? 'default' : 'secondary'}
                          className={cn(
                            'shrink-0 text-[10px] px-1.5 py-0',
                            p.role === 'super_admin' &&
                              'bg-primary text-primary-foreground hover:bg-primary/90',
                          )}
                        >
                          {ROLE_LABELS[p.role]}
                        </Badge>
                        {!isAtivo ? (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-destructive/50 px-1.5 py-0 text-[10px] text-destructive"
                          >
                            Inativo
                          </Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground" title={p.email}>
                        {p.email}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        disabled={isSelf}
                        title={
                          isSelf ? 'Você não pode editar seu próprio usuário aqui.' : 'Editar usuário'
                        }
                        onClick={() => openEditProfile(p)}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5 shrink-0" />
                        Editar
                      </Button>
                      {isAtivo ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-destructive/40 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={isSelf || togglingAtivoId === p.id}
                          onClick={() => setConfirmDeactivate(p)}
                          title={
                            isSelf
                              ? 'Você não pode desativar a própria conta aqui.'
                              : 'Desativar usuário'
                          }
                        >
                          {togglingAtivoId === p.id ? (
                            <Spinner className="mr-1 h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <UserX className="mr-1 h-3.5 w-3.5 shrink-0" />
                          )}
                          Desativar
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          disabled={togglingAtivoId === p.id}
                          onClick={() => void handleAtivoToggle(p.id, true)}
                        >
                          {togglingAtivoId === p.id ? (
                            <Spinner className="mr-1 h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <UserCheck className="mr-1 h-3.5 w-3.5 shrink-0" />
                          )}
                          Reativar
                        </Button>
                      )}
                    </div>

                    {p.role !== 'super_admin' ? (
                      <div className="mt-auto border-t pt-2">
                        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Barbearias
                        </p>
                        {links.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Nenhum vínculo.</p>
                        ) : (
                          <ul className="max-h-28 space-y-1 overflow-y-auto pr-0.5">
                            {links.map((l) => (
                              <li
                                key={l.id}
                                className="flex items-center justify-between gap-1 rounded border bg-muted/30 px-2 py-1 text-xs"
                              >
                                <div className="min-w-0 leading-tight">
                                  <span className="line-clamp-1 font-medium">
                                    {l.barbearia?.nome ?? 'Barbearia'}
                                  </span>
                                  <span className="text-muted-foreground"> · {ROLE_LABELS[l.role]}</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setConfirmRevokeLink({
                                      linkId: l.id,
                                      usuarioNome: p.nome,
                                      barbeariaNome: l.barbearia?.nome ?? 'Barbearia',
                                    })
                                  }
                                  title="Revogar acesso"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <div className="mt-auto border-t pt-2">
                        <div
                          className={cn(
                            'flex gap-2 rounded-md border px-2.5 py-2',
                            'border-primary/35 bg-primary/[0.08] text-foreground',
                            'dark:border-primary/40 dark:bg-primary/[0.12] dark:text-foreground',
                          )}
                        >
                          <Shield
                            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                            aria-hidden
                          />
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-xs font-semibold leading-tight">
                              Acesso a todas as barbearias
                            </p>
                            <p className="text-[11px] leading-snug text-muted-foreground">
                              Super Admin não utiliza vínculos por barbearia: o acesso é global à
                              plataforma.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nenhum usuário nesta visão.
              </CardContent>
            </Card>
          )}
        </div>
        )}

        {!isLoading && filtered.length > 0 && totalPages > 0 ? (
          <div className="border-t pt-4">
            <Pagination className="mx-0 flex w-full max-w-full flex-col items-center gap-2">
              <PaginationContent className="flex h-9 flex-row flex-wrap items-center justify-center gap-1">
                <PaginationItem>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1 px-2.5"
                    disabled={currentPage <= 1}
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
                        variant={item === currentPage ? 'default' : 'ghost'}
                        size="icon"
                        className={cn(
                          'h-9 min-w-9',
                          item === currentPage && 'pointer-events-none font-semibold',
                        )}
                        onClick={() => setPage(item)}
                        aria-label={`Página ${item}`}
                        aria-current={item === currentPage ? 'page' : undefined}
                      >
                        {item}
                      </Button>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1 px-2.5"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Próxima página"
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
              <p className="text-center text-xs text-muted-foreground">
                Página {currentPage} de {totalPages} · {filtered.length}{' '}
                {filtered.length === 1 ? 'usuário' : 'usuários'}
              </p>
            </Pagination>
          </div>
        ) : null}
      </PageContent>

      <AlertDialog
        open={!!confirmDeactivate}
        onOpenChange={(open) => {
          if (!open) setConfirmDeactivate(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeactivate
                ? `${confirmDeactivate.nome} não poderá entrar no sistema até ser reativado.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={!confirmDeactivate || !!togglingAtivoId}
              onClick={() => {
                const target = confirmDeactivate
                if (!target) return
                setConfirmDeactivate(null)
                void handleAtivoToggle(target.id, false)
              }}
            >
              {togglingAtivoId ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Desativar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!confirmRevokeLink}
        onOpenChange={(open) => {
          if (!open) setConfirmRevokeLink(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar acesso à barbearia?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRevokeLink ? (
                <>
                  Remover o acesso de{' '}
                  <span className="font-medium text-foreground">
                    {confirmRevokeLink.usuarioNome}
                  </span>{' '}
                  à barbearia{' '}
                  <span className="font-medium text-foreground">
                    {confirmRevokeLink.barbeariaNome}
                  </span>
                  . Essa pessoa deixa de ver e usar essa barbearia no sistema.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={!confirmRevokeLink || revokingLinkId === confirmRevokeLink?.linkId}
              onClick={() => {
                const target = confirmRevokeLink
                if (!target) return
                void handleRevokeLink(target.linkId)
              }}
            >
              {confirmRevokeLink && revokingLinkId === confirmRevokeLink.linkId ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : null}
              Revogar acesso
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={linkDialogOpen}
        onOpenChange={(open) => {
          setLinkDialogOpen(open)
          if (!open) {
            setLinkForm({
              email: '',
              barbearia_id: '',
              role: 'admin',
              createIfMissing: false,
              nome: '',
              password: '',
            })
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular à barbearia por e-mail</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="link-email">E-mail do usuário</Label>
              <Input
                id="link-email"
                type="email"
                autoComplete="off"
                value={linkForm.email}
                onChange={(e) =>
                  setLinkForm((s) => ({ ...s, email: normalizeEmailInput(e.target.value) }))
                }
                placeholder="conta@exemplo.com"
              />
              <p className="text-xs text-muted-foreground">
                O e-mail deve ser o mesmo cadastrado no login. Se não existir conta, ative a opção abaixo
                para criar.
              </p>
            </div>
            <div className="space-y-1">
              <Label>Barbearia</Label>
              <Select
                value={linkForm.barbearia_id || undefined}
                onValueChange={(v) => setLinkForm((s) => ({ ...s, barbearia_id: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a barbearia..." />
                </SelectTrigger>
                <SelectContent>
                  {barbearias.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Papel nesta barbearia</Label>
              <Select
                value={linkForm.role}
                onValueChange={(v) => setLinkForm((s) => ({ ...s, role: v as UserRole }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VINCULO_NA_BARBEARIA_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
              <div className="min-w-0 space-y-0.5">
                <Label htmlFor="link-create-missing" className="text-sm font-medium">
                  Criar usuário se o e-mail não existir
                </Label>
                <p className="text-xs text-muted-foreground">
                  Caso contrário, o sistema apenas retorna erro quando não encontrar o e-mail.
                </p>
              </div>
              <Switch
                id="link-create-missing"
                checked={linkForm.createIfMissing}
                onCheckedChange={(checked) =>
                  setLinkForm((s) => ({ ...s, createIfMissing: checked }))
                }
              />
            </div>
            {linkForm.createIfMissing ? (
              <>
                <div className="space-y-1">
                  <Label htmlFor="link-nome">Nome (nova conta)</Label>
                  <Input
                    id="link-nome"
                    value={linkForm.nome}
                    onChange={(e) => setLinkForm((s) => ({ ...s, nome: e.target.value }))}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="link-senha">Senha inicial</Label>
                  <Input
                    id="link-senha"
                    type="password"
                    autoComplete="new-password"
                    value={linkForm.password}
                    onChange={(e) => setLinkForm((s) => ({ ...s, password: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</p>
                </div>
              </>
            ) : null}
            <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
              Vínculos duplicados (mesmo usuário e mesma barbearia) são ignorados com sucesso. Exige{' '}
              <code className="text-foreground">SUPABASE_SERVICE_ROLE_KEY</code> no servidor.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleLinkByEmail()}
              disabled={
                linkSaving ||
                !linkForm.email.trim() ||
                !linkForm.barbearia_id ||
                (linkForm.createIfMissing &&
                  (!linkForm.nome.trim() || linkForm.password.length < 6))
              }
            >
              {linkSaving ? <Spinner className="mr-2" /> : null}
              {linkSaving ? 'Vinculando...' : 'Vincular'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (open) setCreateBarbeariaSearchReset((t) => t + 1)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="nu-nome">Nome</Label>
              <Input
                id="nu-nome"
                value={form.nome}
                onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nu-email">Email</Label>
              <Input
                id="nu-email"
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) =>
                  setForm((s) => ({ ...s, email: normalizeEmailInput(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nu-senha">Senha inicial</Label>
              <Input
                id="nu-senha"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</p>
            </div>
            <div className="space-y-1">
              <Label>Papel</Label>
              <Select
                value={form.role}
                onValueChange={(v) => {
                  const r = v as UserRole
                  setForm((s) => ({
                    ...s,
                    role: r,
                    barbearia_ids: r === 'admin' ? s.barbearia_ids : [],
                  }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPER_USUARIOS_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.role === 'admin' && (
              <BarbeariasMultiSelect
                id="nu-barbearias"
                label="Barbearias"
                options={barbearias.map((b) => ({ id: b.id, nome: b.nome }))}
                value={form.barbearia_ids}
                onChange={(ids) => setForm((s) => ({ ...s, barbearia_ids: ids }))}
                resetSearchToken={createBarbeariaSearchReset}
              />
            )}
            <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
              É necessário configurar <code className="text-foreground">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
              no servidor para este cadastro funcionar.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                isSaving ||
                !form.nome ||
                !form.email ||
                form.password.length < 6 ||
                (form.role === 'admin' && form.barbearia_ids.length === 0)
              }
            >
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editProfile}
        onOpenChange={(open) => {
          if (!open) {
            setEditProfile(null)
            setEditBaseline(null)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>

          {editProfile ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="edit-nome">Nome</Label>
                <Input
                  id="edit-nome"
                  value={editFormNome}
                  onChange={(e) => setEditFormNome(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormEmail}
                  onChange={(e) => setEditFormEmail(normalizeEmailInput(e.target.value))}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-role">Papel global</Label>
                <Select
                  value={editFormRole}
                  onValueChange={(v) => {
                    const r = v as UserRole
                    setEditFormRole(r)
                    if (r !== 'admin') setEditFormBarbeariaIds([])
                  }}
                >
                  <SelectTrigger id="edit-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPER_USUARIOS_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editFormRole === 'admin' && (
                <div className="space-y-1">
                  <BarbeariasMultiSelect
                    id="edit-barbearias"
                    label="Barbearias"
                    options={barbearias.map((b) => ({ id: b.id, nome: b.nome }))}
                    value={editFormBarbeariaIds}
                    onChange={setEditFormBarbeariaIds}
                    resetSearchToken={editBarbeariaSearchReset}
                  />
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditProfile(null)
                setEditBaseline(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void handleSaveEdit()}
              disabled={
                !editProfile ||
                isSavingEdit ||
                currentUserId === editProfile.id ||
                !editFormNome.trim() ||
                !editFormEmail.trim() ||
                (editFormRole === 'admin' && editFormBarbeariaIds.length === 0) ||
                !editFormIsDirty()
              }
            >
              {isSavingEdit ? <Spinner className="mr-2" /> : null}
              {isSavingEdit ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
