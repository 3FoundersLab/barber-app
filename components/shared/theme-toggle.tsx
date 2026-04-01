'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const themeMenuItemHighlight =
  'focus:bg-muted focus:text-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground'

interface ThemeToggleProps {
  inline?: boolean
  className?: string
}

export function ThemeToggle({ inline = false, className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const Icon = !mounted
    ? Monitor
    : theme === 'system'
    ? Monitor
    : resolvedTheme === 'dark'
    ? Moon
    : Sun

  return (
    <div
      className={cn(
        inline ? 'flex items-center' : 'fixed right-16 top-4 z-50',
        className
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shadow-sm hover:bg-muted hover:text-foreground dark:hover:bg-muted/70"
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">Alterar tema</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme('light')} className={themeMenuItemHighlight}>
            <Sun className="mr-2 h-4 w-4" />
            Claro
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')} className={themeMenuItemHighlight}>
            <Moon className="mr-2 h-4 w-4" />
            Escuro
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')} className={themeMenuItemHighlight}>
            <Monitor className="mr-2 h-4 w-4" />
            Sistema
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
