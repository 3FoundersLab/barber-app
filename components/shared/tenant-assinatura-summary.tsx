import { Check, CreditCard } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { labelAssinaturaStatus } from '@/lib/assinatura-labels'
import { formatCurrency } from '@/lib/constants'
import { linhasBeneficiosPlano } from '@/lib/plano-beneficios'
import {
  labelPeriodicidade,
  mesesPorPeriodicidade,
  parsePlanoPeriodicidade,
  precoTotalNoPeriodo,
  sufixoPrecoPeriodicidade,
} from '@/lib/plano-periodicidade'
import { superProfileGlassCardClass } from '@/components/super/super-profile-styles'
import { cn } from '@/lib/utils'
import type { AssinaturaComPlano } from '@/lib/tenant-assinatura-query'

interface TenantAssinaturaSummaryProps {
  assinatura: AssinaturaComPlano
  title?: string
  /** Alinha ao layout vidro da conta Super Admin. */
  variant?: 'default' | 'premium'
}

export function TenantAssinaturaSummary({
  assinatura,
  title = 'Plano contratado',
  variant = 'default',
}: TenantAssinaturaSummaryProps) {
  const body = (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{assinatura.plano?.nome ?? 'Plano'}</span>
        <Badge variant={assinatura.status === 'ativa' ? 'default' : 'secondary'}>
          {labelAssinaturaStatus(assinatura.status)}
        </Badge>
      </div>
      {assinatura.plano != null &&
        (() => {
          const per = parsePlanoPeriodicidade(assinatura.periodicidade)
          return (
            <>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {formatCurrency(precoTotalNoPeriodo(assinatura.plano.preco_mensal, per))}
                  {sufixoPrecoPeriodicidade(per)}
                </span>
                <span className="mt-0.5 block text-xs">
                  Ciclo: {labelPeriodicidade(per)}
                  {per !== 'mensal'
                    ? ` · base ${formatCurrency(assinatura.plano.preco_mensal)}/mês × ${mesesPorPeriodicidade(per)}`
                    : null}
                </span>
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {linhasBeneficiosPlano(assinatura.plano).length === 0 ? (
                  <li className="list-none text-xs">Nenhum benefício listado para este plano.</li>
                ) : (
                  linhasBeneficiosPlano(assinatura.plano).map((linha, idx) => (
                    <li key={`${assinatura.plano!.id}-${idx}`} className="flex items-start gap-2 text-xs">
                      <Check
                        className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <span>{linha}</span>
                    </li>
                  ))
                )}
              </ul>
            </>
          )
        })()}
    </div>
  )

  if (variant === 'premium') {
    return (
      <section className={cn(superProfileGlassCardClass, 'overflow-hidden')}>
        <header className="border-b border-zinc-200/80 px-5 py-4 dark:border-white/[0.06] md:px-6">
          <div className="flex items-center gap-2 text-foreground">
            <CreditCard className="size-4 text-primary opacity-90" aria-hidden />
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h2>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Plano vinculado à assinatura da sua barbearia na plataforma.
          </p>
        </header>
        <div className="p-5 md:p-6">{body}</div>
      </section>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
