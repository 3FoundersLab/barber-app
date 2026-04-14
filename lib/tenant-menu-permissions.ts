import type { EquipeFuncao } from '@/types'
import {
  TENANT_ADMIN_MENU_BLUEPRINT,
  type TenantAdminMenuKey,
  type TenantAdminMenuSectionBlueprint,
} from '@/lib/tenant-admin-nav'

/** Menus do painel que podem ser concedidos a cargos customizados (exclui a própria tela de permissões). */
export const TENANT_MENU_KEYS_FOR_ROLE_MATRIX: TenantAdminMenuKey[] =
  TENANT_ADMIN_MENU_BLUEPRINT.flatMap((s) => s.items.map((i) => i.key)).filter(
    (k) => k !== 'permissoes',
  )

export type EquipeMenuPermissionsJson = Partial<
  Record<'moderador' | 'barbeiro_lider', Partial<Record<TenantAdminMenuKey, boolean>>>
>

/** Presets ao criar barbearia ou quando o JSON está vazio. */
export const DEFAULT_EQUIPE_MENU_ACCESS = {
  moderador: {
    dashboard: true,
    clientes: true,
    agendamentos: true,
    comandas: true,
    servicos: true,
    planos: false,
    financeiro: false,
    relatorios: false,
    estoque: true,
    assinatura: false,
    equipe: false,
    configuracoes: false,
    permissoes: false,
  },
  barbeiro_lider: {
    dashboard: true,
    clientes: true,
    agendamentos: true,
    comandas: true,
    servicos: true,
    planos: true,
    financeiro: true,
    relatorios: true,
    estoque: true,
    assinatura: false,
    equipe: true,
    configuracoes: false,
    permissoes: false,
  },
} satisfies Record<'moderador' | 'barbeiro_lider', Record<TenantAdminMenuKey, boolean>>

function fullAccess(): Record<TenantAdminMenuKey, boolean> {
  const o = {} as Record<TenantAdminMenuKey, boolean>
  for (const k of TENANT_ADMIN_MENU_BLUEPRINT.flatMap((s) => s.items.map((i) => i.key))) {
    o[k] = true
  }
  return o
}

export const ADMINISTRADOR_MENU_ACCESS_FULL = fullAccess()

export function mergeEquipeMenuPermissions(
  raw: EquipeMenuPermissionsJson | null | undefined,
): Record<'moderador' | 'barbeiro_lider', Record<TenantAdminMenuKey, boolean>> {
  const roles: ('moderador' | 'barbeiro_lider')[] = ['moderador', 'barbeiro_lider']
  const out: Record<'moderador' | 'barbeiro_lider', Record<TenantAdminMenuKey, boolean>> = {
    moderador: { ...DEFAULT_EQUIPE_MENU_ACCESS.moderador },
    barbeiro_lider: { ...DEFAULT_EQUIPE_MENU_ACCESS.barbeiro_lider },
  }
  if (!raw || typeof raw !== 'object') return out
  for (const r of roles) {
    const patch = raw[r]
    if (!patch || typeof patch !== 'object') continue
    for (const key of TENANT_ADMIN_MENU_BLUEPRINT.flatMap((s) => s.items.map((i) => i.key))) {
      if (key in patch && typeof patch[key] === 'boolean') {
        out[r][key] = patch[key]!
      }
    }
  }
  return out
}

export function sanitizeEquipeMenuPermissionsForSave(
  state: Record<'moderador' | 'barbeiro_lider', Record<TenantAdminMenuKey, boolean>>,
): EquipeMenuPermissionsJson {
  const keys = TENANT_MENU_KEYS_FOR_ROLE_MATRIX
  const pick = (r: Record<TenantAdminMenuKey, boolean>) => {
    const partial: Partial<Record<TenantAdminMenuKey, boolean>> = {}
    for (const k of keys) {
      partial[k] = r[k]
    }
    return partial
  }
  return {
    moderador: pick(state.moderador),
    barbeiro_lider: pick(state.barbeiro_lider),
  }
}

export function menuSectionsForMatrix(): TenantAdminMenuSectionBlueprint[] {
  const allow = new Set(TENANT_MENU_KEYS_FOR_ROLE_MATRIX)
  return TENANT_ADMIN_MENU_BLUEPRINT.map((section) => ({
    ...section,
    items: section.items.filter((i) => allow.has(i.key)),
  })).filter((s) => s.items.length > 0)
}

/** Uso futuro no shell: combina função na equipe com permissões salvas na barbearia. */
export function equipeFuncaoUsesTenantMenuMatrix(funcao: EquipeFuncao): funcao is
  | 'moderador'
  | 'barbeiro_lider' {
  return funcao === 'moderador' || funcao === 'barbeiro_lider'
}
