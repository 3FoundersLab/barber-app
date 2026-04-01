'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { clearProfileCache } from '@/lib/profile-cache'
import { cn } from '@/lib/utils'

type SuperLogoutButtonProps = {
  variant?: 'nav' | 'button'
  className?: string
}

export function SuperLogoutButton({ variant = 'button', className }: SuperLogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    clearProfileCache()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (variant === 'nav') {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          className
        )}
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    )
  }

  return (
    <Button type="button" variant="outline" className={cn('w-full justify-start', className)} onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      Sair
    </Button>
  )
}
