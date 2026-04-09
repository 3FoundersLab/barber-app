import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import {
  AUTH_PERSIST_INDICATOR_COOKIE,
  applyAuthPersistenceToSetCookieOptions,
  getPersistLongFromRequestCookie,
} from '@/lib/auth-session-persistence'

export async function updateSessionWithUser(request: NextRequest): Promise<{
  response: NextResponse
  supabase: ReturnType<typeof createServerClient>
  user: User | null
}> {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const persistLong = getPersistLongFromRequestCookie(
    request.cookies.get(AUTH_PERSIST_INDICATOR_COOKIE)?.value,
  )

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            const clearing = !value
            const nextOpts = applyAuthPersistenceToSetCookieOptions(options, persistLong, clearing)
            supabaseResponse.cookies.set(name, value, nextOpts)
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response: supabaseResponse, supabase, user }
}

export async function updateSession(request: NextRequest) {
  const { response } = await updateSessionWithUser(request)
  return response
}
