'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { cn } from '@/lib/utils'

export function LegalPageHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl',
        className,
      )}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link
          href="/"
          className="text-sm font-medium text-sky-600 transition-colors duration-300 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
        >
          ← Voltar ao início
        </Link>
        <ThemeToggle inline variant="landing" />
      </div>
    </header>
  )
}
