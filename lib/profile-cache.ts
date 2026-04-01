import type { Profile } from '@/types'

const KEY = 'barber_app_profile_cache_v1'

type Stored = {
  userId: string
  profile: Profile
}

export function getStoredProfileCache(): Stored | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Stored
    if (!parsed?.userId || !parsed?.profile?.id) return null
    return parsed
  } catch {
    return null
  }
}

export function setProfileCache(userId: string, profile: Profile): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ userId, profile }))
  } catch {
    /* storage full or disabled */
  }
}

export function clearProfileCache(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* */
  }
}
