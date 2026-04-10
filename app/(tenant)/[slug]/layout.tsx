'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { BottomTabs, flattenNavEntries } from '@/components/shared/bottom-tabs'
import { AdminDrawer } from '@/components/shared/admin-drawer'
import { DesktopSidebar } from '@/components/shared/desktop-sidebar'
import { AppPageHeadingProvider } from '@/components/shared/app-page-heading-context'
import { SuperLogoutButton } from '@/components/shared/super-logout-button'
import { appShellMainClass } from '@/components/shared/app-shell-classes'
import { SuperPremiumBackdrop } from '@/components/super/super-premium-backdrop'
import { createClient } from '@/lib/supabase/client'
import { rpcUserIsMemberOfBarbearia } from '@/lib/barbearia-rpc'
import { tenantAdminNavEntriesFull, tenantAdminNavEntriesLimited } from '@/lib/tenant-admin-nav'
import { tenantBarbeariaBasePath, tenantBarbeariaDashboardPath } from '@/lib/routes'

export default function AdminSlugLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const base = slug ? tenantBarbeariaBasePath(slug) : '/painel'

  const [pagamentoPendenteAdmin, setPagamentoPendenteAdmin] = useState(false)

  useEffect(() => {
    if (!slug) return

    let cancelled = false

    async function check() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        setPagamentoPendenteAdmin(false)
        return
      }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      if (cancelled) return
      if (profile?.role !== 'admin') {
        setPagamentoPendenteAdmin(false)
        return
      }

      const { data: barbearia, error: barErr } = await supabase
        .from('barbearias')
        .select('id, status_cadastro')
        .eq('slug', slug)
        .maybeSingle()

      if (cancelled) return
      if (barErr || !barbearia || barbearia.status_cadastro !== 'pagamento_pendente') {
        setPagamentoPendenteAdmin(false)
        return
      }

      const isMember = await rpcUserIsMemberOfBarbearia(supabase, barbearia.id)

      if (!cancelled) {
        setPagamentoPendenteAdmin(isMember)
      }
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [slug, pathname])

  useEffect(() => {
    if (!slug || !pagamentoPendenteAdmin) return
    const prefix = tenantBarbeariaBasePath(slug)
    const ok =
      pathname === `${prefix}/dashboard` ||
      pathname === `${prefix}/assinatura` ||
      pathname === `${prefix}/configuracoes` ||
      pathname.startsWith(`${prefix}/configuracoes/`)
    if (!ok) {
      router.replace(tenantBarbeariaDashboardPath(slug))
    }
  }, [slug, pathname, pagamentoPendenteAdmin, router])

  const adminNav = useMemo(() => {
    if (pagamentoPendenteAdmin) {
      return tenantAdminNavEntriesLimited(base)
    }
    return tenantAdminNavEntriesFull(base)
  }, [base, pagamentoPendenteAdmin])

  return (
    <>
      <div className="relative min-h-screen md:flex" data-app-shell data-tenant-admin-shell>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <SuperPremiumBackdrop />
        </div>
        <AdminDrawer basePath={base} limitedNav={pagamentoPendenteAdmin} />
        <DesktopSidebar
          appearance="super"
          appBrand={{ href: `${base}/dashboard`, collapsible: true }}
          tabs={adminNav}
          footer={({ collapsed }) =>
            collapsed ? (
              <SuperLogoutButton variant="nav" compact className="hover:bg-zinc-100/85 dark:hover:bg-white/[0.06]" />
            ) : (
              <SuperLogoutButton variant="nav" className="hover:bg-zinc-100/85 dark:hover:bg-white/[0.06]" />
            )
          }
        />
        <div className={appShellMainClass}>
          <AppPageHeadingProvider>{children}</AppPageHeadingProvider>
        </div>
      </div>
      <BottomTabs appearance="super" scrollable tabs={flattenNavEntries(adminNav)} />
    </>
  )
}
