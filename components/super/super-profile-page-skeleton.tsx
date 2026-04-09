import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { superProfileGlassCardClass } from '@/components/super/super-profile-styles'

export function SuperProfilePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className={cn(superProfileGlassCardClass, 'p-6')}>
        <div className="flex gap-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full bg-zinc-200/90 dark:bg-white/10" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-6 w-48 bg-zinc-200/90 dark:bg-white/10" />
            <Skeleton className="h-4 w-32 bg-zinc-200/90 dark:bg-white/10" />
            <Skeleton className="h-3 w-full max-w-xs bg-zinc-200/90 dark:bg-white/10" />
          </div>
        </div>
      </div>
      <div className={cn(superProfileGlassCardClass, 'overflow-hidden')}>
        <div className="border-b border-zinc-200/80 px-5 py-4 dark:border-white/[0.06] md:px-6">
          <Skeleton className="h-4 w-36 bg-zinc-200/90 dark:bg-white/10" />
          <Skeleton className="mt-2 h-3 w-56 bg-zinc-200/90 dark:bg-white/10" />
        </div>
        <div className="space-y-5 p-5 md:p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20 bg-zinc-200/90 dark:bg-white/10" />
              <Skeleton className="h-10 w-full bg-zinc-200/90 dark:bg-white/10" />
              {i === 0 ? <Skeleton className="h-3 w-full max-w-xs bg-zinc-200/90 dark:bg-white/10" /> : null}
            </div>
          ))}
          <div className="flex flex-col items-center gap-3 py-2">
            <Skeleton className="h-24 w-24 rounded-full bg-zinc-200/90 dark:bg-white/10" />
            <Skeleton className="h-9 w-28 bg-zinc-200/90 dark:bg-white/10" />
          </div>
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-full bg-zinc-200/90 dark:bg-white/10" />
    </div>
  )
}

/** Skeleton alinhado ao fluxo longo de Configurações (tenant): barbearia + assinatura + sessão. */
export function SuperProfileTenantConfigSkeleton() {
  return (
    <div className="space-y-6">
      <SuperProfilePageSkeleton />
      <div className={cn(superProfileGlassCardClass, 'overflow-hidden')}>
        <div className="border-b border-zinc-200/80 px-5 py-4 dark:border-white/[0.06] md:px-6">
          <Skeleton className="h-4 w-44 bg-zinc-200/90 dark:bg-white/10" />
          <Skeleton className="mt-2 h-3 w-64 bg-zinc-200/90 dark:bg-white/10" />
        </div>
        <div className="space-y-4 p-5 md:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24 bg-zinc-200/90 dark:bg-white/10" />
              <Skeleton className="h-10 w-full bg-zinc-200/90 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>
      <div className={cn(superProfileGlassCardClass, 'h-32 p-5 md:p-6')}>
        <Skeleton className="h-4 w-32 bg-zinc-200/90 dark:bg-white/10" />
        <Skeleton className="mt-4 h-20 w-full bg-zinc-200/90 dark:bg-white/10" />
      </div>
      <Skeleton className="h-12 w-full rounded-full bg-zinc-200/90 dark:bg-white/10" />
    </div>
  )
}
