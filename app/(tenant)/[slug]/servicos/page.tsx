'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { ServiceCard } from '@/components/domain/service-card'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ServiceCardSkeleton } from '@/components/shared/loading-skeleton'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import type { Servico } from '@/types'

export default function AdminServicosPage() {
  const { slug, base } = useTenantAdminBase()

  const [servicos, setServicos] = useState<Servico[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingServico, setEditingServico] = useState<Servico | null>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    duracao: '30',
    ativo: true,
  })

  useEffect(() => {
    loadServicos()
  }, [slug])

  const filteredServicos = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return servicos
    return servicos.filter(
      (s) =>
        s.nome.toLowerCase().includes(q) ||
        (s.descricao?.toLowerCase().includes(q) ?? false),
    )
  }, [searchTerm, servicos])

  async function loadServicos() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const barbeariaIdResolved = await resolveAdminBarbeariaId(supabase, user.id, { slug })

      if (barbeariaIdResolved) {
        setBarbeariaId(barbeariaIdResolved)
        
        const { data } = await supabase
          .from('servicos')
          .select('*')
          .eq('barbearia_id', barbeariaIdResolved)
          .order('nome')
        
        if (data) setServicos(data)
      }
    }
    
    setIsLoading(false)
  }

  const handleOpenNew = () => {
    setEditingServico(null)
    setFormData({
      nome: '',
      descricao: '',
      preco: '',
      duracao: '30',
      ativo: true,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (servico: Servico) => {
    setEditingServico(servico)
    setFormData({
      nome: servico.nome,
      descricao: servico.descricao || '',
      preco: String(servico.preco),
      duracao: String(servico.duracao),
      ativo: servico.ativo,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return
    
    const supabase = createClient()
    await supabase.from('servicos').delete().eq('id', id)
    loadServicos()
  }

  const handleSave = async () => {
    if (!barbeariaId) return
    
    setIsSaving(true)
    const supabase = createClient()
    
    const servicoData = {
      barbearia_id: barbeariaId,
      nome: formData.nome,
      descricao: formData.descricao || null,
      preco: parseFloat(formData.preco),
      duracao: parseInt(formData.duracao),
      ativo: formData.ativo,
    }
    
    if (editingServico) {
      await supabase
        .from('servicos')
        .update(servicoData)
        .eq('id', editingServico.id)
    } else {
      await supabase.from('servicos').insert(servicoData)
    }
    
    setIsSaving(false)
    setIsDialogOpen(false)
    loadServicos()
  }

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader title="Serviços" profileHref={`${base}/configuracoes`} avatarFallback="A" />

      <PageContent className="space-y-4 md:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:gap-6">
          <div className="relative min-w-0 flex-1 lg:max-w-2xl xl:max-w-3xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar serviço..."
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

        <div
          className={
            isLoading || servicos.length > 0
              ? 'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3 xl:gap-5'
              : undefined
          }
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <ServiceCardSkeleton key={i} className="h-full min-h-[5rem]" />
            ))
          ) : filteredServicos.length > 0 ? (
            filteredServicos.map((servico) => (
              <ServiceCard
                key={servico.id}
                service={servico}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <Card className="border-dashed md:col-span-2 xl:col-span-3">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm.trim() ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
                </p>
                {!searchTerm.trim() && (
                  <Button size="sm" className="mt-3" onClick={handleOpenNew}>
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar serviço
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </PageContent>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg lg:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6 lg:gap-y-4 lg:space-y-0">
            <div className="space-y-4 lg:col-span-1">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Corte Masculino"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição opcional do serviço"
                  className="min-h-[100px] lg:min-h-[140px]"
                />
              </div>
            </div>

            <div className="space-y-4 lg:col-span-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco">Preço (R$)</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duracao">Duração (min)</Label>
                  <Input
                    id="duracao"
                    type="number"
                    value={formData.duracao}
                    onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-3">
                <Label htmlFor="ativo" className="cursor-pointer">
                  Serviço ativo
                </Label>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.nome || !formData.preco}>
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TenantPanelPageContainer>
  )
}
