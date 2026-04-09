import Link from 'next/link'
import { cn } from '@/lib/utils'

const markClass =
  'flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20'

export type AppBrandLogoProps = {
  variant?: 'full' | 'icon'
  href?: string
  className?: string
  textClassName?: string
  onClick?: () => void
}

export function AppBrandLogo({
  variant = 'full',
  href = '/',
  className,
  textClassName,
  onClick,
}: AppBrandLogoProps) {
  if (variant === 'icon') {
    return (
      <Link
        href={href}
        aria-label="BarberApp, ir para o início"
        onClick={onClick}
        className={cn(
          'flex justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
      >
        <span className={markClass}>B</span>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex min-w-0 items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring',
        textClassName ?? 'text-foreground',
        className
      )}
    >
      <span className={markClass}>B</span>
      <span className="truncate">BarberApp</span>
    </Link>
  )
}
