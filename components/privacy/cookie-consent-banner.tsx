'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CONSENT_STORAGE_KEYS, PRIVACY_POLICY_VERSION } from '@/lib/privacy-consent'

async function registerConsent(granted: boolean) {
  try {
    await fetch('/api/privacy/consent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        category: 'analytics',
        granted,
        policyVersion: PRIVACY_POLICY_VERSION,
      }),
    })
  } catch {
    // O registro remoto é complementar; a preferência local continua valendo.
  }
}

export function CookieConsentBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const hasValue = localStorage.getItem(CONSENT_STORAGE_KEYS.analytics) !== null
      setOpen(!hasValue)
    } catch {
      setOpen(true)
    }
  }, [])

  const saveChoice = async (granted: boolean) => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEYS.analytics, granted ? 'granted' : 'denied')
    } catch {
      // no-op
    }
    setOpen(false)
    await registerConsent(granted)
    window.location.reload()
  }

  if (!open) return null

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur">
      <p className="text-sm text-foreground">
        Usamos cookies estritamente necessários e, com sua permissão, cookies analíticos para melhorar a experiência.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Saiba mais em{' '}
        <Link href="/politica-de-privacidade" className="underline underline-offset-2">
          Política de Privacidade
        </Link>{' '}
        e{' '}
        <Link href="/termos-de-uso" className="underline underline-offset-2">
          Termos de Uso
        </Link>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="outline" onClick={() => void saveChoice(false)}>
          Recusar analíticos
        </Button>
        <Button type="button" onClick={() => void saveChoice(true)}>
          Aceitar analíticos
        </Button>
      </div>
    </div>
  )
}
