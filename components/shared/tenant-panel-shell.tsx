'use client'

import type { ComponentProps } from 'react'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { PageContainer, type PageContainerProps } from '@/components/shared/page-container'
import { superPageContainerClass, superPremiumAppHeaderClass } from '@/components/super/super-ui'
import { cn } from '@/lib/utils'

/** Contêiner de página alinhado ao visual do painel Super Admin (fundo transparente sobre o backdrop). */
export function TenantPanelPageContainer({ className, hasBottomNav, ...props }: PageContainerProps) {
  return (
    <PageContainer
      {...props}
      className={cn(superPageContainerClass, className)}
      hasBottomNav={hasBottomNav ?? true}
    />
  )
}

type TenantPanelPageHeaderProps = ComponentProps<typeof AppPageHeader>

/** Cabeçalho do painel tenant com o mesmo acabamento premium do Super Admin. */
export function TenantPanelPageHeader(props: TenantPanelPageHeaderProps) {
  return (
    <AppPageHeader
      {...props}
      className={cn(superPremiumAppHeaderClass, props.className)}
    />
  )
}
