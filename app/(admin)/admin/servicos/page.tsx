'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
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
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import type { Servico } from '@/types'

export default function AdminServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([])
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
  }, [])

  async function loadServicos() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: barbeariaUser } = await supabase
        .from('barbearia_users')
        .select('barbearia_id')
        .eq('user_id', user.id)
        .single()

      if (barbeariaUser) {
        setBarbeariaId(barbeariaUser.barbearia_id)
        
        const { data } = await supabase
          .from('servicos')
          .select('*')
          .eq('barbearia_id', barbeariaUser.barbearia_id)
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
    <PageContainer>
      <AppPageHeader title="Serviços" profileHref="/admin/configuracoes" avatarFallback="A" />

      <PageContent className="space-y-3">
        <div className="flex justify-end">
          <Button size="sm" onClick={handleOpenNew}>
            <Plus className="mr-1 h-4 w-4" />
            Novo
          </Button>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={4} />
        ) : servicos.length > 0 ? (
          servicos.map((servico) => (
            <ServiceCard
              key={servico.id}
              service={servico}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">Nenhum serviço cadastrado</p>
              <Button size="sm" className="mt-3" onClick={handleOpenNew}>
                <Plus className="mr-1 h-4 w-4" />
                Adicionar serviço
              </Button>
            </CardContent>
          </Card>
        )}
      </PageContent>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
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
              />
            </div>
            
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
            
            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Serviço ativo</Label>
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
            <Button onClick={handleSave} disabled={isSaving || !formData.nome || !formData.preco}>
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
