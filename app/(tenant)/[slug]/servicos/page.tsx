'use client'

import { useEffect, useMemo, useState } from 'react'
import { PackageOpen, Plus, Search, Sparkles } from 'lucide-react'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { ServiceCard } from '@/components/domain/service-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ServiceCardSkeleton } from '@/components/shared/loading-skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { toast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { cn } from '@/lib/utils'
import type { Servico } from '@/types'

type ServiceFilter = 'todos' | 'inativos'
type DurationUnit = 'minutos' | 'horas'

const FILTER_CHIPS: Array<{ value: ServiceFilter; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'inativos', label: 'Inativos' },
]

const MOCK_SERVICOS: Servico[] = [
  {
    id: 'mock-1',
    barbearia_id: 'mock',
    nome: 'Corte Degradê',
    descricao: 'Corte degradê moderno com acabamento na navalha.',
    preco: 55,
    duracao: 40,
    ativo: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'mock-2',
    barbearia_id: 'mock',
    nome: 'Barba Premium',
    descricao: 'Modelagem completa com toalha quente e hidratação.',
    preco: 45,
    duracao: 35,
    ativo: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'mock-3',
    barbearia_id: 'mock',
    nome: 'Combo Corte + Barba',
    descricao: 'Pacote completo para renovar o visual.',
    preco: 90,
    duracao: 70,
    ativo: false,
    created_at: '',
    updated_at: '',
  },
]

function parseBrlCurrency(value: string): number {
  const onlyDigits = value.replace(/\D/g, '')
  if (!onlyDigits) return 0
  return Number(onlyDigits) / 100
}

