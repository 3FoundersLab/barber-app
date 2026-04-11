import type { SupabaseClient } from '@supabase/supabase-js'
import { toUserFriendlyErrorMessage } from '@/lib/to-user-friendly-error'

export interface ServicoLinhaPayload {
  servico_id: string
  nome: string
  preco_unitario: number
  quantidade: number
}

export interface ProdutoLinhaPayload {
  produto_estoque_id: string
  nome: string
  preco_unitario: number
  quantidade: number
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v)
  return Number.isFinite(n) ? n : 0
}

/**
 * Integração estoque ↔ comanda (persistência).
 *
 * Ao salvar, auto-save ou **fechar e cobrar**, o editor chama este fluxo antes de gravar o status da
 * comanda: (1) devolve ao estoque as quantidades das linhas de produto já gravadas; (2) valida as
 * novas linhas contra o estoque atual; (3) baixa o estoque pelas novas quantidades; (4) regrava
 * `comanda_produtos` / `comanda_servicos`. Não chame outra baixa só no fechamento — evita dupla contagem.
 */
export async function syncComandaLinhas(
  supabase: SupabaseClient,
  comandaId: string,
  servicos: ServicoLinhaPayload[],
  produtos: ProdutoLinhaPayload[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: comanda, error: errComanda } = await supabase
    .from('comandas')
    .select('id, status, barbearia_id')
    .eq('id', comandaId)
    .single()

  if (errComanda || !comanda) {
    return { ok: false, message: 'Comanda não encontrada.' }
  }
  if (
    comanda.status !== 'aberta' &&
    comanda.status !== 'fechada' &&
    comanda.status !== 'cancelada'
  ) {
    return {
      ok: false,
      message: 'Estado da comanda não permite editar linhas.',
    }
  }

  const { data: oldProdutos, error: errOld } = await supabase
    .from('comanda_produtos')
    .select('produto_estoque_id, quantidade')
    .eq('comanda_id', comandaId)

  if (errOld) {
    return { ok: false, message: 'Não foi possível ler as linhas atuais de produtos.' }
  }

  for (const row of oldProdutos ?? []) {
    const q = Math.floor(num(row.quantidade))
    if (q <= 0) continue
    const { data: prod, error: eFetch } = await supabase
      .from('estoque_produtos')
      .select('quantidade')
      .eq('id', row.produto_estoque_id)
      .single()
    if (eFetch || !prod) {
      return { ok: false, message: 'Produto de estoque inconsistente ao restaurar quantidade.' }
    }
    const atual = Math.floor(num(prod.quantidade))
    const { error: eRest } = await supabase
      .from('estoque_produtos')
      .update({ quantidade: atual + q })
      .eq('id', row.produto_estoque_id)
    if (eRest) {
      return {
        ok: false,
        message: toUserFriendlyErrorMessage(eRest, { fallback: 'Erro ao restaurar estoque.' }),
      }
    }
  }

  for (const p of produtos) {
    const need = Math.floor(p.quantidade)
    if (need < 1) {
      return { ok: false, message: 'Quantidade de produto inválida.' }
    }
    const { data: prod, error: eFetch } = await supabase
      .from('estoque_produtos')
      .select('quantidade, nome')
      .eq('id', p.produto_estoque_id)
      .single()
    if (eFetch || !prod) {
      return { ok: false, message: `Produto não encontrado no estoque.` }
    }
    const disponivel = Math.floor(num(prod.quantidade))
    if (disponivel < need) {
      return {
        ok: false,
        message: `Estoque insuficiente para "${prod.nome ?? p.nome}" (disponível: ${disponivel}).`,
      }
    }
  }

  const { error: delP } = await supabase.from('comanda_produtos').delete().eq('comanda_id', comandaId)
  if (delP) {
    return {
      ok: false,
      message: toUserFriendlyErrorMessage(delP, { fallback: 'Erro ao limpar linhas de produtos.' }),
    }
  }
  const { error: delS } = await supabase.from('comanda_servicos').delete().eq('comanda_id', comandaId)
  if (delS) {
    return {
      ok: false,
      message: toUserFriendlyErrorMessage(delS, { fallback: 'Erro ao limpar linhas de serviços.' }),
    }
  }

  if (servicos.length > 0) {
    const { error: insS } = await supabase.from('comanda_servicos').insert(
      servicos.map((s) => ({
        comanda_id: comandaId,
        servico_id: s.servico_id,
        nome: s.nome,
        preco_unitario: s.preco_unitario,
        quantidade: Math.floor(s.quantidade),
      })),
    )
    if (insS) {
      return {
        ok: false,
        message: toUserFriendlyErrorMessage(insS, { fallback: 'Erro ao salvar serviços na comanda.' }),
      }
    }
  }

  for (const p of produtos) {
    const need = Math.floor(p.quantidade)
    const { data: prod, error: eFetch } = await supabase
      .from('estoque_produtos')
      .select('quantidade')
      .eq('id', p.produto_estoque_id)
      .single()
    if (eFetch || !prod) {
      return { ok: false, message: 'Erro ao confirmar estoque do produto.' }
    }
    const disponivel = Math.floor(num(prod.quantidade))
    if (disponivel < need) {
      return { ok: false, message: 'Estoque alterado durante o salvamento; tente novamente.' }
    }
    const { error: eDec } = await supabase
      .from('estoque_produtos')
      .update({ quantidade: disponivel - need })
      .eq('id', p.produto_estoque_id)
    if (eDec) {
      return {
        ok: false,
        message: toUserFriendlyErrorMessage(eDec, { fallback: 'Erro ao baixar estoque.' }),
      }
    }
  }

  if (produtos.length > 0) {
    const { error: insP } = await supabase.from('comanda_produtos').insert(
      produtos.map((p) => ({
        comanda_id: comandaId,
        produto_estoque_id: p.produto_estoque_id,
        nome: p.nome,
        preco_unitario: p.preco_unitario,
        quantidade: Math.floor(p.quantidade),
      })),
    )
    if (insP) {
      return {
        ok: false,
        message: toUserFriendlyErrorMessage(insP, { fallback: 'Erro ao salvar produtos na comanda.' }),
      }
    }
  }

  return { ok: true }
}

/** Devolve quantidade ao estoque e remove linhas de produto (comanda cancelada). */
export async function restaurarEstoqueELimparProdutosComanda(
  supabase: SupabaseClient,
  comandaId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: oldProdutos, error: errOld } = await supabase
    .from('comanda_produtos')
    .select('produto_estoque_id, quantidade')
    .eq('comanda_id', comandaId)

  if (errOld) {
    return { ok: false, message: 'Não foi possível ler produtos da comanda.' }
  }

  for (const row of oldProdutos ?? []) {
    const q = Math.floor(num(row.quantidade))
    if (q <= 0) continue
    const { data: prod, error: eFetch } = await supabase
      .from('estoque_produtos')
      .select('quantidade')
      .eq('id', row.produto_estoque_id)
      .single()
    if (eFetch || !prod) continue
    const atual = Math.floor(num(prod.quantidade))
    await supabase
      .from('estoque_produtos')
      .update({ quantidade: atual + q })
      .eq('id', row.produto_estoque_id)
  }

  await supabase.from('comanda_produtos').delete().eq('comanda_id', comandaId)
  await supabase.from('comanda_servicos').delete().eq('comanda_id', comandaId)

  return { ok: true }
}
