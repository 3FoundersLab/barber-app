'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { clearProfileCache } from '@/lib/profile-cache'
import { signOutWithPersistenceClear } from '@/lib/supabase/sign-out-client'
import { cn } from '@/lib/utils'

type SuperLogoutButtonProps = {
  variant?: 'nav' | 'button'
  className?: string
  /** Ícone centralizado (sidebar recolhido) */
  compact?: boolean
}

export function SuperLogoutButton({ variant = 'button', className, compact }: SuperLogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    clearProfileCache()
    await signOutWithPersistenceClear(supabase)
    router.push('/login')
  }

  if (variant === 'nav') {
    return (
      <button
        type="button"
        onClick={handleLogout}
        title={compact ? 'Sair' : undefined}
        aria-label={compact ? 'Sair' : undefined}
        className={cn(
          'flex w-full items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          compact ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
          className
        )}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {compact ? <span className="sr-only">Sair</span> : 'Sair'}
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
