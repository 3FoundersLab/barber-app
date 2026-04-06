import { NextResponse, type NextRequest } from 'next/server'
import { fetchSessionProfile } from '@/lib/supabase/fetch-session-profile'
import { updateSessionWithUser } from '@/lib/supabase/middleware'
import {
  isRoleGuardedPath,
  legacyPathRedirect,
  pathAllowedForRole,
  safeHomeForRole,
} from '@/lib/routes'

function forwardCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value, c)
  })
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const { response, supabase, user } = await updateSessionWithUser(request)

  const legacyTarget = legacyPathRedirect(pathname)
  if (legacyTarget !== null) {
    const url = request.nextUrl.clone()
    url.pathname = legacyTarget
    const redirectRes = NextResponse.redirect(url)
    forwardCookies(response, redirectRes)
    return redirectRes
  }

  if (pathname.startsWith('/api/') || !isRoleGuardedPath(pathname)) {
    return response
  }

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  const profile = await fetchSessionProfile(supabase, user.id)
  const role = profile?.role

  if (profile?.ativo === false) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('reason', 'inactive')
    return NextResponse.redirect(url)
  }

  if (!role) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!pathAllowedForRole(pathname, role)) {
    const url = request.nextUrl.clone()
    url.pathname = safeHomeForRole(role)
    url.searchParams.delete('next')
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
