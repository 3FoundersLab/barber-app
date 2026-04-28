'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { CONSENT_STORAGE_KEYS } from '@/lib/privacy-consent'

export function AnalyticsConsentGate() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(CONSENT_STORAGE_KEYS.analytics) === 'granted')
    } catch {
      setEnabled(false)
    }
  }, [])

  if (!enabled) return null
  return <Analytics />
}
