'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ListSkeletonProps {
  count?: number
  className?: string
}

export function ListSkeleton({ count = 5, className }: ListSkeletonProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}

/** Alinha ao `AppointmentCard` (admin/financeiro/agenda): header com avatar, corpo e footer de ações */
export function AppointmentCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_4px_20px_rgba(0,0,0,0.08)]', className)}>
      <div className="p-5">
        <div className="mb-4 rounded-xl bg-muted/40 px-4 py-4">
          <div className="flex items-start gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[85%] max-w-[200px]" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="mt-4 flex gap-2 border-t border-border/60 pt-4">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
        </div>
      </div>
    </div>
  )
}

export function AppointmentListSkeleton({ count = 4, className }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <AppointmentCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Cartão de agendamento na lista do cliente (bloco de horário 14×14) */
export function ClienteAgendamentoCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ClienteAgendamentoListSkeleton({ count = 3, className }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ClienteAgendamentoCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function DashboardCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="h-8 w-24" />
    </div>
  )
}

/** Mini cards de métricas (admin dashboard / super dashboard) */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-14" />
        </div>
        <Skeleton className="mt-2 h-8 w-12" />
        <Skeleton className="mt-1 h-3 w-24" />
      </CardContent>
    </Card>
  )
}

export function StatCardSkeletonGrid({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4',
        count === 3 && 'md:grid-cols-3',
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Linha da lista “Próximos agendamentos” no admin dashboard */
export function AdminDashboardAppointmentRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border p-3', className)}>
      <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-[45%] max-w-[200px]" />
        <Skeleton className="h-3 w-[70%] max-w-[280px]" />
      </div>
      <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
    </div>
  )
}

export function ServiceCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex w-full self-start items-center justify-between rounded-lg border bg-card p-3 sm:p-4', className)}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  )
}

export function ServiceCardListSkeleton({ count = 4, className }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Card de cliente (alinhado ao `ClienteCard`: xl quadrado na grade + barra de ações inferior) */
export function ClientCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        'relative flex min-w-0 flex-col gap-0 overflow-hidden py-0 shadow-sm',
        'xl:aspect-square',
        className,
      )}
    >
      <CardContent className="flex min-h-0 flex-1 flex-col gap-0 p-0">
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            'max-md:flex-row max-md:items-center max-md:gap-3 max-md:p-3 max-md:pb-3',
            'md:max-lg:flex-col md:max-lg:items-center md:max-lg:gap-3 md:max-lg:p-4 md:max-lg:pb-4',
            'lg:flex lg:flex-1 lg:flex-col lg:items-center lg:justify-center lg:gap-2 lg:p-4 lg:pt-5 lg:pb-4',
          )}
        >
          <Skeleton className="h-11 w-11 shrink-0 rounded-full border-2 border-border/30 md:max-lg:h-16 md:max-lg:w-16 lg:h-14 lg:w-14 xl:h-[4.5rem] xl:w-[4.5rem]" />
          <div
            className={cn(
              'flex min-h-0 w-full min-w-0 flex-1 flex-col justify-center gap-2 px-1',
              'max-md:items-start max-md:gap-1.5',
              'md:max-lg:items-center',
              'lg:items-center',
            )}
          >
            <Skeleton className="h-3.5 w-4/5 max-w-[10rem] max-md:w-full max-md:max-w-[14rem]" />
            <Skeleton className="h-3 w-full max-w-[11rem] max-md:max-w-[13rem]" />
            <Skeleton className="h-3 w-3/5 max-w-[9rem] max-md:w-4/5" />
          </div>
        </div>
        <div
          className={cn(
            'flex shrink-0 items-center justify-center gap-0.5 border-t border-border/70 bg-gradient-to-b from-muted/35 to-muted/20 px-2 py-2.5',
            'dark:from-muted/25 dark:to-muted/10',
          )}
        >
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="mx-1 h-6 w-px shrink-0 bg-border/80" aria-hidden />
          <Skeleton className="size-10 shrink-0 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ClientCardListSkeleton({ count = 5, className }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ClientCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Card da equipe: corpo + barra de ações (alinhado ao `TeamMemberCard` com menu) */
