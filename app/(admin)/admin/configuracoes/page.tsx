'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Store, MapPin, Phone, Mail, Save } from 'lucide-react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { clearProfileCache } from '@/lib/profile-cache'
import type { Barbearia } from '@/types'

export default function AdminConfiguracoesPage() {
  const router = useRouter()
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    telefone: '',
    email: '',
  })

  useEffect(() => {
    async function loadBarbearia() {
      const supabase = createClient()
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Usuário não autenticado')
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
        setIsLoading(false)
        return
      }

      const { data } = await supabase
        .from('barbearias')
        .select('*')
        .eq('id', barbeariaUser.barbearia_id)
        .single()
      
      if (!data) {
        setError('Barbearia não encontrada')
      } else {
        setBarbearia(data)
        setFormData({
          nome: data.nome,
          endereco: data.endereco || '',
          telefone: data.telefone || '',
          email: data.email || '',
        })
      }
      
      setIsLoading(false)
    }
    
    loadBarbearia()
  }, [])

  const handleSave = async () => {
    if (!barbearia) return
    
    setIsSaving(true)
    setError(null)
    const supabase = createClient()
    
    const { error: updateError } = await supabase
      .from('barbearias')
      .update({
        nome: formData.nome,
        endereco: formData.endereco || null,
        telefone: formData.telefone || null,
        email: formData.email || null,
      })
      .eq('id', barbearia.id)

    if (updateError) {
      setError('Não foi possível salvar as configurações')
    }
    
    setIsSaving(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    clearProfileCache()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <PageContainer>
        <AppPageHeader title="Configurações" profileHref="/admin/configuracoes" avatarFallback="A" />
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <AppPageHeader title="Configurações" profileHref="/admin/configuracoes" avatarFallback="A" />

      <PageContent className="space-y-6">
        {error && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {/* Barbearia Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-5 w-5" />
              Dados da Barbearia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Barbearia</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da barbearia"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endereco" className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Endereço
              </Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone" className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                Telefone
              </Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@barbearia.com"
              />
            </div>
            
            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Spinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair da conta
            </Button>
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  )
}
