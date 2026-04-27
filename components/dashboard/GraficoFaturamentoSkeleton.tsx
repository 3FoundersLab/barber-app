'use client'

export function GraficoFaturamentoSkeleton() {
  return (
    <div
      className="border-border/80 bg-card/80 flex min-h-[280px] flex-col gap-4 rounded-xl border p-4 shadow-sm"
      aria-hidden
    >
      <div className="flex items-center justify-between gap-2">
        <div className="bg-muted h-5 w-40 animate-pulse rounded-md" />
        <div className="bg-muted h-8 w-24 animate-pulse rounded-md" />
      </div>
      <div className="bg-muted/80 mt-2 min-h-[200px] flex-1 animate-pulse rounded-lg" />
    </div>
  )
}
