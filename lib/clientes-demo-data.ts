import type { Cliente } from '@/types'

/** Alinhado a `scripts/004_seed_demo_data.sql` + `scripts/053_seed_clientes_demo_origem_nascimento.sql`. */
const DEMO_TS = '2020-01-01T12:00:00.000Z'

const ORIGEM_NASC: Array<{ origem_canal: string; data_nascimento: string }> = [
  { origem_canal: 'instagram', data_nascimento: '1990-05-14' },
  { origem_canal: 'indicacao', data_nascimento: '1988-11-22' },
  { origem_canal: 'walk_in', data_nascimento: '1995-02-03' },
  { origem_canal: 'google', data_nascimento: '1992-08-30' },
  { origem_canal: 'instagram', data_nascimento: '1987-12-01' },
  { origem_canal: 'tiktok', data_nascimento: '1999-04-18' },
  { origem_canal: 'facebook', data_nascimento: '1991-07-25' },
  { origem_canal: 'instagram', data_nascimento: '1994-01-09' },
  { origem_canal: 'walk_in', data_nascimento: '1989-09-16' },
  { origem_canal: 'google', data_nascimento: '1996-06-11' },
  { origem_canal: 'indicacao', data_nascimento: '1993-03-27' },
  { origem_canal: 'walk_in', data_nascimento: '2000-10-05' },
  { origem_canal: 'instagram', data_nascimento: '1986-04-20' },
  { origem_canal: 'google', data_nascimento: '1998-12-12' },
  { origem_canal: 'indicacao', data_nascimento: '1997-05-08' },
]

const NOTAS_DEMO = 'Dado de demonstração; não representa pessoa real.'
const TELEFONE_TESTE_WHATSAPP = '5511 986185400'

/**
 * Lista fixa de clientes fictícios para o painel (toggle “Dados fictícios”).
 * Os IDs coincidem com o seed SQL da barbearia demo; em outras unidades serve só para UI.
 */
export function getClientesDemoForBarbearia(barbeariaId: string): Cliente[] {
  return ORIGEM_NASC.map((extra, i) => {
    const n = i + 1
    const idSuffix = 333333333330 + n
    const label = String(n).padStart(2, '0')
    return {
      id: `33333333-3333-3333-3333-${idSuffix}`,
      barbearia_id: barbeariaId,
      nome: `Cliente fictício ${label}`,
      telefone: TELEFONE_TESTE_WHATSAPP,
      email: `cliente-ficticio-${label}@example.com`,
      notas: NOTAS_DEMO,
      origem_canal: extra.origem_canal,
      data_nascimento: extra.data_nascimento,
      created_at: DEMO_TS,
      updated_at: DEMO_TS,
    }
  })
}
