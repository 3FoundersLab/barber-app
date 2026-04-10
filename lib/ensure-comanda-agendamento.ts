import type { SupabaseClient } from '@supabase/supabase-js'
import type { Agendamento } from '@/types'

type AgendamentoComandaRow = Pick<
  Agendamento,
  'id' | 'barbearia_id' | 'barbeiro_id' | 'cliente_id' | 'data'
>

/**
 * Garante uma comanda vinculada ao agendamento (a maioria já existe por trigger no INSERT).
 * Retorna o número da comanda para exibição após check-in.
 */
export async function ensureComandaForAgendamento(
  supabase: SupabaseClient,
  row: AgendamentoComandaRow,
): Promise<{ ok: true; numero: number } | { ok: false; message: string }> {
  const { data: existing, error: selErr } = await supabase
    .from('comandas')
    .select('numero')
    .eq('agendamento_id', row.id)
    .maybeSingle()

  if (selErr) {
    return { ok: false, message: selErr.message || 'Não foi possível verificar a comanda.' }
  }

  if (existing?.numero != null && Number.isFinite(Number(existing.numero))) {
    return { ok: true, numero: Number(existing.numero) }
  }

  const { data: inserted, error: insErr } = await supabase
    .from('comandas')
    .insert({
      barbearia_id: row.barbearia_id,
      agendamento_id: row.id,
      barbeiro_id: row.barbeiro_id,
      cliente_id: row.cliente_id,
      referencia_data: row.data,
      horario_inicio: new Date().toISOString(),
      status: 'aberta',
    })
    .select('numero')
    .single()

  if (insErr || inserted?.numero == null) {
    return {
      ok: false,
      message: insErr?.message || 'Não foi possível criar a comanda.',
    }
  }

  return { ok: true, numero: Number(inserted.numero) }
}
