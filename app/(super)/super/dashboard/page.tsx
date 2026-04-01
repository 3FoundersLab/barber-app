'use client'

import { useEffect, useState } from 'react'
import { Building2, CreditCard, DollarSign } from 'lucide-react'
import { PageContainer, PageContent, PageTitle } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

interface SuperStats {
  totalBarbearias: number
  assinaturasAtivas: number
  receitaMensal: number
}

export default function SuperDashboardPage() {
  const [stats, setStats] = useState<SuperStats>({
    totalBarbearias: 0,
    assinaturasAtivas: 0,
    receitaMensal: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      setError(null)

      const { count: barbeariasCount } = await supabase
        .from('barbearias')
        .select('*', { count: 'exact', head: true })

      const { count: ativasCount } = await supabase
        .from('assinaturas')
        .select('*', { count: 'exact', head: true })
        .in('status', ['ativa', 'trial'])

      const { data: assinaturasAtivas, error: assinaturasError } = await supabase
        .from('assinaturas')
        .select('status, plano:planos(preco_mensal)')
        .in('status', ['ativa', 'trial'])

      if (assinaturasError) {
        setError('Não foi possível carregar métricas de assinaturas')
      }

      const receitaMensal = (assinaturasAtivas || []).reduce((acc, assinatura) => {
        const plano = Array.isArray(assinatura.plano) ? assinatura.plano[0] : assinatura.plano
        return acc + (plano?.preco_mensal || 0)
      }, 0)

      setStats({
        totalBarbearias: barbeariasCount || 0,
        assinaturasAtivas: ativasCount || 0,
        receitaMensal,
      })
      setIsLoading(false)
    }

    loadData()
  }, [])

  return (
    <PageContainer>
      <AppPageHeader
        renderTitle={(profile) => {
          const nome = profile?.nome?.trim()
          return (
            <PageTitle className="text-lg">
              {nome ? `Olá, ${nome}` : 'Olá'}
            </PageTitle>
          )
        }}
        profileHref="/super/perfil/editar"
        avatarFallback="S"
      />

      <PageContent className="space-y-4">
        {error && (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="text-xs">Barbearias</span>
              </div>
              <p className="text-2xl font-bold">{isLoading ? '...' : stats.totalBarbearias}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span className="text-xs">Assinaturas ativas</span>
              </div>
              <p className="text-2xl font-bold">{isLoading ? '...' : stats.assinaturasAtivas}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">MRR estimado</span>
              </div>
              <p className="text-2xl font-bold">
                {isLoading ? '...' : formatCurrency(stats.receitaMensal)}
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </PageContainer>
  )
}
