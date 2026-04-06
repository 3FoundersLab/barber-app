'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { ClienteCard } from '@/components/domain/cliente-card'
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
import { ClientCardListSkeleton } from '@/components/shared/loading-skeleton'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import type { Cliente } from '@/types'

export default function AdminClientesPage() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const base = slug ? `/b/${slug}` : '/painel'

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    notas: '',
  })

  useEffect(() => {
    loadClientes()
  }, [slug])

  useEffect(() => {
    if (searchTerm) {
      const filtered = clientes.filter(
        (c) =>
          c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.telefone?.includes(searchTerm) ||
          c.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredClientes(filtered)
    } else {
      setFilteredClientes(clientes)
    }
  }, [searchTerm, clientes])

  async function loadClientes() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const barbeariaIdResolved = await resolveAdminBarbeariaId(supabase, user.id, { slug })

      if (barbeariaIdResolved) {
        setBarbeariaId(barbeariaIdResolved)
        
        const { data } = await supabase
          .from('clientes')
          .select('*')
          .eq('barbearia_id', barbeariaIdResolved)
          .order('nome')
        
        if (data) {
          setClientes(data)
          setFilteredClientes(data)
        }
      }
    }
    
    setIsLoading(false)
  }

  const handleOpenNew = () => {
    setEditingCliente(null)
    setFormData({
      nome: '',
      telefone: '',
      email: '',
      notas: '',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      notas: cliente.notas || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return
    
    const supabase = createClient()
    await supabase.from('clientes').delete().eq('id', id)
    loadClientes()
  }

  const handleSave = async () => {
    if (!barbeariaId) return
    
    setIsSaving(true)
    const supabase = createClient()
    
    const clienteData = {
      barbearia_id: barbeariaId,
      nome: formData.nome,
      telefone: formData.telefone,
      email: formData.email || null,
      notas: formData.notas || null,
    }
    
    if (editingCliente) {
      await supabase
        .from('clientes')
        .update(clienteData)
        .eq('id', editingCliente.id)
    } else {
      await supabase.from('clientes').insert(clienteData)
    }
    
    setIsSaving(false)
    setIsDialogOpen(false)
    loadClientes()
  }

  return (
    <PageContainer>
      <AppPageHeader title="Clientes" profileHref={`${base}/configuracoes`} avatarFallback="A" />

      <PageContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
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

        <div className="space-y-3">
          {isLoading ? (
            <ClientCardListSkeleton count={5} />
          ) : filteredClientes.length > 0 ? (
            filteredClientes.map((cliente) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </p>
                {!searchTerm && (
                  <Button size="sm" className="mt-3" onClick={handleOpenNew}>
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar cliente
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </PageContent>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notas">Notas (opcional)</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Observações sobre o cliente"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.nome || !formData.telefone}>
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
