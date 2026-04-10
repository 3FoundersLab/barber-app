import { cn } from '@/lib/utils'

/**
 * Coluna de conteúdo (header + body) dentro de `[data-app-shell]`.
 * Em `md+`, o recuo esquerdo vem de `--shell-sidebar-inset` (definido por `DesktopSidebar`).
 */
export const appShellMainClass = cn(
  'app-shell-main relative z-10 flex min-h-0 min-w-0 flex-1 flex-col w-full',
)
