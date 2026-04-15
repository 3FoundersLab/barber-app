'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DashboardAlertaRow } from '@/components/domain/admin-dashboard-alerta-row'
import { cn } from '@/lib/utils'
import type { AlertaDashboard } from '@/types/admin-dashboard'

export function AdminDashboardNotificationsTrigger({
  alertas,
  isLoading,
  onClearAll,
  openRequestKey = 0,
  lidosIds = [],
}: {
  alertas: AlertaDashboard[]
  isLoading: boolean
  onClearAll?: () => void
  /** Incrementa para abrir o sheet a partir de outros controles (ex.: “Ver mais” na lista). */
  openRequestKey?: number
  /** IDs marcados como lidos (aparecem opacos no sheet). */
  lidosIds?: string[]
}) {
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (openRequestKey > 0) setSheetOpen(true)
  }, [openRequestKey])

  const lidosSet = useMemo(() => new Set(lidosIds), [lidosIds])
  const naoLidas = useMemo(() => alertas.filter((a) => !lidosSet.has(a.id)).length, [alertas, lidosSet])
  const count = alertas.length
  const badgeLabel = naoLidas > 9 ? '9+' : String(naoLidas)

  function handleLimpar() {
    onClearAll?.()
    setSheetOpen(false)
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 shrink-0 rounded-full"
          aria-label={`Notificações${naoLidas > 0 ? `, ${naoLidas} não lida(s)` : count > 0 ? ', todas lidas' : ''}`}
        >
          <Bell className="size-5 text-muted-foreground" aria-hidden />
          {!isLoading && naoLidas > 0 ? (
            <span
              className={cn(
                'absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full',
                'bg-primary px-1 text-[10px] font-semibold text-primary-foreground',
              )}
            >
              {badgeLabel}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className={cn(
          'flex w-full flex-col gap-0 sm:max-w-xl',
          'px-5 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8',
        )}
      >
        <SheetHeader className="space-y-0 p-0 text-left">
          <div className="flex items-start justify-between gap-4 pr-10">
            <SheetTitle className="text-lg leading-tight">Notificações</SheetTitle>
            {!isLoading && count > 0 && onClearAll ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground -mt-1 h-8 shrink-0 px-2 text-xs"
                onClick={handleLimpar}
              >
                Limpar
              </Button>
            ) : null}
          </div>
        </SheetHeader>
        <div className="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5">
          {isLoading ? (
            <div className="space-y-2">
              <div className="bg-muted h-16 animate-pulse rounded-lg" />
              <div className="bg-muted h-16 animate-pulse rounded-lg" />
            </div>
          ) : count === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">Nenhum alerta no momento.</p>
          ) : (
            alertas.map((a) => (
              <DashboardAlertaRow key={a.id} alerta={a} lido={lidosSet.has(a.id)} />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
