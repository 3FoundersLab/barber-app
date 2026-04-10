/**
 * Confirmação explícita da unidade (barbearia) ativa por sessão do browser.
 * O painel admin do tenant só libera após o usuário confirmar a unidade nesta sessão.
 */
export const TENANT_UNIDADE_SESSION_STORAGE_KEY = 'barber_app_sessao_unidade_slug'

export function getSessionConfirmedTenantSlug(): string | null {
  if (typeof window === 'undefined') return null
  const v = sessionStorage.getItem(TENANT_UNIDADE_SESSION_STORAGE_KEY)?.trim()
  return v && v.length > 0 ? v : null
}

export function setSessionConfirmedTenantSlug(slug: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(TENANT_UNIDADE_SESSION_STORAGE_KEY, slug.trim())
}

export function clearSessionConfirmedTenantSlug(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(TENANT_UNIDADE_SESSION_STORAGE_KEY)
}
