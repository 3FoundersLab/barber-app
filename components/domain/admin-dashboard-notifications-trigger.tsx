'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DashboardAlertaRow } from '@/components/domain/admin-dashboard-alerta-row'
import { cn } from '@/lib/utils'
import type { AlertaDashboard } from '@/types/admin-dashboard'

export function AdminDashboardNotificationsTrigger({
  alertas,
  alertasArquivados = [],
  tiposOcultos = [],
  isLoading,
  onMarkAllAsRead,
  openRequestKey = 0,
  lidosIds = [],
  lidosAt = {},
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onUnarchive,
  onMuteType,
  onUnmuteType,
}: {
  alertas: AlertaDashboard[]
  alertasArquivados?: AlertaDashboard[]
  tiposOcultos?: AlertaDashboard['tipo'][]
  isLoading: boolean
  onMarkAllAsRead?: () => void
  /** Incrementa para abrir o sheet a partir de outros controles (ex.: “Ver mais” na lista). */
  openRequestKey?: number
  /** IDs marcados como lidos (aparecem opacos no sheet). */
  lidosIds?: string[]
  /** Timestamp ISO de quando cada alerta foi lido. */
  lidosAt?: Record<string, string>
  /** Marca um alerta como lido (card e ação). */
  onMarkAsRead?: (id: string) => void
  /** Desmarca um alerta lido. */
  onMarkAsUnread?: (id: string) => void
  /** Remove da lista principal. */
  onArchive?: (id: string) => void
  /** Restaura da lista de arquivadas para principais. */
  onUnarchive?: (id: string) => void
  /** Não mostra mais a categoria/tipo. */
  onMuteType?: (tipo: AlertaDashboard['tipo']) => void
  /** Reativa categoria/tipo ocultado. */
  onUnmuteType?: (tipo: AlertaDashboard['tipo']) => void
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [marcandoIds, setMarcandoIds] = useState<string[]>([])
  const [arquivadasOpen, setArquivadasOpen] = useState(false)
  const [tiposOcultosOpen, setTiposOcultosOpen] = useState(false)

  useEffect(() => {
    if (openRequestKey > 0) setSheetOpen(true)
  }, [openRequestKey])

  const lidosSet = useMemo(() => new Set(lidosIds), [lidosIds])
  const naoLidas = useMemo(() => alertas.filter((a) => !lidosSet.has(a.id)).length, [alertas, lidosSet])
  const count = alertas.length
  const countArquivadas = alertasArquivados.length
  const countTiposOcultos = tiposOcultos.length
  const badgeLabel = naoLidas > 9 ? '9+' : String(naoLidas)
  const prioridadeTipo = useMemo(
    () =>
      ({
        urgente: 0,
        atencao: 1,
        especial: 2,
        info: 3,
        sucesso: 4,
      }) satisfies Record<AlertaDashboard['tipo'], number>,
    [],
  )
  const alertasOrdenados = useMemo(() => {
    return [...alertas].sort((a, b) => {
      const aLido = lidosSet.has(a.id)
      const bLido = lidosSet.has(b.id)
      if (aLido !== bLido) return aLido ? 1 : -1
      if (!aLido && !bLido) return prioridadeTipo[a.tipo] - prioridadeTipo[b.tipo]
      const aAt = lidosAt[a.id] ? new Date(lidosAt[a.id]).getTime() : 0
      const bAt = lidosAt[b.id] ? new Date(lidosAt[b.id]).getTime() : 0
      return bAt - aAt
    })
  }, [alertas, lidosAt, lidosSet, prioridadeTipo])
  const labelTipo = useMemo(
    () =>
      ({
        urgente: 'Urgentes',
        atencao: 'Atenção',
        especial: 'Aniversários',
        info: 'Informativas',
        sucesso: 'Sucesso',
      }) satisfies Record<AlertaDashboard['tipo'], string>,
    [],
  )

  function formatReadAgo(iso?: string): string {
    if (!iso) return 'Lida'
    const diffMs = Date.now() - new Date(iso).getTime()
    if (!Number.isFinite(diffMs) || diffMs < 0) return 'Lida'
    const min = Math.floor(diffMs / 60000)
    if (min < 1) return 'Lida • agora'
    if (min < 60) return `Lida • há ${min} min`
    const hours = Math.floor(min / 60)
    if (hours < 24) return `Lida • há ${hours} h`
    const days = Math.floor(hours / 24)
    return `Lida • há ${days} d`
  }

  function handleLimpar() {
    if (!onMarkAllAsRead) return
    if (alertas.length > 3) {
      const ok = window.confirm(`Marcar ${alertas.length} notificações como lidas?`)
      if (!ok) return
    }
    onMarkAllAsRead()
  }

  function handleMarcarComAnimacao(id: string) {
    if (lidosSet.has(id) || marcandoIds.includes(id)) return
    setMarcandoIds((prev) => [...prev, id])
    window.setTimeout(() => {
      onMarkAsRead?.(id)
      setMarcandoIds((prev) => prev.filter((x) => x !== id))
    }, 190)
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
            {!isLoading && count > 0 && onMarkAllAsRead ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground -mt-1 h-8 shrink-0 px-2 text-xs"
                onClick={handleLimpar}
              >
                Marcar todas como lidas
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
          ) : count === 0 && countArquivadas === 0 && countTiposOcultos === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">Nenhum alerta no momento.</p>
          ) : (
            <>
              {alertasOrdenados.map((a) => (
                <DashboardAlertaRow
                  key={a.id}
                  alerta={a}
                  lido={lidosSet.has(a.id)}
                  lidoInfo={formatReadAgo(lidosAt[a.id])}
                  isMarkingAsRead={marcandoIds.includes(a.id)}
                  onMarkAsRead={() => handleMarcarComAnimacao(a.id)}
                  onMarkAsUnread={() => onMarkAsUnread?.(a.id)}
                  onAction={() => handleMarcarComAnimacao(a.id)}
                  onArchive={() => onArchive?.(a.id)}
                  onMuteType={() => onMuteType?.(a.tipo)}
                />
              ))}
              {countArquivadas > 0 ? (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground mb-1 h-8 w-full justify-between px-2 text-xs font-semibold uppercase tracking-wide"
                    onClick={() => setArquivadasOpen((v) => !v)}
                  >
                    <span>Arquivadas ({countArquivadas})</span>
                    {arquivadasOpen ? <ChevronUp className="size-3.5" aria-hidden /> : <ChevronDown className="size-3.5" aria-hidden />}
                  </Button>
                  {arquivadasOpen ? (
                    <div className="space-y-3">
                      {alertasArquivados.map((a) => (
                        <DashboardAlertaRow
                          key={`arq-${a.id}`}
                          alerta={a}
                          lido
                          lidoInfo={formatReadAgo(lidosAt[a.id])}
                          arquivada
                          onUnarchive={() => onUnarchive?.(a.id)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {countTiposOcultos > 0 ? (
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground mb-1 h-8 w-full justify-between px-2 text-xs font-semibold uppercase tracking-wide"
                    onClick={() => setTiposOcultosOpen((v) => !v)}
                  >
                    <span>Tipos ocultos ({countTiposOcultos})</span>
                    {tiposOcultosOpen ? <ChevronUp className="size-3.5" aria-hidden /> : <ChevronDown className="size-3.5" aria-hidden />}
                  </Button>
                  {tiposOcultosOpen ? (
                    <div className="space-y-2">
                      {tiposOcultos.map((tipo) => (
                        <div
                          key={`tipo-oculto-${tipo}`}
                          className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2"
                        >
                          <p className="text-sm">{labelTipo[tipo]}</p>
                          <Button type="button" variant="outline" size="sm" onClick={() => onUnmuteType?.(tipo)}>
                            Mostrar novamente
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
