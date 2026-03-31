'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, DollarSign, Users, Scissors, TrendingUp, ChevronRight } from 'lucide-react'
import { PageContainer, PageHeader, PageTitle, PageContent } from '@/components/shared/page-container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AppointmentStatusBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatTime } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { Agendamento, Profile, Barbearia } from '@/types'

interface Stats {
  agendamentosHoje: number
  agendamentosMes: number
  faturamentoHoje: number
  faturamentoMes: number
  totalClientes: number
  totalBarbeiros: number
}

export default function AdminDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [proximosAgendamentos, setProximosAgendamentos] = useState<Agendamento[]>([])
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

        // Barbearia (get from barbearia_users)
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

        if (barbeariaUser) {
          const { data: barbeariaData } = await supabase
            .from('barbearias')
            .select('*')
            .eq('id', barbeariaUser.barbearia_id)
            .single()
          
          if (!barbeariaData) {
            setError('Barbearia não encontrada')
            setIsLoading(false)
            return
          }

          if (barbeariaData) {
            setBarbearia(barbeariaData)

            // Stats
            const today = new Date().toISOString().split('T')[0]
            const firstDayMonth = new Date()
            firstDayMonth.setDate(1)
            const monthStart = firstDayMonth.toISOString().split('T')[0]

            // Today's appointments
            const { count: todayCount } = await supabase
              .from('agendamentos')
              .select('*', { count: 'exact', head: true })
              .eq('barbearia_id', barbeariaData.id)
              .eq('data', today)

            // Month appointments
            const { count: monthCount } = await supabase
              .from('agendamentos')
              .select('*', { count: 'exact', head: true })
              .eq('barbearia_id', barbeariaData.id)
              .gte('data', monthStart)

            // Today's revenue
            const { data: todayRevenue } = await supabase
              .from('agendamentos')
              .select('valor')
              .eq('barbearia_id', barbeariaData.id)
              .eq('data', today)
              .eq('status', 'concluido')

            // Month revenue
            const { data: monthRevenue } = await supabase
              .from('agendamentos')
              .select('valor')
              .eq('barbearia_id', barbeariaData.id)
              .gte('data', monthStart)
              .eq('status', 'concluido')

            // Clients
            const { count: clientsCount } = await supabase
              .from('clientes')
              .select('*', { count: 'exact', head: true })
              .eq('barbearia_id', barbeariaData.id)

            // Barbers
            const { count: barbersCount } = await supabase
              .from('barbeiros')
              .select('*', { count: 'exact', head: true })
              .eq('barbearia_id', barbeariaData.id)
              .eq('ativo', true)

            setStats({
              agendamentosHoje: todayCount || 0,
              agendamentosMes: monthCount || 0,
              faturamentoHoje: todayRevenue?.reduce((acc, a) => acc + a.valor, 0) || 0,
              faturamentoMes: monthRevenue?.reduce((acc, a) => acc + a.valor, 0) || 0,
              totalClientes: clientsCount || 0,
              totalBarbeiros: barbersCount || 0,
            })

            // Next appointments
            const { data: proximos } = await supabase
              .from('agendamentos')
              .select(`
                *,
                cliente:clientes(*),
                barbeiro:barbeiros(*),
                servico:servicos(*)
              `)
              .eq('barbearia_id', barbeariaData.id)
              .eq('data', today)
              .eq('status', 'agendado')
              .order('horario', { ascending: true })
              .limit(5)

            if (proximos) setProximosAgendamentos(proximos)
          }
        }
      }
      
      setIsLoading(false)
    }
    
    loadData()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <p className="text-sm text-muted-foreground">{getGreeting()},</p>
          <PageTitle>{profile?.nome?.split(' ')[0] || 'Admin'}</PageTitle>
        </div>
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar} />
          <AvatarFallback>
            {profile?.nome?.charAt(0).toUpperCase() || 'A'}
          </AvatarFallback>
        </Avatar>
      </PageHeader>

      <PageContent className="space-y-6 md:space-y-8">
        {error && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {/* Barbearia Name */}
        {!error && barbearia && (
          <Card className="bg-accent/10 border-accent/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <Scissors className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-semibold">{barbearia.nome}</h2>
                <p className="text-xs text-muted-foreground">Painel Administrativo</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Hoje</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{stats?.agendamentosHoje || 0}</p>
              <p className="text-xs text-muted-foreground">agendamentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Hoje</span>
              </div>
              <p className="mt-1 text-2xl font-bold">
                {formatCurrency(stats?.faturamentoHoje || 0)}
              </p>
              <p className="text-xs text-muted-foreground">faturamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Este mês</span>
              </div>
              <p className="mt-1 text-2xl font-bold">
                {formatCurrency(stats?.faturamentoMes || 0)}
              </p>
              <p className="text-xs text-muted-foreground">faturamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{stats?.totalClientes || 0}</p>
              <p className="text-xs text-muted-foreground">clientes</p>
            </CardContent>
          </Card>
        </div>

        {/* Next Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Próximos Agendamentos</CardTitle>
            <Link href="/admin/agendamentos">
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground">
                Ver todos
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? (
              <p className="py-4 text-center text-sm text-destructive">{error}</p>
            ) : isLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded bg-muted" />
                ))}
              </div>
            ) : proximosAgendamentos.length > 0 ? (
              proximosAgendamentos.map((agendamento) => (
                <div
                  key={agendamento.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-10 w-10 flex-col items-center justify-center rounded bg-primary text-primary-foreground">
                    <span className="text-sm font-bold leading-none">
                      {formatTime(agendamento.horario).split(':')[0]}
                    </span>
                    <span className="text-[10px] leading-none">
                      :{formatTime(agendamento.horario).split(':')[1]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-sm">
                      {agendamento.cliente?.nome}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {agendamento.servico?.nome} - {agendamento.barbeiro?.nome}
                    </p>
                  </div>
                  <AppointmentStatusBadge status={agendamento.status} />
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum agendamento para hoje
              </p>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  )
}
