'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserSafe } from '@/lib/supabase/get-auth-user-safe'
import { tenantBarbeariaDashboardPath } from '@/lib/routes'
import {
  hasTenantUnidadeGateCompleted,
  markTenantUnidadeGateCompleted,
  setSessionConfirmedTenantSlug,
} from '@/lib/tenant-unidade-session'
import { signOutWithPersistenceClear } from '@/lib/supabase/sign-out-client'
import { clearProfileCache } from '@/lib/profile-cache'

type MinhaUnidade = { id: string; nome: string; slug: string }

function parseMinhasUnidades(
  rows: { barbearias?: MinhaUnidade | MinhaUnidade[] | null }[] | null,
): MinhaUnidade[] {
  const byId = new Map<string, MinhaUnidade>()
  for (const row of rows ?? []) {
    const raw = row.barbearias
    const b = Array.isArray(raw) ? raw[0] : raw
    if (b?.id && b.slug) {
      byId.set(b.id, { id: b.id, nome: b.nome?.trim() || b.slug, slug: b.slug })
    }
  }
  return [...byId.values()].sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }),
  )
}

type GatePhase =
  /** Verificando em segundo plano — não bloqueia a UI. */
  | 'checking'
  | 'error'
  | 'url-forbidden'
  | 'confirm'
  | 'idle'

type TenantUnidadeSessionGateProps = {
  slug: string
}

/**
 * Com **uma** unidade: entra direto (sem modal).
 * Com **várias**: modal **uma vez** após o login (flag em sessionStorage); navegar no painel não reabre.
 * Sem vínculos: não exibe gate e não bloqueia navegação.
 */
export function TenantUnidadeSessionGate({ slug }: TenantUnidadeSessionGateProps) {
  const router = useRouter()
  const routerRef = useRef(router)
  useLayoutEffect(() => {
    routerRef.current = router
  })
  const titleId = useId()
  const primaryRef = useRef<HTMLButtonElement>(null)
  const [phase, setPhase] = useState<GatePhase>('checking')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [unidades, setUnidades] = useState<MinhaUnidade[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string>('')

  const runGateCheck = useCallback(async () => {
    if (!slug) {
      setPhase('checking')
      return
    }

    setPhase('checking')
    setLoadError(null)

    const supabase = createClient()
    const user = await getAuthUserSafe(supabase)

    if (!user) {
      setPhase('idle')
      return
    }

    const { data: buRows, error: buErr } = await supabase
      .from('barbearia_users')
      .select('barbearias ( id, nome, slug )')
      .eq('user_id', user.id)

    if (buErr) {
      setLoadError('Não foi possível carregar suas unidades. Tente de novo.')
      setPhase('error')
      return
    }

    const list = parseMinhasUnidades(buRows)
    setUnidades(list)

    if (list.length === 0) {
      setPhase('idle')
      return
    }

    if (list.length === 1) {
      const only = list[0]
      setSessionConfirmedTenantSlug(only.slug)
      markTenantUnidadeGateCompleted()
      if (only.slug !== slug) {
        routerRef.current.replace(tenantBarbeariaDashboardPath(only.slug))
      }
      setPhase('idle')
      return
    }

    const urlOk = list.some((u) => u.slug === slug)
    if (!urlOk) {
      setSelectedSlug(list[0]?.slug ?? '')
      setPhase('url-forbidden')
      return
    }

    if (hasTenantUnidadeGateCompleted()) {
      setPhase('idle')
      return
    }

    setSelectedSlug(slug)
    setPhase('confirm')
  }, [slug])

  useEffect(() => {
    void runGateCheck()
  }, [runGateCheck])

  useEffect(() => {
    const blocking = phase === 'error' || phase === 'url-forbidden' || phase === 'confirm'
    if (!blocking) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'confirm' || phase === 'url-forbidden') {
      const t = window.setTimeout(() => primaryRef.current?.focus(), 50)
      return () => window.clearTimeout(t)
    }
  }, [phase])

  const selectedUnidade = useMemo(
    () => unidades.find((u) => u.slug === selectedSlug) ?? null,
    [unidades, selectedSlug],
  )

  const handleConfirmarUnidade = useCallback(() => {
    if (!selectedUnidade) return
    setSessionConfirmedTenantSlug(selectedUnidade.slug)
    markTenantUnidadeGateCompleted()
    if (selectedUnidade.slug !== slug) {
      routerRef.current.replace(tenantBarbeariaDashboardPath(selectedUnidade.slug))
    } else {
      setPhase('idle')
    }
  }, [selectedUnidade, slug])

  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    clearProfileCache()
    await signOutWithPersistenceClear(supabase)
    router.push('/login')
  }, [router])

  if (phase === 'idle' || phase === 'checking') {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-background/90 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <Card className="relative w-full max-w-md border-zinc-200/90 shadow-xl dark:border-white/[0.12] dark:bg-zinc-950/90">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="h-5 w-5 shrink-0" aria-hidden />
            <CardTitle id={titleId} className="text-xl font-semibold tracking-tight">
              {phase === 'error'
                ? 'Não foi possível carregar'
                : phase === 'confirm'
                  ? 'Confirmar unidade'
                  : 'Seleção de unidade'}
            </CardTitle>
          </div>
          <CardDescription className="text-pretty text-sm leading-relaxed">
            {phase === 'error'
              ? loadError
              : phase === 'url-forbidden'
                ? 'Você não tem acesso à unidade deste endereço. Escolha uma das suas unidades abaixo ou saia da conta.'
                : 'Após entrar no sistema, confirme em qual unidade você está trabalhando. Isso só é pedido uma vez por sessão; ao navegar no painel o modal não volta a aparecer.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {phase === 'error' ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" className="flex-1" onClick={() => void runGateCheck()}>
                Tentar novamente
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => void handleLogout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          ) : null}

          {(phase === 'confirm' || phase === 'url-forbidden') && unidades.length > 0 ? (
            <>
              <ul className="max-h-[min(50vh,22rem)] space-y-2 overflow-y-auto pr-0.5" role="listbox">
                {unidades.map((u) => {
                  const selected = u.slug === selectedSlug
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => setSelectedSlug(u.slug)}
                        className={cn(
                          'flex w-full flex-col items-start rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                          selected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border bg-card hover:bg-muted/60',
                        )}
                      >
                        <span className="font-medium text-foreground">{u.nome}</span>
                        <span className="text-xs text-muted-foreground">/{u.slug}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <Button
                ref={primaryRef}
                type="button"
                className="h-11 w-full"
                disabled={!selectedUnidade}
                onClick={handleConfirmarUnidade}
              >
                Entrar nesta unidade
              </Button>
              <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => void handleLogout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair da conta
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
