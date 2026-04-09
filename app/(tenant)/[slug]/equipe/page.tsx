'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { PageContent } from '@/components/shared/page-container'
import { TeamMemberCard } from '@/components/domain/team-member-card'
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
import { TeamMemberCardSkeleton } from '@/components/shared/loading-skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { maskTelefoneBr, normalizeEmailInput } from '@/lib/format-contato'
import type { Barbeiro } from '@/types'

export default function TenantEquipePage() {
  const { slug, base } = useTenantAdminBase()

  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingBarbeiro, setEditingBarbeiro] = useState<Barbeiro | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    ativo: true,
  })

  useEffect(() => {
    loadBarbeiros()
  }, [slug])

  const filteredBarbeiros = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return barbeiros
    return barbeiros.filter(
      (b) =>
        b.nome.toLowerCase().includes(q) ||
        (b.telefone?.includes(searchTerm.trim()) ?? false) ||
        (b.email?.toLowerCase().includes(q) ?? false),
    )
  }, [searchTerm, barbeiros])

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
    setFormData({
      nome: '',
      telefone: '',
      email: '',
      ativo: true,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (barbeiro: Barbeiro) => {
    setEditingBarbeiro(barbeiro)
    setFormData({
      nome: barbeiro.nome,
      telefone: maskTelefoneBr(barbeiro.telefone || ''),
      email: normalizeEmailInput(barbeiro.email || ''),
      ativo: barbeiro.ativo,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este barbeiro?')) return

    const supabase = createClient()
    const { error: deleteError } = await supabase.from('barbeiros').delete().eq('id', id)
    if (deleteError) {
      setError('Não foi possível excluir o barbeiro')
      return
    }
    loadBarbeiros()
  }

  const handleSave = async () => {
    if (!barbeariaId) return

    setIsSaving(true)
    const supabase = createClient()

    const barbeiroData = {
      barbearia_id: barbeariaId,
      nome: formData.nome,
      telefone: formData.telefone || null,
      email: formData.email || null,
      ativo: formData.ativo,
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
    } else {
      const { error: insertError } = await supabase.from('barbeiros').insert(barbeiroData)
      if (insertError) {
        setError('Não foi possível criar o barbeiro')
        setIsSaving(false)
        return
      }
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    loadBarbeiros()
  }

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader title="Equipe" profileHref={`${base}/configuracoes`} avatarFallback="A" />

      <PageContent className="space-y-4 md:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:gap-6">
          <div className="relative min-w-0 flex-1 lg:max-w-2xl xl:max-w-3xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button className="w-full shrink-0 sm:w-auto" size="sm" onClick={handleOpenNew}>
            <Plus className="mr-1 h-4 w-4" />
            Novo
          </Button>
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
              ? 'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3 xl:gap-5'
              : undefined
          }
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <TeamMemberCardSkeleton key={i} />)
          ) : filteredBarbeiros.length > 0 ? (
            filteredBarbeiros.map((barbeiro) => (
              <TeamMemberCard
                key={barbeiro.id}
                barbeiro={barbeiro}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <Card className="border-dashed md:col-span-2 xl:col-span-3">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm.trim() ? 'Nenhum profissional encontrado' : 'Nenhum barbeiro cadastrado'}
                </p>
                {!searchTerm.trim() && (
                  <Button size="sm" className="mt-3" onClick={handleOpenNew}>
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar barbeiro
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </PageContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg lg:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBarbeiro ? 'Editar barbeiro' : 'Novo barbeiro'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-x-4 lg:gap-y-4 lg:space-y-0">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do barbeiro"
              />
            </div>

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
                Barbeiro ativo
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
    </TenantPanelPageContainer>
  )
}
