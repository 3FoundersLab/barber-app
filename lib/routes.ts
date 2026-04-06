import type { UserRole } from '@/types'

/** Painel da plataforma (apenas super_admin na URL). */
export const PLATFORM_PATHS = {
  dashboard: '/dashboard',
  barbearias: '/barbearias',
  usuarios: '/usuarios',
  planos: '/planos',
  assinaturas: '/assinaturas',
  conta: '/conta',
  contaEditar: '/conta/editar',
} as const

/** Área da barbearia: slug no path, sem expor papel "admin". */
export const TENANT_BASE = '/b'
export const TENANT_ENTRY = '/painel'

/** Área do profissional (barbeiro). */
export const STAFF_PATHS = {
  agenda: '/agenda',
  horarios: '/horarios',
  perfilEditar: '/profissional/perfil/editar',
} as const

/** Área do cliente. */
export const CLIENT_PATHS = {
  inicio: '/inicio',
  agendar: '/agendar',
  agendamentos: '/agendamentos',
  perfilEditar: '/perfil/editar',
} as const

export const ROLE_HOME: Record<UserRole, string> = {
  super_admin: PLATFORM_PATHS.dashboard,
  admin: TENANT_ENTRY,
  barbeiro: STAFF_PATHS.agenda,
  cliente: CLIENT_PATHS.inicio,
}

const PLATFORM_PREFIXES = [
  PLATFORM_PATHS.dashboard,
  PLATFORM_PATHS.barbearias,
  PLATFORM_PATHS.usuarios,
  PLATFORM_PATHS.planos,
  PLATFORM_PATHS.assinaturas,
  PLATFORM_PATHS.conta,
]

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/** Rotas que exigem autenticação + verificação de papel no middleware. */
export function isRoleGuardedPath(pathname: string): boolean {
  if (matchesPrefix(pathname, '/api')) return false
  if (pathname === TENANT_ENTRY || matchesPrefix(pathname, `${TENANT_ENTRY}/`)) return true
  if (matchesPrefix(pathname, `${TENANT_BASE}/`)) return true
  for (const p of PLATFORM_PREFIXES) {
    if (matchesPrefix(pathname, p)) return true
  }
  if (
    matchesPrefix(pathname, STAFF_PATHS.agenda) ||
    matchesPrefix(pathname, STAFF_PATHS.horarios) ||
    matchesPrefix(pathname, '/profissional')
  ) {
    return true
  }
  if (
    matchesPrefix(pathname, CLIENT_PATHS.inicio) ||
    matchesPrefix(pathname, CLIENT_PATHS.agendar) ||
    matchesPrefix(pathname, CLIENT_PATHS.agendamentos) ||
    matchesPrefix(pathname, '/perfil')
  ) {
    return true
  }
  return false
}

export function pathAllowedForRole(pathname: string, role: string): boolean {
  if (matchesPrefix(pathname, `${TENANT_BASE}/`) || pathname === TENANT_ENTRY) {
    return role === 'admin' || role === 'super_admin'
  }
  for (const p of PLATFORM_PREFIXES) {
    if (matchesPrefix(pathname, p)) {
      return role === 'super_admin'
    }
  }
  if (
    matchesPrefix(pathname, STAFF_PATHS.agenda) ||
    matchesPrefix(pathname, STAFF_PATHS.horarios) ||
    matchesPrefix(pathname, '/profissional')
  ) {
    return role === 'barbeiro'
  }
  if (
    matchesPrefix(pathname, CLIENT_PATHS.inicio) ||
    matchesPrefix(pathname, CLIENT_PATHS.agendar) ||
    matchesPrefix(pathname, CLIENT_PATHS.agendamentos) ||
    matchesPrefix(pathname, '/perfil')
  ) {
    return role === 'cliente'
  }
  return true
}

export function safeHomeForRole(role: string): string {
  if (role === 'super_admin') return PLATFORM_PATHS.dashboard
  if (role === 'admin' || role === 'super_admin') return TENANT_ENTRY
  if (role === 'barbeiro') return STAFF_PATHS.agenda
  if (role === 'cliente') return CLIENT_PATHS.inicio
  return '/login'
}

/**
 * Redireciona URLs antigas com segmento de papel (/super, /admin, /barbeiro, /cliente).
 * Retorna pathname de destino ou null.
 */
export function legacyPathRedirect(pathname: string): string | null {
  if (pathname === '/super/perfil' || pathname === '/super/perfil/') {
    return PLATFORM_PATHS.contaEditar
  }
  if (pathname.startsWith('/super/perfil/')) {
    return pathname.replace(/^\/super\/perfil/, PLATFORM_PATHS.conta)
  }
  if (pathname.startsWith('/super/')) {
    const rest = pathname.slice('/super'.length)
    if (rest === '' || rest === '/') return PLATFORM_PATHS.dashboard
    return rest.startsWith('/') ? rest : `/${rest}`
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    return TENANT_ENTRY
  }
  if (pathname.startsWith('/admin/')) {
    return `${TENANT_BASE}${pathname.slice('/admin'.length)}`
  }

  if (pathname.startsWith('/barbeiro/perfil')) {
    return pathname.replace(/^\/barbeiro\/perfil/, '/profissional/perfil')
  }
  if (pathname.startsWith('/barbeiro')) {
    const next = pathname.replace(/^\/barbeiro/, '')
    return next === '' ? STAFF_PATHS.agenda : next
  }

  if (pathname.startsWith('/cliente/')) {
    const rest = pathname.slice('/cliente'.length)
    if (rest.startsWith('/home')) {
      return `/inicio${rest.slice('/home'.length)}`
    }
    return rest.startsWith('/') ? rest : `/${rest}`
  }

  return null
}
