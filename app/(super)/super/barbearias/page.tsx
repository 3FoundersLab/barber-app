'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import type { Barbearia } from '@/types'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function SuperBarbeariasPage() {
  const router = useRouter()
  const [barbearias, setBarbearias] = useState<Barbearia[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    slug: '',
    telefone: '',
    email: '',
    endereco: '',
  })

  useEffect(() => {
    loadBarbearias()
  }, [])

  async function loadBarbearias() {
    const supabase = createClient()
    setError(null)

    const { data, error: queryError } = await supabase
      .from('barbearias')
      .select('*')
      .order('created_at', { ascending: false })

    if (queryError) {
      setError('Não foi possível carregar as barbearias')
      setBarbearias([])
    } else {
      setBarbearias(data || [])
    }

    setIsLoading(false)
  }

  async function handleCreate() {
    if (!form.nome || !form.slug) return
    setIsSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('barbearias')
      .insert({
        nome: form.nome,
        slug: form.slug,
        telefone: form.telefone || null,
        email: form.email || null,
        endereco: form.endereco || null,
      })

    if (insertError) {
      setError('Não foi possível criar a barbearia')
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    setForm({ nome: '', slug: '', telefone: '', email: '', endereco: '' })
    loadBarbearias()
  }

  async function handleImpersonate(barbeariaId: string) {
    const supabase = createClient()
    setError(null)

    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id
    if (!userId) {
      setError('Usuário não autenticado')
      return
    }

    const { error: upsertError } = await supabase
      .from('barbearia_users')
      .upsert(
        {
          barbearia_id: barbeariaId,
          user_id: userId,
          role: 'admin',
        },
        { onConflict: 'barbearia_id,user_id' }
      )

    if (upsertError) {
      setError('Não foi possível acessar esta barbearia')
      return
    }

    router.push('/admin/dashboard')
  }

  const filtered = useMemo(() => {
    if (!search) return barbearias
    const q = search.toLowerCase()
    return barbearias.filter((b) => b.nome.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q))
  }, [barbearias, search])

  return (
    <PageContainer>
      <AppPageHeader
        title="Barbearias"
        profileHref="/super/perfil/editar"
        avatarFallback="S"
      />

      <PageContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            className="w-full shrink-0 sm:w-auto"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova barbearia
          </Button>
        </div>

        {error && (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">Carregando...</CardContent>
            </Card>
          ) : filtered.length > 0 ? (
            filtered.map((barbearia) => (
              <Card key={barbearia.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{barbearia.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">/{barbearia.slug}</p>
                  </div>
                  <Button size="sm" onClick={() => handleImpersonate(barbearia.id)}>
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma barbearia encontrada
              </CardContent>
            </Card>
          )}
        </div>
      </PageContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Barbearia</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => {
                  const nome = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    nome,
                    slug: prev.slug || slugify(nome),
                  }))
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) => setForm((prev) => ({ ...prev, telefone: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={form.endereco}
                onChange={(e) => setForm((prev) => ({ ...prev, endereco: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSaving || !form.nome || !form.slug}>
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Salvando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
