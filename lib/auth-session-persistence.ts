import { serialize, type SerializeOptions } from 'cookie'

/** Duração da sessão “longa” (Manter conectado), em segundos — 30 dias */
export const AUTH_LONG_SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60

/**
 * Cookie legível (não httpOnly) só para indicar preferência de duração.
 * Não contém tokens nem senha; o servidor usa para alinhar maxAge ao renovar sessão.
 */
export const AUTH_PERSIST_INDICATOR_COOKIE = 'bt-auth-persist'

const STORAGE_REMEMBER = 'barbertool-auth-remember'
const STORAGE_SESSION_ONLY = 'barbertool-auth-session-only'
const STORAGE_PENDING = 'barbertool-auth-pending-persist'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function secureCookieAttr(): { secure?: boolean } {
  if (!isBrowser()) return {}
  return window.location.protocol === 'https:' ? { secure: true } : {}
}

/**
 * Chamar imediatamente antes de `signInWithPassword`, para que o primeiro `setAll`
 * já grave cookies com a duração correta.
 */
export function prepareAuthPersistenceForLogin(keepSignedIn: boolean): void {
  if (!isBrowser()) return
  try {
    if (keepSignedIn) {
      sessionStorage.setItem(STORAGE_PENDING, '1')
      sessionStorage.removeItem(STORAGE_SESSION_ONLY)
    } else {
      sessionStorage.setItem(STORAGE_PENDING, '0')
      sessionStorage.setItem(STORAGE_SESSION_ONLY, '1')
    }
  } catch {
    // storage indisponível (modo privado etc.): fluxo de login segue com padrão seguro
  }
}

/**
 * Chamar após login bem-sucedido, antes do redirect.
 */
export function finalizeAuthPersistenceAfterLogin(keepSignedIn: boolean): void {
  if (!isBrowser()) return
  try {
    sessionStorage.removeItem(STORAGE_PENDING)
    if (keepSignedIn) {
      localStorage.setItem(STORAGE_REMEMBER, '1')
      sessionStorage.removeItem(STORAGE_SESSION_ONLY)
      document.cookie = serialize(AUTH_PERSIST_INDICATOR_COOKIE, '1', {
        path: '/',
        sameSite: 'lax',
        maxAge: AUTH_LONG_SESSION_MAX_AGE_SEC,
        ...secureCookieAttr(),
      })
    } else {
      localStorage.removeItem(STORAGE_REMEMBER)
      sessionStorage.setItem(STORAGE_SESSION_ONLY, '1')
      document.cookie = serialize(AUTH_PERSIST_INDICATOR_COOKIE, '0', {
        path: '/',
        sameSite: 'lax',
        ...secureCookieAttr(),
      })
    }
  } catch {
    // ignora falhas de storage / cookie
  }
}

/** Remove flags de “pré-login” após erro de autenticação */
export function resetPendingAuthPersistence(): void {
  if (!isBrowser()) return
  try {
    sessionStorage.removeItem(STORAGE_PENDING)
  } catch {
    // ignore
  }
}

/**
 * Limpa preferências locais e o cookie indicador. Chamar antes de `signOut`.
 */
export function clearAuthPersistenceMeta(): void {
  if (!isBrowser()) return
  try {
    localStorage.removeItem(STORAGE_REMEMBER)
    sessionStorage.removeItem(STORAGE_SESSION_ONLY)
    sessionStorage.removeItem(STORAGE_PENDING)
    document.cookie = serialize(AUTH_PERSIST_INDICATOR_COOKIE, '', {
      path: '/',
      sameSite: 'lax',
      maxAge: 0,
      ...secureCookieAttr(),
    })
  } catch {
    // ignore
  }
}

/**
 * No browser: decide se os cookies de sessão Supabase devem usar maxAge longo.
 * Sessão “não persistente” = cookie de sessão (sem maxAge), expira ao fechar o navegador.
 */
export function getShouldUseLongLivedAuthCookies(): boolean {
  if (!isBrowser()) return true
  try {
    if (sessionStorage.getItem(STORAGE_SESSION_ONLY) === '1') return false
    const pending = sessionStorage.getItem(STORAGE_PENDING)
    if (pending === '0') return false
    if (pending === '1') return true
    return localStorage.getItem(STORAGE_REMEMBER) === '1'
  } catch {
    return true
  }
}

/** Request (middleware): mesma semântica do cookie indicador; ausência = legado (tratar como longa). */
export function getPersistLongFromRequestCookie(persistCookieValue: string | undefined): boolean {
  if (persistCookieValue === '0') return false
  return true
}

export function applyAuthPersistenceToSetCookieOptions(
  options: SerializeOptions,
  persistLong: boolean,
  isClearing: boolean,
): SerializeOptions {
  if (isClearing || options.maxAge === 0) {
    return { ...options, maxAge: 0 }
  }
  if (persistLong) {
    const { expires: _e, ...rest } = options
    return { ...rest, maxAge: AUTH_LONG_SESSION_MAX_AGE_SEC }
  }
  const { maxAge: _m, expires: _ex, ...rest } = options
  return { ...rest }
}
