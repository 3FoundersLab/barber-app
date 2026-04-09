import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  AUTH_PERSIST_INDICATOR_COOKIE,
  applyAuthPersistenceToSetCookieOptions,
  getPersistLongFromRequestCookie,
} from '@/lib/auth-session-persistence'

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const persistLong = getPersistLongFromRequestCookie(
    cookieStore.get(AUTH_PERSIST_INDICATOR_COOKIE)?.value,
  )

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const clearing = !value
              const nextOpts = applyAuthPersistenceToSetCookieOptions(options, persistLong, clearing)
              cookieStore.set(name, value, nextOpts)
            })
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    },
  )
}
