'use client'

import { Building2, CreditCard, TrendingUp } from 'lucide-react'
import { SuperBarbeariasMensalStackedChart } from '@/components/super/super-barbearias-mensal-stacked-chart'
import { SuperAssinaturasAtivasPieChart } from '@/components/super/super-assinaturas-ativas-pie-chart'
import { SuperMrrEstimadoSection } from '@/components/super/super-mrr-estimado-section'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Mesma malha do bloco de KPIs da página: largura total do PageContent, gap-3, grid responsivo.
 * Sem max-width próprio — alinha bordas úteis com os 3 cards superiores.
 */
export function SuperDashboardChartsSection() {
  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch lg:gap-3">
        <Card className="flex h-full min-h-0 w-full flex-col">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4 lg:min-h-0 lg:flex-1 lg:gap-2.5">
            <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium">Barbearias</span>
            </div>
            <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-none">
              <SuperBarbeariasMensalStackedChart className="min-h-0 flex-1 lg:flex-none" />
            </div>
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-0 w-full flex-col">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4 lg:min-h-0 lg:flex-1 lg:gap-2.5">
            <div className="flex shrink-0 flex-col gap-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Assinaturas Ativas</span>
              </div>
              <p className="pl-6 text-[11px] leading-snug text-muted-foreground/90">
                Distribuição por plano no período selecionado.
              </p>
            </div>
            <div className="flex min-h-0 w-full flex-1 flex-col items-stretch justify-center lg:min-h-0">
              <SuperAssinaturasAtivasPieChart className="min-h-0 w-full flex-1 lg:w-full lg:flex-none" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex min-h-[440px] flex-col sm:min-h-[480px] lg:min-h-[560px]">
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:min-h-0 lg:flex-1">
          <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium">MRR estimado</span>
          </div>
          <div className="flex min-h-0 w-full flex-1 flex-col">
            <SuperMrrEstimadoSection className="min-h-0 flex-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
