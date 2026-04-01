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

/** Alinha ao `AppointmentCard` (admin/financeiro/agenda): horário, cliente, status e ações */
export function AppointmentCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-lg border bg-card', className)}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
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
    <div className={cn('flex items-center justify-between rounded-lg border bg-card p-4', className)}>
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

export function ClientCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border bg-card p-4', className)}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
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

/** Card da equipe (avatar + nome + menu) */
export function TeamMemberCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center gap-3 p-4">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
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
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-40 max-w-[60%]" />
          <Skeleton className="h-3 w-48 max-w-[85%]" />
        </div>
        <Skeleton className="h-3 w-20 shrink-0" />
      </CardContent>
    </Card>
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
