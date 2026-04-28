'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TenantHeaderNotifications } from '@/components/tenant/tenant-header-notifications'
import { createClient } from '@/lib/supabase/client'
import { clearProfileCache } from '@/lib/profile-cache'
import { signOutWithPersistenceClear } from '@/lib/supabase/sign-out-client'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/shared/theme-toggle'

interface UserHeaderMenuProps {
  avatarSrc?: string | null
  fallback: string
  profileHref: string
}

export function UserHeaderMenu({ avatarSrc, fallback, profileHref }: UserHeaderMenuProps) {
  const params = useParams()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const slug = typeof params.slug === 'string' ? params.slug : null

  const handleLogout = async () => {
    const supabase = createClient()
    clearProfileCache()
    await signOutWithPersistenceClear(supabase)
    router.push('/login')
  }

  return (
    <div className="flex items-center gap-4">
      <ThemeToggle inline />
      {slug ? <TenantHeaderNotifications /> : null}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md p-1 transition-none hover:bg-muted/70 cursor-pointer"
            aria-label="Abrir menu do usuário"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarSrc || undefined} />
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground',
              )}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem
            asChild
            className="cursor-pointer focus:bg-muted focus:text-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
          >
            <Link href={profileHref}>Meu Perfil</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer focus:bg-muted focus:text-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
          >
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
