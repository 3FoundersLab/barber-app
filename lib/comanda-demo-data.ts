import { ESTOQUE_PRODUTOS_MOCK } from '@/lib/estoque-produto-mock'
import type { Comanda } from '@/types/comanda'
import type { Servico } from '@/types'

export const COMANDA_DEMO_ID_ABERTA = 'demo-comanda-aberta'
export const COMANDA_DEMO_ID_FECHADA = 'demo-comanda-fechada'

const DEMO_SVC_CORTE = 'demo-svc-corte'
const DEMO_SVC_BARBA = 'demo-svc-barba'
const DEMO_SVC_COMBO = 'demo-svc-combo'

/** Catálogo fictício para o editor da comanda (modo demonstração). */
export function getDemoServicosCatalogo(barbeariaId: string): Servico[] {
  const now = new Date().toISOString()
  return [
    {
      id: DEMO_SVC_CORTE,
      barbearia_id: barbeariaId,
      nome: 'Corte masculino',
      descricao: 'Demonstração',
      preco: 45,
      duracao: 40,
      ativo: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: DEMO_SVC_BARBA,
      barbearia_id: barbeariaId,
      nome: 'Barba completa',
      descricao: 'Demonstração',
      preco: 35,
      duracao: 30,
      ativo: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: DEMO_SVC_COMBO,
      barbearia_id: barbeariaId,
      nome: 'Corte + barba',
      descricao: 'Demonstração',
      preco: 70,
      duracao: 60,
      ativo: true,
      created_at: now,
      updated_at: now,
    },
  ]
}

function localDayAtHours(dateYmd: string, h: number, min: number): string {
  const [y, m, d] = dateYmd.split('-').map(Number)
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, h, min, 0, 0)
  return dt.toISOString()
}

/** Comanda aberta rica para explorar serviços, produtos, desconto e taxa. */
export function buildDemoComandaAberta(barbeariaId: string, referenciaData: string): Comanda {
  const now = new Date().toISOString()
  return {
    id: COMANDA_DEMO_ID_ABERTA,
    barbearia_id: barbeariaId,
    agendamento_id: 'demo-ag-1',
    numero: 901,
    barbeiro_id: 'demo-barbeiro',
    cliente_id: 'demo-cliente-1',
    referencia_data: referenciaData,
    mesa: 'Cadeira 2',
    status: 'aberta',
    horario_inicio: localDayAtHours(referenciaData, 14, 30),
    desconto_modo: 'percentual',
    desconto_valor: 10,
    taxa_servico_aplicar: true,
    taxa_servico_percentual: 10,
    forma_pagamento: null,
    created_at: now,
    updated_at: now,
    cliente: { nome: 'Ricardo Almeida (demo)' },
    barbeiro: { nome: 'Gabriel — demonstração' },
    agendamento: {
      data: referenciaData,
      horario: '14:30:00',
      servico_id: DEMO_SVC_COMBO,
      valor: 70,
      servico: { nome: 'Corte + barba' },
    },
  }
}

/** Comanda já fechada (somente leitura no editor). */
export function buildDemoComandaFechada(barbeariaId: string, referenciaData: string): Comanda {
  const now = new Date().toISOString()
  return {
    id: COMANDA_DEMO_ID_FECHADA,
    barbearia_id: barbeariaId,
    agendamento_id: 'demo-ag-2',
    numero: 902,
    barbeiro_id: 'demo-barbeiro-2',
    cliente_id: 'demo-cliente-2',
    referencia_data: referenciaData,
    mesa: null,
    status: 'fechada',
    horario_inicio: localDayAtHours(referenciaData, 10, 0),
    desconto_modo: 'nenhum',
    desconto_valor: 0,
    taxa_servico_aplicar: false,
    taxa_servico_percentual: 10,
    forma_pagamento: 'pix',
    created_at: now,
    updated_at: now,
    cliente: { nome: 'Fernando Costa (demo)' },
    barbeiro: { nome: 'Pedro — demonstração' },
    agendamento: {
      data: referenciaData,
      horario: '10:00:00',
      servico_id: DEMO_SVC_CORTE,
      valor: 45,
      servico: { nome: 'Corte masculino' },
    },
  }
}

export function getDemoComandasParaLista(barbeariaId: string, referenciaData: string): Comanda[] {
  return [buildDemoComandaAberta(barbeariaId, referenciaData), buildDemoComandaFechada(barbeariaId, referenciaData)]
}

/** Estoque exibido no editor em modo demo (mesmos itens do mock de estoque). */
export function getDemoEstoqueParaComanda() {
  return ESTOQUE_PRODUTOS_MOCK
}

/** Linhas iniciais de serviço (qty) no editor — comanda aberta demo. */
export function getDemoServicoQtyInicial(): Record<string, number> {
  return {
    [DEMO_SVC_CORTE]: 0,
    [DEMO_SVC_BARBA]: 0,
    [DEMO_SVC_COMBO]: 1,
  }
}

/** Produtos já na comanda aberta demo + committed para teto de estoque. */
export function getDemoProdutoLinhasIniciais(): {
  linhas: Array<{ produtoEstoqueId: string; nome: string; precoUnitario: number; quantidade: number }>
  committed: Record<string, number>
} {
  const pomada = ESTOQUE_PRODUTOS_MOCK.find((p) => p.id === 'demo-1')
  const oleo = ESTOQUE_PRODUTOS_MOCK.find((p) => p.id === 'demo-3')
  const linhas: Array<{ produtoEstoqueId: string; nome: string; precoUnitario: number; quantidade: number }> = []
  const committed: Record<string, number> = {}
  if (pomada) {
    linhas.push({
      produtoEstoqueId: pomada.id,
      nome: pomada.nome,
      precoUnitario: pomada.precoVenda,
      quantidade: 1,
    })
    committed[pomada.id] = 1
  }
  if (oleo) {
    linhas.push({
      produtoEstoqueId: oleo.id,
      nome: oleo.nome,
      precoUnitario: oleo.precoVenda,
      quantidade: 2,
    })
    committed[oleo.id] = 2
  }
  return { linhas, committed }
}

/** Estado inicial do editor para comanda fechada demo (só visualização). */
export function getDemoEditorStateFechada(barbeariaId: string): {
  servicoQty: Record<string, number>
  produtoLinhas: Array<{ produtoEstoqueId: string; nome: string; precoUnitario: number; quantidade: number }>
  committed: Record<string, number>
} {
  const servicos = getDemoServicosCatalogo(barbeariaId)
  const servicoQty: Record<string, number> = {}
  for (const s of servicos) servicoQty[s.id] = 0
  servicoQty[DEMO_SVC_CORTE] = 1
  return {
    servicoQty,
    produtoLinhas: [],
    committed: {},
  }
}
