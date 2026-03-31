'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User, Mail, Phone, ChevronRight, Scissors, Calendar, DollarSign } from 'lucide-react'
import { PageContainer, PageHeader, PageTitle, PageContent } from '@/components/shared/page-container'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Barbeiro } from '@/types'

interface Stats {
  totalAgendamentos: number
  agendamentosHoje: number
  faturamentoMes: number
}

export default function BarbeiroPerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [barbeiro, setBarbeiro] = useState<Barbeiro | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Usuário não autenticado')
        setIsLoading(false)
        return
      }

      if (user) {
        // Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileData) setProfile(profileData)

        // Barbeiro
        const { data: barbeiroData } = await supabase
          .from('barbeiros')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (!barbeiroData) {
          setError('Barbeiro não encontrado')
          setIsLoading(false)
          return
        }

        if (barbeiroData) {
          setBarbeiro(barbeiroData)
          
          // Stats
          const today = new Date().toISOString().split('T')[0]
          const firstDayMonth = new Date()
          firstDayMonth.setDate(1)
          const monthStart = firstDayMonth.toISOString().split('T')[0]

          const { count: totalCount } = await supabase
            .from('agendamentos')
            .select('*', { count: 'exact', head: true })
            .eq('barbeiro_id', barbeiroData.id)
            .eq('status', 'concluido')

          const { count: todayCount } = await supabase
            .from('agendamentos')
            .select('*', { count: 'exact', head: true })
            .eq('barbeiro_id', barbeiroData.id)
            .eq('data', today)

          const { data: monthData } = await supabase
            .from('agendamentos')
            .select('valor')
            .eq('barbeiro_id', barbeiroData.id)
            .eq('status', 'concluido')
            .gte('data', monthStart)

          const faturamento = monthData?.reduce((acc, a) => acc + a.valor, 0) || 0

          setStats({
            totalAgendamentos: totalCount || 0,
            agendamentosHoje: todayCount || 0,
            faturamentoMes: faturamento,
          })
        }
      }
      
      setIsLoading(false)
    }
    
    loadData()
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
              <AvatarImage src={barbeiro?.avatar || profile?.avatar} />
              <AvatarFallback className="text-2xl">
                {(barbeiro?.nome || profile?.nome)?.charAt(0).toUpperCase() || 'B'}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-semibold">
              {isLoading ? '...' : barbeiro?.nome || profile?.nome || 'Barbeiro'}
            </h2>
            <p className="text-sm text-muted-foreground">Barbeiro</p>
          </CardContent>
        </Card>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="flex flex-col items-center p-4 text-center">
                <Scissors className="mb-1 h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.totalAgendamentos}</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-4 text-center">
                <Calendar className="mb-1 h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.agendamentosHoje}</span>
                <span className="text-xs text-muted-foreground">Hoje</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-4 text-center">
                <DollarSign className="mb-1 h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-bold">{formatCurrency(stats.faturamentoMes)}</span>
                <span className="text-xs text-muted-foreground">Este mês</span>
              </CardContent>
            </Card>
          </div>
        )}

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
                  {barbeiro?.email || profile?.email || 'Não informado'}
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
                  {barbeiro?.telefone || profile?.telefone || 'Não informado'}
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
