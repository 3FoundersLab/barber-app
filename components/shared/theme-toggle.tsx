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
  /** `landing`: botão circular alinhado à navbar da landing. */
  variant?: 'default' | 'landing'
}

export function ThemeToggle({ inline = false, className, variant = 'default' }: ThemeToggleProps) {
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
            className={cn(
              'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
              variant === 'landing'
                ? cn(
                    'h-10 w-10 shrink-0 rounded-full border-2 border-zinc-900 bg-white text-zinc-900 shadow-sm',
                    'hover:border-primary hover:text-primary hover:shadow-md',
                    'dark:border-zinc-100 dark:bg-zinc-950 dark:text-white dark:hover:border-primary dark:hover:text-primary',
                  )
                : 'h-9 w-9 shadow-sm hover:bg-muted hover:text-foreground dark:hover:bg-muted/70',
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">Alterar tema</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[10rem] border-zinc-200/90 bg-popover/95 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95"
        >
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
