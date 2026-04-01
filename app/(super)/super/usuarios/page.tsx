'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LABELS } from '@/lib/constants'
import type { Barbearia, Profile, UserRole } from '@/types'
import { cn } from '@/lib/utils'

const ROLES: UserRole[] = ['super_admin', 'admin', 'barbeiro', 'cliente']

type BarbeariaLink = {
  id: string
  user_id: string
  role: UserRole
  barbearia: { id: string; nome: string } | null
}

export default function SuperUsuariosPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [linksByUser, setLinksByUser] = useState<Record<string, BarbeariaLink[]>>({})
  const [barbearias, setBarbearias] = useState<Barbearia[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'todos' | 'super'>('todos')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'cliente' as UserRole,
    barbearia_id: '',
  })

  const loadAll = useCallback(async () => {
    const supabase = createClient()
    setError(null)

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
      const { data: linkRows, error: linksError } = await supabase
        .from('barbearia_users')
        .select('id, user_id, role, barbearia:barbearias(id, nome)')
        .in('user_id', ids)

      if (linksError) {
        setLinksByUser({})
      } else {
        const map: Record<string, BarbeariaLink[]> = {}
        for (const row of linkRows || []) {
          const r = row as unknown as BarbeariaLink
          if (!map[r.user_id]) map[r.user_id] = []
          map[r.user_id].push(r)
        }
        setLinksByUser(map)
      }
    }

    const { data: barRows } = await supabase.from('barbearias').select('*').order('nome')
    setBarbearias((barRows || []) as Barbearia[])

    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  async function handleCreate() {
    if (!form.nome || !form.email || form.password.length < 6) return
    if ((form.role === 'admin' || form.role === 'barbeiro') && !form.barbearia_id) return

    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/super/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          password: form.password,
          role: form.role,
          barbearia_id:
            form.role === 'admin' || form.role === 'barbeiro' ? form.barbearia_id : undefined,
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
    setForm({ nome: '', email: '', password: '', role: 'cliente', barbearia_id: '' })
    setIsLoading(true)
    await loadAll()
  }

  async function handleRoleChange(profileId: string, role: UserRole) {
    const supabase = createClient()
    setError(null)
    const { error: upErr } = await supabase.from('profiles').update({ role }).eq('id', profileId)
    if (upErr) {
      setError('Não foi possível atualizar o papel.')
      return
    }
    setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, role } : p)))
  }

  async function handleRevokeLink(linkId: string) {
    const supabase = createClient()
    setError(null)
    const { error: delErr } = await supabase.from('barbearia_users').delete().eq('id', linkId)
    if (delErr) {
      setError('Não foi possível revogar o acesso à barbearia.')
      return
    }
    setLinksByUser((prev) => {
      const next = { ...prev }
      for (const uid of Object.keys(next)) {
        next[uid] = next[uid].filter((l) => l.id !== linkId)
      }
      return next
    })
  }

  const filtered = useMemo(() => {
    let rows = profiles
    if (tab === 'super') {
      rows = rows.filter((p) => p.role === 'super_admin')
    }
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        ROLE_LABELS[p.role].toLowerCase().includes(q),
    )
  }, [profiles, search, tab])

  return (
    <PageContainer>
      <AppPageHeader title="Usuários" profileHref="/super/perfil/editar" avatarFallback="S" />

      <PageContent className="space-y-4 pb-20 md:pb-6">
        <p className="text-sm text-muted-foreground">
          Listagem de contas com papéis Super Admin e Admin. Cadastre também barbeiros e clientes pelo
          formulário abaixo (eles não aparecem nesta lista). Para administradores e barbeiros, vincule
          uma barbearia. Você pode revogar o acesso por barbearia abaixo.
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
          <Button className="w-full shrink-0 sm:w-auto" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo usuário
          </Button>
        </div>

        {error && (
          <Card className="border-dashed border-destructive/50">
            <CardContent className="py-4 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Carregando...
              </CardContent>
            </Card>
          ) : filtered.length > 0 ? (
            filtered.map((p) => {
              const links = linksByUser[p.id] || []
              const isSelf = currentUserId === p.id

              return (
                <Card key={p.id}>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{p.nome}</p>
                          <Badge
                            variant={p.role === 'super_admin' ? 'default' : 'secondary'}
                            className={cn(p.role === 'super_admin' && 'bg-amber-600 hover:bg-amber-600')}
                          >
                            {ROLE_LABELS[p.role]}
                          </Badge>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">{p.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Criado em {new Date(p.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div className="w-full space-y-1 sm:w-52">
                        <Label className="text-xs text-muted-foreground">Papel global</Label>
                        <Select
                          value={p.role}
                          disabled={isSelf}
                          onValueChange={(v) => handleRoleChange(p.id, v as UserRole)}
                        >
                          <SelectTrigger className="w-full" size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isSelf ? (
                          <p className="text-xs text-muted-foreground">
                            Você não pode alterar seu próprio papel aqui.
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Acessos às barbearias
                      </p>
                      {links.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum vínculo.</p>
                      ) : (
                        <ul className="space-y-2">
                          {links.map((l) => (
                            <li
                              key={l.id}
                              className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                            >
                              <div className="min-w-0">
                                <span className="truncate font-medium">
                                  {l.barbearia?.nome ?? 'Barbearia'}
                                </span>
                                <span className="text-muted-foreground">
                                  {' '}
                                  · {ROLE_LABELS[l.role]}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-destructive hover:text-destructive"
                                onClick={() => handleRevokeLink(l.id)}
                                title="Revogar acesso"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
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
      </PageContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
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
                onValueChange={(v) =>
                  setForm((s) => ({ ...s, role: v as UserRole, barbearia_id: '' }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(form.role === 'admin' || form.role === 'barbeiro') && (
              <div className="space-y-1">
                <Label>Barbearia</Label>
                <Select
                  value={form.barbearia_id || undefined}
                  onValueChange={(v) => setForm((s) => ({ ...s, barbearia_id: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
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
                ((form.role === 'admin' || form.role === 'barbeiro') && !form.barbearia_id)
              }
            >
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
