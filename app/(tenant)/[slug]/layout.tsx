'use client'

import { useEffect, useMemo, useState } from 'react'
import { LayoutDashboard, Calendar, Scissors, Users, Settings, DollarSign } from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { BottomTabs, type TabItem } from '@/components/shared/bottom-tabs'
import { AdminDrawer } from '@/components/shared/admin-drawer'
import { DesktopSidebar } from '@/components/shared/desktop-sidebar'
import { AppPageHeadingProvider } from '@/components/shared/app-page-heading-context'
import { createClient } from '@/lib/supabase/client'
import { rpcUserIsMemberOfBarbearia } from '@/lib/barbearia-rpc'
import { tenantBarbeariaBasePath, tenantBarbeariaDashboardPath } from '@/lib/routes'

const FULL_ADMIN_TABS = (
  base: string,
): TabItem[] => [
  { label: 'Dashboard', href: `${base}/dashboard`, icon: LayoutDashboard },
  { label: 'Agenda', href: `${base}/agendamentos`, icon: Calendar },
  { label: 'Financeiro', href: `${base}/financeiro`, icon: DollarSign },
  { label: 'Serviços', href: `${base}/servicos`, icon: Scissors },
  { label: 'Equipe', href: `${base}/equipe`, icon: Users },
  { label: 'Config', href: `${base}/configuracoes`, icon: Settings },
]

/** Pagamento pendente: só dashboard + configurações (alinha com proxy.ts). */
const LIMITED_ADMIN_TABS = (base: string): TabItem[] => [
  { label: 'Dashboard', href: `${base}/dashboard`, icon: LayoutDashboard },
  { label: 'Config', href: `${base}/configuracoes`, icon: Settings },
]

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
      pathname === `${prefix}/configuracoes` ||
      pathname.startsWith(`${prefix}/configuracoes/`)
    if (!ok) {
      router.replace(tenantBarbeariaDashboardPath(slug))
    }
  }, [slug, pathname, pagamentoPendenteAdmin, router])

  const adminTabs = useMemo(() => {
    if (pagamentoPendenteAdmin) {
      return LIMITED_ADMIN_TABS(base)
    }
    return FULL_ADMIN_TABS(base)
  }, [base, pagamentoPendenteAdmin])

  return (
    <>
      <AdminDrawer basePath={base} limitedNav={pagamentoPendenteAdmin} />
      <div className="md:flex md:min-h-screen md:bg-muted/20">
        <DesktopSidebar title="Painel Admin" tabs={adminTabs} />
        <div className="hidden md:block md:w-64 md:shrink-0" />
        <div className="min-w-0 flex-1">
          <AppPageHeadingProvider>{children}</AppPageHeadingProvider>
        </div>
      </div>
      <BottomTabs tabs={adminTabs} />
    </>
  )
}
