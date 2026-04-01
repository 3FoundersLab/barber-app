'use client'

import { useEffect, useState } from 'react'
import { Plus, Phone, Mail } from 'lucide-react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Barbeiro } from '@/types'

export default function AdminEquipePage() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
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
  }, [])

  async function loadBarbeiros() {
    const supabase = createClient()
    setError(null)
    
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Usuário não autenticado')
      setBarbeiros([])
      setIsLoading(false)
      return
    }

    const { data: barbeariaUser } = await supabase
      .from('barbearia_users')
      .select('barbearia_id')
      .eq('user_id', user.id)
      .single()

    if (!barbeariaUser) {
      setError('Barbearia não encontrada para este usuário')
      setBarbeiros([])
      setIsLoading(false)
      return
    }

    setBarbeariaId(barbeariaUser.barbearia_id)

    const { data, error: queryError } = await supabase
      .from('barbeiros')
      .select('*')
      .eq('barbearia_id', barbeariaUser.barbearia_id)
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
      telefone: barbeiro.telefone || '',
      email: barbeiro.email || '',
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
    <PageContainer>
      <AppPageHeader title="Equipe" profileHref="/admin/configuracoes" avatarFallback="A" />

      <PageContent className="space-y-3">
        <div className="flex justify-end">
          <Button size="sm" onClick={handleOpenNew}>
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
        ) : isLoading ? (
          <LoadingSkeleton count={3} />
        ) : barbeiros.length > 0 ? (
          barbeiros.map((barbeiro) => (
            <Card key={barbeiro.id} className={!barbeiro.ativo ? 'opacity-60' : ''}>
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={barbeiro.avatar} />
                  <AvatarFallback>
                    {barbeiro.nome.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{barbeiro.nome}</span>
                    {!barbeiro.ativo && (
                      <Badge variant="secondary" className="text-xs">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {barbeiro.telefone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {barbeiro.telefone}
                      </span>
                    )}
                    {barbeiro.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3" />
                        {barbeiro.email}
                      </span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(barbeiro)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(barbeiro.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">Nenhum barbeiro cadastrado</p>
              <Button size="sm" className="mt-3" onClick={handleOpenNew}>
                <Plus className="mr-1 h-4 w-4" />
                Adicionar barbeiro
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
              {editingBarbeiro ? 'Editar Barbeiro' : 'Novo Barbeiro'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
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
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Barbeiro ativo</Label>
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
    </PageContainer>
  )
}