function formatBrlInput(value: string): string {
  const amount = parseBrlCurrency(value)
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function pluralizeServices(count: number): string {
  return `${count} ${count === 1 ? 'serviço cadastrado' : 'serviços cadastrados'}`
}

export default function AdminServicosPage() {
  const { slug, base } = useTenantAdminBase()

  const [servicosReais, setServicosReais] = useState<Servico[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<ServiceFilter>('todos')
  const [showMockData, setShowMockData] = useState(false)
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingServico, setEditingServico] = useState<Servico | null>(null)
  const [serviceToDelete, setServiceToDelete] = useState<Servico | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '0,00',
    duracao: '30',
    duracaoUnidade: 'minutos' as DurationUnit,
    ativo: true,
  })

  useEffect(() => {
    void loadServicos()
  }, [slug])

  const isUsingMockData = showMockData
  const sourceServicos = isUsingMockData ? MOCK_SERVICOS : servicosReais

  const filteredServicos = useMemo<Servico[]>(() => {
    const q = searchTerm.trim().toLowerCase()
    return sourceServicos.filter((s) => {
      const matchesFilter = selectedFilter === 'todos' ? true : !s.ativo

      if (!matchesFilter) return false
      if (!q) return true

      return s.nome.toLowerCase().includes(q) || (s.descricao?.toLowerCase().includes(q) ?? false)
    })
  }, [searchTerm, selectedFilter, sourceServicos])

  async function loadServicos() {
    setIsLoading(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const barbeariaIdResolved = await resolveAdminBarbeariaId(supabase, user.id, { slug })
      if (barbeariaIdResolved) {
        setBarbeariaId(barbeariaIdResolved)
        const { data } = await supabase.from('servicos').select('*').eq('barbearia_id', barbeariaIdResolved).order('nome')
        if (data) setServicosReais(data)
      }
    }

    setIsLoading(false)
  }

  function resetForm() {
    setFormData({
      nome: '',
      descricao: '',
      preco: '0,00',
      duracao: '30',
      duracaoUnidade: 'minutos',
      ativo: true,
    })
  }

  function handleOpenNew() {
    setEditingServico(null)
    resetForm()
    setIsDialogOpen(true)
  }

  function handleEdit(servico: Servico) {
    setEditingServico(servico)
    setFormData({
      nome: servico.nome,
      descricao: servico.descricao || '',
      preco: formatBrlInput(String(servico.preco)),
      duracao: String(servico.duracao >= 60 && servico.duracao % 60 === 0 ? servico.duracao / 60 : servico.duracao),
      duracaoUnidade: servico.duracao >= 60 && servico.duracao % 60 === 0 ? 'horas' : 'minutos',
      ativo: servico.ativo,
    })
    setIsDialogOpen(true)
  }

  function handleRequestDelete(servico: Servico) {
    setServiceToDelete(servico)
    setIsDeleteDialogOpen(true)
  }

  function closeDeleteDialog() {
    setIsDeleteDialogOpen(false)
    setServiceToDelete(null)
  }

  async function handleDelete() {
    if (!serviceToDelete) return
    setIsDeleting(true)
    const supabase = createClient()
    await supabase.from('servicos').delete().eq('id', serviceToDelete.id)
    setIsDeleting(false)
    closeDeleteDialog()
    if (editingServico?.id === serviceToDelete.id) {
      setIsDialogOpen(false)
      setEditingServico(null)
    }
    toast({ title: 'Serviço excluído' })
    void loadServicos()
  }

  async function handleDuplicate(servico: Servico) {
    if (!barbeariaId) return
    const supabase = createClient()
    const payload: Record<string, unknown> = {
      barbearia_id: barbeariaId,
      nome: `${servico.nome} (Cópia)`,
      descricao: servico.descricao ?? null,
      preco: servico.preco,
      duracao: servico.duracao,
      ativo: servico.ativo,
    }
    await supabase.from('servicos').insert(payload)
    toast({ title: 'Serviço criado com sucesso' })
    void loadServicos()
  }

  async function handleToggleStatus(servico: Servico) {
    const supabase = createClient()
    await supabase.from('servicos').update({ ativo: !servico.ativo }).eq('id', servico.id)
    toast({ title: `Serviço ${servico.ativo ? 'desativado' : 'ativado'}` })
    void loadServicos()
  }

  async function handleSave() {
    if (!barbeariaId) return
    const minutes = Number(formData.duracao || '0')
    if (!formData.nome.trim() || minutes <= 0 || parseBrlCurrency(formData.preco) <= 0) return

    setIsSaving(true)
    const supabase = createClient()
    const servicoData: Record<string, unknown> = {
      barbearia_id: barbeariaId,
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim() || null,
      preco: parseBrlCurrency(formData.preco),
      duracao: formData.duracaoUnidade === 'horas' ? minutes * 60 : minutes,
      ativo: formData.ativo,
    }

    if (editingServico) {
      await supabase.from('servicos').update(servicoData).eq('id', editingServico.id)
      toast({ title: 'Serviço atualizado' })
    } else {
      await supabase.from('servicos').insert(servicoData)
      toast({ title: 'Serviço criado com sucesso' })
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    void loadServicos()
  }

  const canSave =
    formData.nome.trim().length > 0 &&
    Number(formData.duracao || '0') > 0 &&
    parseBrlCurrency(formData.preco) > 0

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader title="Serviços" profileHref={`${base}/configuracoes`} avatarFallback="A" />

      <PageContent className="space-y-4 md:space-y-5">
        <div className="space-y-3 rounded-xl border p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Serviços</h1>
              <p className="text-sm text-muted-foreground">{pluralizeServices(servicosReais.length)}</p>
            </div>
            <Button
              className="w-full shrink-0 bg-[#E05A2A] text-white hover:bg-[#C44D22] sm:w-auto"
              size="sm"
              onClick={handleOpenNew}
            >
              <Plus className="mr-1 h-4 w-4" />
              Novo Serviço
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2.5">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Exibir dados fictícios</p>
              <p className="text-xs text-muted-foreground">Útil para visualizar a tela quando ainda não há serviços reais.</p>
            </div>
            <Switch checked={showMockData} onCheckedChange={setShowMockData} />
          </div>

          {servicosReais.length === 0 && (
            <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Nenhum serviço real cadastrado no momento.
              {showMockData
                ? ' Você está visualizando dados fictícios.'
                : ' Ative o toggle de dados fictícios para visualizar exemplos.'}
            </div>
          )}

          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTER_CHIPS.map((chip) => (
              <Button
                key={chip.value}
                size="sm"
                variant="outline"
                onClick={() => setSelectedFilter(chip.value)}
                className={cn(
                  'rounded-full',
                  selectedFilter === chip.value
                    ? 'border-[#E05A2A] bg-[#E05A2A] text-white hover:bg-[#C44D22] hover:text-white'
                    : 'border-border bg-transparent',
                )}
              >
                {chip.label}
              </Button>
            ))}
          </div>
        </div>

        <div
          className={
            isLoading || sourceServicos.length > 0
              ? 'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5'
              : undefined
          }
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <ServiceCardSkeleton key={i} className="h-full min-h-[9rem]" />
            ))
          ) : filteredServicos.length > 0 ? (
            filteredServicos.map((servico) => (
              <ServiceCard
                key={servico.id}
                service={servico}
                onEdit={isUsingMockData ? undefined : handleEdit}
                onDelete={isUsingMockData ? undefined : () => handleRequestDelete(servico)}
                onDuplicate={isUsingMockData ? undefined : handleDuplicate}
                onToggleStatus={isUsingMockData ? undefined : handleToggleStatus}
              />
            ))
          ) : (
            <Card className="border-dashed md:col-span-2 xl:col-span-3">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 rounded-full bg-[#E05A2A]/10 p-4 text-[#E05A2A]">
                  <PackageOpen className="h-7 w-7" />
                </div>
                <p className="font-medium">
                  {searchTerm.trim() || selectedFilter !== 'todos'
                    ? 'Nenhum serviço encontrado'
                    : 'Nenhum serviço cadastrado'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cadastre os serviços da sua barbearia para agilizar o atendimento.
                </p>
                {!searchTerm.trim() && selectedFilter === 'todos' && (
                  <Button
                    size="sm"
                    className="mt-4 bg-[#E05A2A] text-white hover:bg-[#C44D22]"
                    onClick={handleOpenNew}
                  >
                    <Sparkles className="mr-1 h-4 w-4" />
                    Criar primeiro serviço
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </PageContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingServico ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do serviço *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Corte Degradê"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição opcional do serviço"
                className="min-h-[96px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="duracao">Tempo estimado *</Label>
                <Input
                  id="duracao"
                  type="number"
                  min={1}
                  value={formData.duracao}
                  onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                  placeholder="40"
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select
                  value={formData.duracaoUnidade}
                  onValueChange={(value) => setFormData({ ...formData, duracaoUnidade: value as DurationUnit })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutos">Minutos</SelectItem>
                    <SelectItem value="horas">Horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco">Preço (BRL) *</Label>
              <Input
                id="preco"
                inputMode="decimal"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                onBlur={() => setFormData((prev) => ({ ...prev, preco: formatBrlInput(prev.preco) }))}
                placeholder="55,00"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-3">
              <Label htmlFor="ativo" className="cursor-pointer">
                Status
              </Label>
              <div className="flex items-center gap-2">
                <Badge variant={formData.ativo ? 'default' : 'secondary'}>
                  {formData.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            {editingServico && (
              <Button
                type="button"
                variant="ghost"
                className="mr-auto text-destructive hover:bg-transparent hover:text-destructive"
                onClick={() => handleRequestDelete(editingServico)}
              >
                Excluir
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-[#E05A2A] text-white hover:bg-[#C44D22]"
              onClick={handleSave}
              disabled={isSaving || !canSave}
            >
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O serviço será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner className="mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TenantPanelPageContainer>
  )
}
