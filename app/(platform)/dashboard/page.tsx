'use client'

import { useEffect, useState } from 'react'
import { Building2, CreditCard, DollarSign } from 'lucide-react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  ALERT_DEFAULT_AUTO_CLOSE_MS,
} from '@/components/ui/alert'
import { SuperDashboardChartsSection } from '@/components/super/super-dashboard-charts-section'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
        greetingOnly
        profileHref="/conta/editar"
        avatarFallback="S"
      />

      <PageContent className="space-y-4">
        {error && (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
            <AlertDescription>
              Assinaturas ativas e MRR podem estar incorretos. Tente recarregar a página.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="text-xs">Barbearias</span>
              </div>
              {isLoading ? (
                <Skeleton className="mt-1 h-8 w-10" />
              ) : (
                <p className="text-2xl font-bold">{stats.totalBarbearias}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span className="text-xs">Assinaturas ativas</span>
              </div>
              {isLoading ? (
                <Skeleton className="mt-1 h-8 w-10" />
              ) : (
                <p className="text-2xl font-bold">{stats.assinaturasAtivas}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">MRR estimado</span>
              </div>
              {isLoading ? (
                <Skeleton className="mt-1 h-8 w-28" />
              ) : (
                <p className="text-2xl font-bold">{formatCurrency(stats.receitaMensal)}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <SuperDashboardChartsSection />
      </PageContent>
    </PageContainer>
  )
}
