'use client'

import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle2,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Repeat2,
  Users,
} from 'lucide-react'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { cn } from '@/lib/utils'

type PlanStatus = 'ativo' | 'inativo'
type PlanCategory = 'mensal' | 'trimestral' | 'anual' | 'personalizado'
type ViewMode = 'cards' | 'lista'

interface PlanService {
  id: string
  label: string
  quantity: number
  icon: string
}

interface Plan {
  id: string
  name: string
  description: string
  status: PlanStatus
  monthlyPrice: number
  savingsPercent: number
  activeSubscribers: number
  autoRenew: boolean
  durationMonths: number
  acceptsNewSubscribers: boolean
  createdAt: string
  category: PlanCategory
  isPopular?: boolean
  services: PlanService[]
}

const INITIAL_PLANS: Plan[] = [
  {
    id: 'p1',
    name: 'Barba do Mes',
    description: '4 cortes por mês + 1 barba grátis',
    status: 'ativo',
    monthlyPrice: 120,
    savingsPercent: 20,
    activeSubscribers: 37,
    autoRenew: true,
    durationMonths: 12,
    acceptsNewSubscribers: true,
    createdAt: '15/01/2024',
    category: 'mensal',
    isPopular: true,
    services: [
      { id: 's1', label: 'Corte tradicional', quantity: 4, icon: '✂️' },
      { id: 's2', label: 'Barba completa', quantity: 1, icon: '🪒' },
      { id: 's3', label: 'Hidratação', quantity: 1, icon: '⭐' },
    ],
  },
  {
    id: 'p2',
    name: 'Corte Vip',
    description: '3 cortes premium + finalizacao especial',
    status: 'ativo',
    monthlyPrice: 169.9,
    savingsPercent: 15,
    activeSubscribers: 6,
    autoRenew: true,
    durationMonths: 6,
    acceptsNewSubscribers: true,
    createdAt: '03/03/2024',
    category: 'trimestral',
    services: [
      { id: 's4', label: 'Corte premium', quantity: 3, icon: '✂️' },
      { id: 's5', label: 'Barba completa', quantity: 1, icon: '🪒' },
      { id: 's6', label: 'Hidratação', quantity: 1, icon: '⭐' },
    ],
  },
  {
    id: 'p3',
    name: 'Executive Club',
    description: 'Plano anual para clientes fiéis',
    status: 'inativo',
    monthlyPrice: 210,
    savingsPercent: 25,
    activeSubscribers: 0,
    autoRenew: false,
    durationMonths: 12,
    acceptsNewSubscribers: false,
    createdAt: '20/09/2023',
    category: 'anual',
    services: [
      { id: 's7', label: 'Corte executivo', quantity: 4, icon: '✂️' },
      { id: 's8', label: 'Barba premium', quantity: 2, icon: '🪒' },
    ],
  },
]

const statusMap: Record<PlanStatus, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  inativo: { label: 'Inativo', className: 'bg-amber-100 text-amber-700 border-amber-200' },
}

function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseCurrency(value: string): number {
  const onlyDigits = value.replace(/\D/g, '')
  if (!onlyDigits) return 0
  return Number(onlyDigits) / 100
}

