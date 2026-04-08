import type { UserRole } from '@/types'

/** Painel da plataforma (apenas super_admin na URL). */
export const PLATFORM_PATHS = {
  dashboard: '/dashboard',
  barbearias: '/barbearias',
  usuarios: '/usuarios',
  planos: '/planos',
  financeiro: '/financeiro',
  assinaturas: '/assinaturas',
  conta: '/conta',
  contaEditar: '/conta/editar',
} as const

/** Entrada quando o admin ainda não tem slug na URL (`/painel` redireciona). */
export const TENANT_ENTRY = '/painel'

/** Segundo segmento em `/[slug]/...` da área admin da barbearia. */
const TENANT_BARBEARIA_SEGMENTS = new Set([
  'dashboard',
  'configuracoes',
  'agendamentos',
  'equipe',
  'financeiro',
  'servicos',
  'clientes',
  'perfil',
])

/**
 * Primeiro segmento que não pode ser interpretado como slug de barbearia quando o path
 * tem formato de tenant (evita confundir com `/profissional/perfil`, `/cadastro/...`, etc.).
 */
const RESERVED_TENANT_FIRST_SEGMENTS = new Set(['api', '_next', 'cadastro', 'profissional'])

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
  PLATFORM_PATHS.financeiro,
  PLATFORM_PATHS.assinaturas,
  PLATFORM_PATHS.conta,
]

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function isCadastroPublicPath(pathname: string): boolean {
  return pathname === '/cadastro/barbearia' || pathname.startsWith('/cadastro/barbearia/')
}

/**
 * URLs do painel admin por barbearia: `/{slug}/dashboard`, `/{slug}/configuracoes`, etc.
 * (sem prefixo `/b`; redirecionamento legado em `legacyPathRedirect`.)
 */
export function isTenantBarbeariaScopedPath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length < 2) return false
  if (RESERVED_TENANT_FIRST_SEGMENTS.has(parts[0])) return false
  return TENANT_BARBEARIA_SEGMENTS.has(parts[1])
}

export function parseTenantBarbeariaSlugFromPath(pathname: string): string | null {
  if (!isTenantBarbeariaScopedPath(pathname)) return null
  const parts = pathname.split('/').filter(Boolean)
  return parts[0] ?? null
}

export function tenantBarbeariaBasePath(slug: string): string {
  return `/${encodeURIComponent(slug)}`
}

export function tenantBarbeariaDashboardPath(slug: string): string {
  return `/${encodeURIComponent(slug)}/dashboard`
}

/** Rotas que exigem autenticação + verificação de papel no middleware. */
export function isRoleGuardedPath(pathname: string): boolean {
  if (matchesPrefix(pathname, '/api')) return false
  if (pathname.startsWith('/cadastro') && !isCadastroPublicPath(pathname)) return true
  if (pathname === TENANT_ENTRY || matchesPrefix(pathname, `${TENANT_ENTRY}/`)) return true
  if (isTenantBarbeariaScopedPath(pathname)) return true
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
  if (pathname.startsWith('/cadastro') && !isCadastroPublicPath(pathname)) {
    return false
  }
  if (isTenantBarbeariaScopedPath(pathname) || pathname === TENANT_ENTRY) {
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
 * Redireciona URLs antigas com segmento de papel (/super, /admin, /barbeiro, /cliente)
 * e o prefixo legado `/b/` das rotas tenant.
 * Retorna pathname de destino ou null.
 */
export function legacyPathRedirect(pathname: string): string | null {
  if (pathname.startsWith('/b/') || pathname === '/b') {
    const rest = pathname.slice('/b'.length)
    if (rest === '' || rest === '/') return TENANT_ENTRY
    return rest.startsWith('/') ? rest : `/${rest}`
  }

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
    const rest = pathname.slice('/admin'.length)
    return rest.startsWith('/') ? rest : `/${rest}`
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