export function TeamMemberCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        'relative flex min-w-0 flex-col gap-0 overflow-hidden py-0 shadow-sm',
        'lg:aspect-auto',
        className,
      )}
    >
      <CardContent className="flex min-h-0 flex-1 flex-col gap-5 p-0 max-md:gap-4">
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            'max-md:flex-row max-md:items-center max-md:gap-3 max-md:p-3 max-md:pb-3',
            'md:max-lg:flex-col md:max-lg:items-center md:max-lg:gap-3 md:max-lg:p-4 md:max-lg:pb-4',
            'lg:flex lg:flex-1 lg:flex-col lg:items-center lg:justify-center lg:gap-2 lg:p-4 lg:pt-5 lg:pb-4',
          )}
        >
          <Skeleton className="h-11 w-11 shrink-0 rounded-full border-2 border-border/30 md:max-lg:h-16 md:max-lg:w-16 lg:h-14 lg:w-14 xl:h-[4.5rem] xl:w-[4.5rem]" />
          <div
            className={cn(
              'flex min-h-0 w-full min-w-0 flex-1 flex-col gap-2 px-1',
              'max-md:items-start max-md:justify-center max-md:gap-1.5',
              'md:max-lg:items-center',
              'lg:min-h-0 lg:justify-start lg:items-center',
            )}
          >
            <div className="flex w-full min-w-0 flex-col gap-1 max-md:items-start md:max-lg:items-center lg:items-center">
              <Skeleton className="h-3.5 w-4/5 max-w-[10rem] max-md:w-full max-md:max-w-[14rem]" />
              <div className="flex flex-wrap justify-start gap-1 md:max-lg:justify-center lg:justify-center">
                <Skeleton className="h-5 w-[4.5rem] shrink-0 rounded-full" />
              </div>
            </div>
            <div className="flex w-full flex-col gap-1 max-md:items-start md:max-lg:items-center lg:items-center lg:pt-0.5">
              <Skeleton className="h-3 w-full max-w-[11rem] max-md:max-w-[13rem]" />
              <Skeleton className="h-3 w-3/5 max-w-[9rem] max-md:w-4/5" />
            </div>
          </div>
        </div>
        <div
          className={cn(
            'flex shrink-0 items-center justify-center gap-0.5 rounded-b-xl border-t border-border/70 bg-gradient-to-b from-muted/35 to-muted/20 px-2 py-3',
            'dark:from-muted/25 dark:to-muted/10',
          )}
        >
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="mx-1 h-6 w-px shrink-0 bg-border/80" aria-hidden />
          <Skeleton className="size-10 shrink-0 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

export function TeamMemberListSkeleton({ count = 3, className }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <TeamMemberCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Barbearias e planos (super): article rounded-2xl */
export function SuperGridEntityCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-6 w-[85%] max-w-[200px]" />
        <Skeleton className="h-4 w-[45%] max-w-[120px]" />
        <Skeleton className="mt-1 h-3 w-full max-w-[240px]" />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/50 pt-4">
        <Skeleton className="h-7 w-16 rounded-full" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-8 w-[4.5rem] rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function SuperGridEntityListSkeleton({
  count = 8,
  className,
  listClassName,
}: {
  count?: number
  className?: string
  /** Sobrescreve a grade (ex.: planos usam `sm:grid-cols-2 xl:grid-cols-3`) */
  listClassName?: string
}) {
  return (
    <ul
      className={
        listClassName ??
        cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)
      }
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <SuperGridEntityCardSkeleton />
        </li>
      ))}
    </ul>
  )
}

/** Gráfico “Cadastros por mês” na página Barbearias (super) */
export function SuperBarbeariasCadastroMensalChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)} aria-busy="true" aria-label="Carregando gráfico">
      <CardHeader className="space-y-1 pb-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3.5 w-full max-w-lg" />
        <Skeleton className="h-3.5 w-full max-w-md" />
        <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          <div className="grid w-full gap-1.5 sm:max-w-[11rem]">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="grid w-full gap-1.5 sm:max-w-[11rem]">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex min-h-[240px] w-full items-end justify-between gap-1.5 px-1 pt-4 sm:min-h-[260px]">
          {Array.from({ length: 12 }).map((_, i) => {
            const top = 22 + (i % 5) * 10
            const bottom = 28 + (i % 4) * 12
            return (
              <div
                key={i}
                className="flex min-w-0 flex-1 flex-col items-stretch justify-end gap-px"
              >
                <Skeleton className="w-full rounded-t-[4px]" style={{ height: top }} />
                <Skeleton className="w-full rounded-b-[4px]" style={{ height: bottom }} />
              </div>
            )
          })}
        </div>
        <div
          className={cn(
            'border-border/50 mt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-dashed pt-3',
            'sm:justify-start',
          )}
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 min-w-10 rounded-md" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 min-w-10 rounded-md" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** Usuários super admin: card com ações e bloco Barbearias */
export function SuperUsuarioCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('flex min-h-0 flex-col', className)}>
      <CardContent className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full max-w-[200px]" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Skeleton className="h-8 rounded-md" />
          <Skeleton className="h-8 rounded-md" />
        </div>
        <div className="mt-auto border-t pt-2">
          <Skeleton className="mb-2 h-2.5 w-20" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

