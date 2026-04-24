export const PRIVACY_POLICY_VERSION = '2026-04-24'

export const CONSENT_STORAGE_KEYS = {
  analytics: 'bt-consent-analytics-v1',
} as const

export type ConsentCategory = keyof typeof CONSENT_STORAGE_KEYS
