'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserSafe } from '@/lib/supabase/get-auth-user-safe'

/** Nome ou e-mail do utilizador autenticado para o campo «Gerado por» no PDF. */
export function usePdfGeradoPor(): string {
  const [label, setLabel] = useState('—')

  useEffect(() => {
    let alive = true
    void (async () => {
      const u = await getAuthUserSafe(createClient())
      if (!alive) return
      const meta = u?.user_metadata as { full_name?: string } | undefined
      const n =
        (typeof meta?.full_name === 'string' && meta.full_name.trim()) || u?.email || '—'
      setLabel(n)
    })()
    return () => {
      alive = false
    }
  }, [])

  return label
}
