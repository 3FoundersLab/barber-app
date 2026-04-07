import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminDashboardPathForUser } from '@/lib/admin-browse-path'
import { fetchSessionProfile } from '@/lib/supabase/fetch-session-profile'
import { CLIENT_PATHS, PLATFORM_PATHS, STAFF_PATHS, TENANT_ENTRY } from '@/lib/routes'
import { LandingMarketing } from '@/components/landing/landing-marketing'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <LandingMarketing />
  }

  const profile = await fetchSessionProfile(supabase, user.id)
  if (profile?.ativo === false) {
    redirect('/login?reason=inactive')
  }

  const role = profile?.role

  if (role === 'super_admin') {
    redirect(PLATFORM_PATHS.dashboard)
  }
  if (role === 'admin') {
    const adminPath = await getAdminDashboardPathForUser(supabase, user.id)
    // Evita loop entre `/` e `/painel` caso o vínculo com a barbearia não exista.
    redirect(adminPath ?? '/cadastro/barbearia')
  }
  if (role === 'barbeiro') {
    redirect(STAFF_PATHS.agenda)
  }
  redirect(CLIENT_PATHS.inicio)
}
