'use client'

import { useParams } from 'next/navigation'
import { tenantBarbeariaBasePath } from '@/lib/routes'

/** Base path e slug do painel admin da barbearia (`/[slug]/...`). */
export function useTenantAdminBase() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const base = slug ? tenantBarbeariaBasePath(slug) : '/painel'
  return { slug, base }
}
