/**
 * Largura efetiva da `DesktopSidebar` em rem (Tailwind: md:w-64, lg:w-72, colapsada md:w-[4.5rem]).
 * Usada para `--shell-sidebar-inset` na coluna principal (header + body alinhados).
 */
export function shellSidebarInsetRem(collapsible: boolean, wide: boolean): string {
  if (typeof window === 'undefined') return ''
  if (!window.matchMedia('(min-width: 768px)').matches) return '0px'
  if (collapsible && !wide) return '4.5rem'
  if (window.matchMedia('(min-width: 1024px)').matches) return '18rem'
  return '16rem'
}
