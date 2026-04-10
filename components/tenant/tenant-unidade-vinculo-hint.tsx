'use client'

import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type TenantUnidadeVinculoHintProps = {
  /** Sidebar recolhida: só leitores de tela. */
  collapsed?: boolean
  className?: string
}

/**
 * Indica na navegação quando o usuário não tem linhas em `barbearia_users`.
 * Não bloqueia ações — apenas contexto visual.
 */
export function TenantUnidadeVinculoHint({ collapsed = false, className }: TenantUnidadeVinculoHintProps) {
  const [semUnidade, setSemUnidade] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancel = false
    async function run() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (!cancel) setReady(true)
        return
      }
      const { data, error } = await supabase
        .from('barbearia_users')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
      if (cancel) return
      setSemUnidade(!error && (!data || data.length === 0))
      setReady(true)
    }
    void run()
    return () => {
      cancel = true
    }
  }, [])

  if (!ready || !semUnidade) return null

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
