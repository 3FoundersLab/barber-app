'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Scissors, ChevronRight, MapPin } from 'lucide-react'
import { PageContainer, PageHeader, PageTitle, PageContent } from '@/components/shared/page-container'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserHeaderMenu } from '@/components/shared/user-header-menu'
import { AppointmentStatusBadge } from '@/components/shared/status-badge'
import { ServiceCard } from '@/components/domain/service-card'
import { formatDate, formatTime, formatCurrency } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { Agendamento, Profile, Barbearia, Servico } from '@/types'

export default function ClienteHomePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [proximoAgendamento, setProximoAgendamento] = useState<Agendamento | null>(null)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData)
        }

        // Get barbearia (first one for demo)
        const { data: barbeariaData } = await supabase
          .from('barbearias')
          .select('*')
          .limit(1)
          .single()
        
        if (barbeariaData) {
          setBarbearia(barbeariaData)

          const { data: servicosData } = await supabase
            .from('servicos')
            .select('*')
            .eq('barbearia_id', barbeariaData.id)
            .eq('ativo', true)
            .order('nome')
            .limit(3)

          if (servicosData) {
            setServicos(servicosData)
          }
        }

        // Get next appointment
        const { data: agendamentos } = await supabase
          .from('agendamentos')
          .select(`
            *,
            servico:servicos(*),
            barbeiro:barbeiros(*)
          `)
          .eq('status', 'agendado')
          .gte('data', new Date().toISOString().split('T')[0])
          .order('data', { ascending: true })
          .order('horario', { ascending: true })
          .limit(1)
        
        if (agendamentos && agendamentos.length > 0) {
          setProximoAgendamento(agendamentos[0])
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
          <PageTitle>{profile?.nome?.split(' ')[0] || 'Cliente'}</PageTitle>
        </div>
        <UserHeaderMenu
          avatarSrc={profile?.avatar}
          fallback={profile?.nome?.charAt(0).toUpperCase() || 'C'}
          profileHref="/cliente/perfil"
        />
      </PageHeader>

      <PageContent className="space-y-6 md:space-y-8">
        {/* Barbearia Info */}
        {barbearia && (
          <Card className="overflow-hidden bg-accent/10 border-accent/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <Scissors className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold">{barbearia.nome}</h2>
                {barbearia.endereco && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {barbearia.endereco}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <Link href="/cliente/agendar">
            <Card className="h-full cursor-pointer transition-colors hover:bg-accent/5">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Novo Agendamento</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/cliente/agendamentos">
            <Card className="h-full cursor-pointer transition-colors hover:bg-accent/5">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Meus Horários</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Próximo Agendamento */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Próximo Agendamento</h3>
            <Link href="/cliente/agendamentos">
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground">
                Ver todos
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ) : proximoAgendamento ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <span className="text-lg font-bold leading-none">
                      {formatTime(proximoAgendamento.horario).split(':')[0]}
                    </span>
                    <span className="text-xs leading-none">
                      :{formatTime(proximoAgendamento.horario).split(':')[1]}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {proximoAgendamento.servico?.nome}
                      </span>
                      <AppointmentStatusBadge status={proximoAgendamento.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(proximoAgendamento.data)} com {proximoAgendamento.barbeiro?.nome}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      {formatCurrency(proximoAgendamento.valor)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Nenhum agendamento futuro
                </p>
                <Link href="/cliente/agendar">
                  <Button size="sm" className="mt-3">
                    Agendar agora
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Serviços */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Serviços</h3>
            <Link href="/cliente/agendar">
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground">
                Agendar
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {isLoading ? (
              <Card>
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
            ) : servicos.length > 0 ? (
              servicos.map((servico) => (
                <ServiceCard key={servico.id} service={servico} showActions={false} />
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum serviço disponível no momento
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PageContent>
    </PageContainer>
  )
}
