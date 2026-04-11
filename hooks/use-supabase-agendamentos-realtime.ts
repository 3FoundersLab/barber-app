'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Recarrega a agenda quando há INSERT/UPDATE/DELETE em `agendamentos`.
 * Requer Realtime ativado para a tabela `agendamentos` no projeto Supabase (Database → Replication).
 */
export function useSupabaseAgendamentosRealtime(
  enabled: boolean,
  scope: 'barbearia' | 'barbeiro',
  id: string | null | undefined,
  onInvalidate: () => void,
) {
  const onInvalidateRef = useRef(onInvalidate)
  onInvalidateRef.current = onInvalidate

  useEffect(() => {
    if (!enabled || !id) return
    const supabase = createClient()
    const filter = scope === 'barbearia' ? `barbearia_id=eq.${id}` : `barbeiro_id=eq.${id}`
    const channelName = scope === 'barbearia' ? `rt-agendamentos-bb-${id}` : `rt-agendamentos-br-${id}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agendamentos',
          filter,
        },
        () => {
          onInvalidateRef.current()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, scope, id])
}
