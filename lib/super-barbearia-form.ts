import type { BarbeariaEnderecoParts } from '@/lib/barbearia-endereco'
import { emptyBarbeariaEnderecoParts } from '@/lib/barbearia-endereco'

export type SuperBarbeariaFormState = {
  nome: string
  slug: string
  telefone: string
  email: string
  enderecoParts: BarbeariaEnderecoParts
  ativo: boolean
}

export function emptySuperBarbeariaForm(): SuperBarbeariaFormState {
  return {
    nome: '',
    slug: '',
    telefone: '',
    email: '',
    enderecoParts: emptyBarbeariaEnderecoParts(),
    ativo: true,
  }
}

export function slugifyBarbeariaSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
