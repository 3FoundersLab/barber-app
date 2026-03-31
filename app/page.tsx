import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  // Redirect based on role
  if (profile?.role === 'super_admin') {
    redirect('/super/dashboard')
  } else if (profile?.role === 'admin') {
    redirect('/admin/dashboard')
  } else if (profile?.role === 'barbeiro') {
    redirect('/barbeiro/agenda')
  } else {
    redirect('/cliente/home')
  }
}
