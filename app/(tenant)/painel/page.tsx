import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminDashboardPathForUser } from '@/lib/admin-browse-path'

export default async function AdminIndexPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const path = await getAdminDashboardPathForUser(supabase, user.id)
  if (path) {
    redirect(path)
  }

  redirect('/')
}