function formatCurrencyInput(value: string): string {
  return parseCurrency(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function TenantPlanosPage() {
  const { base } = useTenantAdminBase()
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS)
  const [showMockData, setShowMockData] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [activeTab, setActiveTab] = useState<'basicas' | 'servicos' | 'config'>('basicas')
  const [draggedServiceId, setDraggedServiceId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'mensal' as PlanCategory,
    price: '0,00',
    durationMonths: '12',
  })
  const [formServices, setFormServices] = useState<PlanService[]>([])

  const totalCount = plans.length

  const filteredPlans = useMemo(() => (showMockData ? plans : []), [plans, showMockData])

  function resetForm() {
    setForm({
      name: '',
      description: '',
      category: 'mensal',
      price: '0,00',
      durationMonths: '12',
    })
    setFormServices([
      { id: crypto.randomUUID(), label: 'Corte tradicional', quantity: 4, icon: '✂️' },
      { id: crypto.randomUUID(), label: 'Barba completa', quantity: 1, icon: '🪒' },
    ])
    setActiveTab('basicas')
  }

  function openCreateModal() {
    setEditingPlan(null)
    resetForm()
    setIsModalOpen(true)
  }

  function openEditModal(plan: Plan) {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      description: plan.description,
      category: plan.category,
      price: formatCurrencyInput(String(plan.monthlyPrice)),
      durationMonths: String(plan.durationMonths),
    })
    setFormServices(plan.services.map((service) => ({ ...service })))
    setActiveTab('basicas')
    setIsModalOpen(true)
  }

  function savePlan() {
    if (!form.name.trim() || parseCurrency(form.price) <= 0) return

    const payload: Plan = {
      id: editingPlan?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      description: form.description.trim() || 'Plano personalizado de recorrência',
      status: editingPlan?.status ?? 'ativo',
      monthlyPrice: parseCurrency(form.price),
      savingsPercent: editingPlan?.savingsPercent ?? 15,
      activeSubscribers: editingPlan?.activeSubscribers ?? 0,
      autoRenew: editingPlan?.autoRenew ?? true,
      durationMonths: Number(form.durationMonths || '0'),
      acceptsNewSubscribers: editingPlan?.acceptsNewSubscribers ?? true,
      createdAt: editingPlan?.createdAt ?? new Date().toLocaleDateString('pt-BR'),
      category: form.category,
      isPopular: editingPlan?.isPopular ?? false,
      services: formServices,
    }

    setPlans((prev) =>
      editingPlan ? prev.map((plan) => (plan.id === editingPlan.id ? payload : plan)) : [payload, ...prev],
    )
    setIsModalOpen(false)
  }

  function duplicatePlan(plan: Plan) {
    const duplicated: Plan = {
      ...plan,
      id: crypto.randomUUID(),
      name: `${plan.name} (Cópia)`,
      createdAt: new Date().toLocaleDateString('pt-BR'),
    }
    setPlans((prev) => [duplicated, ...prev])
  }

  function updateStatus(planId: string, status: PlanStatus) {
    setPlans((prev) => prev.map((plan) => (plan.id === planId ? { ...plan, status } : plan)))
  }

  function deletePlan(planId: string) {
    setPlans((prev) => prev.filter((plan) => plan.id !== planId))
  }

  function toggleAccepting(planId: string, checked: boolean) {
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === planId ? { ...plan, acceptsNewSubscribers: checked } : plan,
      ),
    )
  }

  function addServiceField() {
    setFormServices((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: '', quantity: 1, icon: '✂️' },
    ])
  }

  function moveService(serviceId: string, direction: 'up' | 'down') {
    setFormServices((prev) => {
      const index = prev.findIndex((service) => service.id === serviceId)
      if (index < 0) return prev
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const current = next[index]
      next[index] = next[target]
      next[target] = current
      return next
    })
  }

  function onDragStart(serviceId: string) {
    setDraggedServiceId(serviceId)
  }

  function onDrop(targetId: string) {
    if (!draggedServiceId || draggedServiceId === targetId) return
    setFormServices((prev) => {
      const from = prev.findIndex((service) => service.id === draggedServiceId)
      const to = prev.findIndex((service) => service.id === targetId)
      if (from < 0 || to < 0) return prev
      const reordered = [...prev]
      const [moved] = reordered.splice(from, 1)
      reordered.splice(to, 0, moved)
      return reordered
    })
    setDraggedServiceId(null)
  }

  const canSave = form.name.trim().length > 0 && parseCurrency(form.price) > 0

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader title="Planos" profileHref={`${base}/configuracoes`} avatarFallback="A" />

      <PageContent className="space-y-4 md:space-y-5">
        <section className="space-y-3 rounded-xl border p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">Planos de Assinatura</h1>
                <Badge variant="secondary">{totalCount}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Gerencie planos recorrentes e fidelize seus clientes
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-md border p-1">
                <Button
                  size="icon-sm"
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  className={cn(viewMode === 'cards' ? 'bg-[#E05A2A] text-white hover:bg-[#C44D22]' : '')}
                  onClick={() => setViewMode('cards')}
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant={viewMode === 'lista' ? 'default' : 'ghost'}
                  className={cn(viewMode === 'lista' ? 'bg-[#E05A2A] text-white hover:bg-[#C44D22]' : '')}
                  onClick={() => setViewMode('lista')}
                >
                  <List className="size-4" />
                </Button>
              </div>
              <Button className="bg-[#E05A2A] text-white hover:bg-[#C44D22]" onClick={openCreateModal}>
                <Plus className="size-4" />
                Novo Plano
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <div>
              <p className="text-sm font-medium">Exibir dados fictícios</p>
              <p className="text-xs text-muted-foreground">Desative para não exibir dados reais.</p>
            </div>
            <Switch checked={showMockData} onCheckedChange={setShowMockData} />
          </div>

        </section>

        {filteredPlans.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <AlertCircle />
                  </EmptyMedia>
                  <EmptyTitle>Sem planos cadastrados</EmptyTitle>
                  <EmptyDescription>
                    Crie seu primeiro plano de assinatura para oferecer recorrência e aumentar fidelização.
                  </EmptyDescription>
                </EmptyHeader>
                <Button className="bg-[#E05A2A] text-white hover:bg-[#C44D22]" onClick={openCreateModal}>
                  <Plus className="size-4" />
                  Criar primeiro plano
                </Button>
              </Empty>
            </CardContent>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlans.map((plan) => {
              const status = statusMap[plan.status]
              const hasFewSubscribers = plan.activeSubscribers > 0 && plan.activeSubscribers <= 8
              return (
                <Card
                  key={plan.id}
                  className={cn(
                    'relative flex h-full flex-col overflow-hidden',
                    plan.isPopular && 'border-2 border-[#E05A2A] shadow-[0_8px_24px_-12px_rgba(224,90,42,0.45)]',
                  )}
                >
                  <CardHeader className="space-y-3 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge className={cn('border text-xs font-medium', status.className)}>{status.label}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(plan)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(plan.id, 'inativo')}>
                            Pausar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicatePlan(plan)}>Duplicar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deletePlan(plan.id)} className="text-destructive">
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold">{plan.name}</h2>
                      <p className="text-muted-foreground text-sm">{plan.description}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-[#E05A2A]">{formatBrl(plan.monthlyPrice)}/mês</p>
                      <Badge variant="secondary">Economize {plan.savingsPercent}%</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 gap-2 rounded-lg border bg-muted/25 p-3 text-sm">
                      <p className="flex items-center gap-2">
                        <Users className="size-4 text-muted-foreground" /> {plan.activeSubscribers} assinantes ativos
                      </p>
                      <p className="flex items-center gap-2">
                        <Repeat2 className="size-4 text-muted-foreground" />{' '}
                        {plan.autoRenew ? 'Renovado automaticamente' : 'Renovação manual'}
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" /> Duração: {plan.durationMonths} meses
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Servicos incluidos</p>
                      <ul className="space-y-1 text-sm">
                        {plan.services.map((service) => (
                          <li key={service.id} className="flex items-center gap-2">
                            <span>{service.icon}</span>
                            <span>
                              {service.quantity}x {service.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {plan.isPopular || hasFewSubscribers ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {plan.isPopular ? (
                          <div className="rounded-full bg-[#E05A2A] px-2 py-1 text-[11px] font-medium text-white">
                            🔥 Mais Popular
                          </div>
                        ) : null}
                        {hasFewSubscribers ? (
                          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            💡 Dica: Promova este plano nas redes sociais
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </CardContent>

                  <CardFooter className="border-t pt-3">
                    <div className="w-full space-y-2">
                      <p className="text-muted-foreground text-xs">Criado em {plan.createdAt}</p>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPlans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{plan.name}</p>
                      <Badge className={cn('border text-xs font-medium', statusMap[plan.status].className)}>
                        {statusMap[plan.status].label}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                    <p className="text-sm">
                      <span className="font-medium text-[#E05A2A]">{formatBrl(plan.monthlyPrice)}/mês</span> •{' '}
                      {plan.activeSubscribers} assinantes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(plan)}>
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => duplicatePlan(plan)}>
                      Duplicar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deletePlan(plan.id)}>
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar plano' : 'Novo plano de assinatura'}</DialogTitle>
            <DialogDescription>
              Configure informações básicas, serviços incluídos e regras do plano.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'basicas' | 'servicos' | 'config')}>
            <TabsList>
              <TabsTrigger value="basicas">Informações Básicas</TabsTrigger>
              <TabsTrigger value="servicos">Serviços Incluídos</TabsTrigger>
              <TabsTrigger value="config">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="basicas" className="space-y-4 pt-3">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Nome do plano *</Label>
                <Input
                  id="plan-name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Ex: Barba do Mes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-description">Descrição</Label>
                <Textarea
                  id="plan-description"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="min-h-[92px]"
                  placeholder="Descreva os beneficios deste plano"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, category: value as PlanCategory }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preco *</Label>
                  <Input
                    id="price"
                    inputMode="decimal"
                    value={form.price}
                    onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                    onBlur={() =>
                      setForm((prev) => ({
                        ...prev,
                        price: formatCurrencyInput(prev.price),
                      }))
                    }
                    placeholder="120,00"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="servicos" className="space-y-3 pt-3">
              {formServices.map((service, index) => (
                <div
                  key={service.id}
                  draggable
                  onDragStart={() => onDragStart(service.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => onDrop(service.id)}
                  className="bg-background flex items-center gap-2 rounded-lg border p-2"
                >
                  <Input
                    value={service.icon}
                    onChange={(event) =>
                      setFormServices((prev) =>
                        prev.map((item) =>
                          item.id === service.id ? { ...item, icon: event.target.value.slice(0, 2) } : item,
                        ),
                      )
                    }
                    className="w-16"
                  />
                  <Input
                    value={service.label}
                    onChange={(event) =>
                      setFormServices((prev) =>
                        prev.map((item) =>
                          item.id === service.id ? { ...item, label: event.target.value } : item,
                        ),
                      )
                    }
                    placeholder="Nome do servico"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={service.quantity}
                    onChange={(event) =>
                      setFormServices((prev) =>
                        prev.map((item) =>
                          item.id === service.id ? { ...item, quantity: Number(event.target.value || '1') } : item,
                        ),
                      )
                    }
                    className="w-20"
                  />
                  <Button variant="ghost" size="icon-sm" onClick={() => moveService(service.id, 'up')} disabled={index === 0}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveService(service.id, 'down')}
                    disabled={index === formServices.length - 1}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addServiceField}>
                <Plus className="size-4" />
                Adicionar servico
              </Button>
            </TabsContent>

            <TabsContent value="config" className="space-y-4 pt-3">
              <div className="space-y-2">
                <Label htmlFor="duration">Duração do plano (meses)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={form.durationMonths}
                  onChange={(event) => setForm((prev) => ({ ...prev, durationMonths: event.target.value }))}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-[#E05A2A] text-white hover:bg-[#C44D22]" disabled={!canSave} onClick={savePlan}>
              <CheckCircle2 className="size-4" />
              Salvar plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TenantPanelPageContainer>
  )
}
