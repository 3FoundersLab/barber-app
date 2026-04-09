import { cn } from '@/lib/utils'

export { superPremiumAppHeaderClass } from '@/components/super/super-premium-backdrop'

/** Conteúdo principal do Super: transparente sobre o backdrop do layout. */
export const superPageContainerClass = cn(
  'relative z-10 flex min-h-screen flex-1 flex-col bg-transparent text-foreground',
)

/** Faixa superior da sidebar Super (alinhada ao header das páginas). */
export const superShellHeaderBarClass = cn(
  'h-16 shrink-0 border-b px-4 md:px-6',
  'border-zinc-200/90 bg-white/90 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.04)]',
  'dark:border-zinc-800/70 dark:bg-zinc-950/90 dark:shadow-none',
)