export function SuperUsuarioGridSkeleton({ count = 8, className }: ListSkeletonProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SuperUsuarioCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Lista de assinaturas (super) */
export function SubscriptionRowSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-4 w-40 max-w-[60%]" />
          <Skeleton className="h-6 w-24 shrink-0 rounded-full" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-3 w-48 max-w-[70%]" />
          <Skeleton className="h-8 w-28 shrink-0 rounded-md" />
        </div>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <div className="flex justify-between gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex justify-between gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** Linha da tabela de assinaturas (desktop) */
export function SubscriptionTableRowSkeleton({ className }: { className?: string }) {
  return (
    <tr className={cn('border-b border-border', className)}>
      <td className="w-11 px-2 py-3">
        <Skeleton className="h-4 w-4 rounded-[4px]" />
      </td>
      <td className="px-3 py-3">
        <Skeleton className="h-4 w-36" />
      </td>
      <td className="min-w-0 px-3 py-3">
        <Skeleton className="h-6 w-24 shrink-0 rounded-md" />
      </td>
      <td className="px-3 py-3">
        <Skeleton className="h-6 w-20 rounded-full" />
      </td>
      <td className="px-3 py-3">
        <Skeleton className="h-4 w-16" />
      </td>
      <td className="px-3 py-3">
        <Skeleton className="h-6 w-24 rounded-full" />
      </td>
      <td className="px-3 py-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-3 py-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-3 py-3 text-right">
        <Skeleton className="ml-auto h-8 w-28" />
      </td>
    </tr>
  )
}

export function SubscriptionListSkeleton({ count = 4, className }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SubscriptionRowSkeleton key={i} />
      ))}
    </div>
  )
}

/** Página de assinaturas: cards de KPI + busca + tabela (lg) ou lista de cards */
export function SuperAssinaturasPageSkeleton({ count = 5 }: ListSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-12" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-8 w-12" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full sm:max-w-md" />
        <Skeleton className="h-9 w-full sm:w-[140px]" />
      </div>
      <div className="hidden overflow-hidden rounded-xl border bg-card lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {Array.from({ length: 9 }).map((_, i) => (
                <th
                  key={i}
                  className={cn('px-3 py-3', i === 8 ? 'text-right' : 'text-left')}
                >
                  <Skeleton className={cn('h-3 w-20', i === 8 && 'ml-auto')} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: count }).map((_, i) => (
              <SubscriptionTableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
      <SubscriptionListSkeleton count={count} className="lg:hidden" />
    </div>
  )
}

/** Grade de planos no cadastro de barbearia (rounded-xl) */
export function CadastroPlanoGridSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid gap-3 md:grid-cols-3', className)}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-4">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-1 h-3 w-4/5" />
        </div>
      ))}
    </div>
  )
}

/** Um dia na página de horários do barbeiro */
export function HorarioDayRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <div className="flex min-w-[100px] items-center gap-2">
        <Skeleton className="h-5 w-9 rounded-full" />
        <Skeleton className="h-4 w-9" />
      </div>
      <div className="flex flex-1 items-center gap-2">
        <Skeleton className="h-9 w-[90px]" />
        <Skeleton className="h-3 w-2 shrink-0" />
        <Skeleton className="h-9 w-[90px]" />
      </div>
    </div>
  )
}

export function HorariosScheduleSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <HorarioDayRowSkeleton key={i} />
        ))}
      </CardContent>
    </Card>
  )
}

/** Cliente home: card da barbearia */
export function ClienteHomeBarbeariaSkeleton() {
  return (
    <Card className="overflow-hidden border-accent/20 bg-accent/10">
      <CardContent className="flex items-center gap-3 p-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ClienteHomeQuickActionSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="flex flex-col items-center justify-center gap-2 p-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </CardContent>
    </Card>
  )
}

export function ClienteProximoAgendamentoSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** Fluxo agendar: lista de serviços */
export function AgendarFlowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <ServiceCardListSkeleton count={count} />
    </div>
  )
}

/** Configurações admin: dados + conta */
export function AdminConfiguracoesPageSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Skeleton className="h-px w-full bg-border" />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

/** Super admin: formulário nova/editar barbearia */
export function SuperBarbeariaFormCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </CardContent>
      <div className="flex flex-col-reverse gap-2 border-t px-6 pt-6 sm:flex-row sm:justify-end">
        <Skeleton className="h-10 w-full sm:w-24" />
        <Skeleton className="h-10 w-full sm:w-36" />
      </div>
    </Card>
  )
}

/** Perfil (cliente / barbeiro / super): card “Seus dados” */
export function ProfileFormCardSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full" />
              {i === 0 ? <Skeleton className="h-3 w-full max-w-xs" /> : null}
            </div>
          ))}
          <div className="flex flex-col items-center gap-3 py-2">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-9 w-28" />
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

/** Alias genérico (lista de cards horizontais simples) */
export function LoadingSkeleton({ count = 3, className }: ListSkeletonProps) {
  return <ListSkeleton count={count} className={className} />
}
