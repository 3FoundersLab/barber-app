'use client'

import { Building2, CreditCard, TrendingUp } from 'lucide-react'
import { SuperBarbeariasMensalStackedChart } from '@/components/super/super-barbearias-mensal-stacked-chart'
import { SuperAssinaturasAtivasPieChart } from '@/components/super/super-assinaturas-ativas-pie-chart'
import { SuperMrrEstimadoSection } from '@/components/super/super-mrr-estimado-section'
import { Card, CardContent } from '@/components/ui/card'

export function SuperDashboardChartsSection() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch">
        <Card className="flex h-full min-h-0 flex-col">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium">Barbearias</span>
            </div>
            <SuperBarbeariasMensalStackedChart className="min-h-0 flex-1" />
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-0 flex-col">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium">Assinaturas Ativas</span>
            </div>
            <SuperAssinaturasAtivasPieChart className="min-h-0 flex-1 justify-center" />
          </CardContent>
        </Card>
      </div>

      <Card className="flex min-h-[440px] flex-col sm:min-h-[480px] lg:min-h-[520px]">
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium">MRR estimado</span>
          </div>
          <SuperMrrEstimadoSection className="min-h-0 flex-1" />
        </CardContent>
      </Card>
    </div>
  )
}
