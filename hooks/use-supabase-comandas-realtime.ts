'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Atualiza a lista quando há alterações em `comandas` da barbearia.
 * Requer Realtime ativado para `comandas` no Supabase.
 */
export function useSupabaseComandasRealtime(
  enabled: boolean,
  barbeariaId: string | null | undefined,
  onInvalidate: () => void,
) {
  const onInvalidateRef = useRef(onInvalidate)
  onInvalidateRef.current = onInvalidate

  useEffect(() => {
    if (!enabled || !barbeariaId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`rt-comandas-bb-${barbeariaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comandas',
          filter: `barbearia_id=eq.${barbeariaId}`,
        },
        () => {
          onInvalidateRef.current()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, barbeariaId])
}
