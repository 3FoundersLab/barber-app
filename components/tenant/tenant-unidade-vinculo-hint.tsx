'use client'

import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserSafe } from '@/lib/supabase/get-auth-user-safe'
import { cn } from '@/lib/utils'

type Unidade = { nome: string; slug: string }

function parseUnidadesFromRows(
  rows: { barbearias?: Unidade | Unidade[] | null }[] | null,
): Unidade[] {
  const bySlug = new Map<string, Unidade>()
  for (const row of rows ?? []) {
    const raw = row.barbearias
    const b = Array.isArray(raw) ? raw[0] : raw
    if (b?.slug) {
      bySlug.set(b.slug, { nome: b.nome?.trim() || b.slug, slug: b.slug })
    }
  }
  return [...bySlug.values()].sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }),
  )
}

type TenantUnidadeVinculoHintProps = {
  /** Slug da barbearia na URL (`/[slug]/...`). */
  tenantSlug: string
  /** Sidebar recolhida: ícone + tooltip / sr-only. */
  collapsed?: boolean
  className?: string
}

type HintState =
  | { status: 'loading' }
  | { status: 'ready'; semUnidade: true }
  | { status: 'ready'; semUnidade: false; unidadeAtiva: Unidade | null }

/**
 * Faixa no sidebar: unidade ativa (nome + slug) ou “sem unidade vinculada”.
 */
export function TenantUnidadeVinculoHint({
  tenantSlug,
  collapsed = false,
  className,
}: TenantUnidadeVinculoHintProps) {
  const [state, setState] = useState<HintState>({ status: 'loading' })

  const slug = tenantSlug.trim()

  useEffect(() => {
    if (!slug) {
      return
    }

    let cancel = false
    async function run() {
      try {
        setState({ status: 'loading' })
        const supabase = createClient()
        const user = await getAuthUserSafe(supabase)
        if (!user) {
          if (!cancel) setState({ status: 'ready', semUnidade: true })
          return
        }

        const { data: buRows, error: buErr } = await supabase
          .from('barbearia_users')
          .select('barbearias ( id, nome, slug )')
          .eq('user_id', user.id)

        if (cancel) return

        if (buErr) {
          setState({ status: 'ready', semUnidade: true })
          return
        }

        if (!buRows?.length) {
          setState({ status: 'ready', semUnidade: true })
          return
        }

        const list = parseUnidadesFromRows(buRows)
        if (list.length === 0) {
          setState({ status: 'ready', semUnidade: true })
          return
        }

        const match = list.find((u) => u.slug === slug) ?? null
        let ativa: Unidade | null = match

        if (!ativa) {
          const { data: b } = await supabase.from('barbearias').select('nome, slug').eq('slug', slug).maybeSingle()
          if (!cancel && b?.slug) {
            ativa = { nome: b.nome?.trim() || b.slug, slug: b.slug }
          }
        }

        if (!cancel) {
          setState({ status: 'ready', semUnidade: false, unidadeAtiva: ativa })
        }
      } catch {
        if (!cancel) setState({ status: 'ready', semUnidade: true })
      }
    }
    void run()
    return () => {
      cancel = true
    }
  }, [slug])

  if (!slug) {
    return null
  }

  if (state.status === 'loading') {
    return null
  }

  if (state.semUnidade) {
    if (collapsed) {
      return <span className="sr-only">Sem unidade vinculada</span>
    }
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground dark:bg-white/[0.04]',
          className,
        )}
      >
        <Building2 className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        <span className="truncate">Sem unidade vinculada</span>
      </div>
    )
  }

  const u = state.unidadeAtiva
  const labelPrincipal = u?.nome ?? slug
  const pathSlug = u?.slug ?? slug

  if (collapsed) {
    return (
      <div
        className="flex justify-center py-0.5"
        title={`Unidade ativa: ${labelPrincipal} (/${pathSlug})`}
      >
        <Building2 className="h-4 w-4 shrink-0 text-primary opacity-90" aria-hidden />
        <span className="sr-only">
          Unidade ativa: {labelPrincipal}, identificador /{pathSlug}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-md border border-primary/15 bg-primary/5 px-2 py-2 text-xs dark:border-primary/25 dark:bg-primary/10',
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/80 dark:text-primary/90">
        Unidade ativa
      </p>
      <div className="mt-1 flex items-start gap-2">
        <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary opacity-90" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{labelPrincipal}</p>
          <p className="truncate text-[11px] text-muted-foreground">/{pathSlug}</p>
        </div>
      </div>
    </div>
  )
}
