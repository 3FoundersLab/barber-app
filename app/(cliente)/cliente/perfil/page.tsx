'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User, Mail, Phone, ChevronRight } from 'lucide-react'
import { PageContainer, PageHeader, PageTitle, PageContent } from '@/components/shared/page-container'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export default function PerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Usuário não autenticado')
        setIsLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (!data) {
        setError('Perfil não encontrado')
      } else {
        setProfile(data)
      }
      
      setIsLoading(false)
    }
    
    loadProfile()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Perfil</PageTitle>
      </PageHeader>

      <PageContent className="space-y-6">
        {error && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {/* Profile Card */}
        <Card>
          <CardContent className="flex flex-col items-center p-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar} />
              <AvatarFallback className="text-2xl">
                {profile?.nome?.charAt(0).toUpperCase() || 'C'}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-semibold">
              {isLoading ? '...' : profile?.nome || 'Cliente'}
            </h2>
            <p className="text-sm text-muted-foreground">Cliente</p>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">
                  {profile?.email || 'Não informado'}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Phone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="text-sm font-medium">
                  {profile?.telefone || 'Não informado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-0">
            <button
              onClick={() => {}}
              className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm font-medium">Editar perfil</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair da conta
        </Button>
      </PageContent>
    </PageContainer>
  )
}
