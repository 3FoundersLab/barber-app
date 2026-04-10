/**
 * Pós-login no painel tenant (múltiplas unidades):
 * - `gate_ok`: o usuário já passou pela seleção nesta aba — não reexibe o modal ao navegar.
 * - `sessao_unidade_slug`: última unidade escolhida (referência opcional).
 *
 * `clearTenantUnidadeSessionStorage()` no logout e após login bem-sucedido.
 */
export const TENANT_UNIDADE_SESSION_STORAGE_KEY = 'barber_app_sessao_unidade_slug'

/** Indica que o fluxo de unidade desta sessão já foi concluído (evita modal ao trocar de rota). */
export const TENANT_UNIDADE_GATE_COMPLETED_KEY = 'barber_app_unidade_gate_ok'

export function getSessionConfirmedTenantSlug(): string | null {
  if (typeof window === 'undefined') return null
  const v = sessionStorage.getItem(TENANT_UNIDADE_SESSION_STORAGE_KEY)?.trim()
  return v && v.length > 0 ? v : null
}

export function setSessionConfirmedTenantSlug(slug: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(TENANT_UNIDADE_SESSION_STORAGE_KEY, slug.trim())
}

export function hasTenantUnidadeGateCompleted(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(TENANT_UNIDADE_GATE_COMPLETED_KEY) === '1'
}

export function markTenantUnidadeGateCompleted(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(TENANT_UNIDADE_GATE_COMPLETED_KEY, '1')
}

export function clearTenantUnidadeSessionStorage(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(TENANT_UNIDADE_SESSION_STORAGE_KEY)
  sessionStorage.removeItem(TENANT_UNIDADE_GATE_COMPLETED_KEY)
}

/** @deprecated Prefira `clearTenantUnidadeSessionStorage`. */
export function clearSessionConfirmedTenantSlug(): void {
  clearTenantUnidadeSessionStorage()
}
