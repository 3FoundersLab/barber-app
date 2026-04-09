import { createBrowserClient } from '@supabase/ssr'
import { parse, serialize, type SerializeOptions } from 'cookie'
import {
  applyAuthPersistenceToSetCookieOptions,
  getShouldUseLongLivedAuthCookies,
} from '@/lib/auth-session-persistence'

function browserCookieGetAll() {
  if (typeof document === 'undefined') return []
  const parsed = parse(document.cookie)
  return Object.keys(parsed).map((name) => ({
    name,
    value: parsed[name] ?? '',
  }))
}

function browserCookieSetAll(
  cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[],
  _headers: Record<string, string>,
) {
  if (typeof document === 'undefined') return
  const persistLong = getShouldUseLongLivedAuthCookies()
  cookiesToSet.forEach(({ name, value, options }) => {
    const clearing = value === '' || value === undefined
    const next = applyAuthPersistenceToSetCookieOptions(options as SerializeOptions, persistLong, clearing)
    document.cookie = serialize(name, clearing ? '' : value, next)
  })
}

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: browserCookieGetAll,
      setAll: browserCookieSetAll,
    },
  })
}
