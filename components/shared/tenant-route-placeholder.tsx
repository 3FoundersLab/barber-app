'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'

export interface TenantRoutePlaceholderAction {
  label: string
  href: string
  variant?: 'default' | 'outline'
}

interface TenantRoutePlaceholderProps {
  /** Título no header da página e no cartão, se `cardTitle` não for passado. */
  title: string
  /** Título principal do cartão (opcional). */
  cardTitle?: string
  description: string
  icon: LucideIcon
  actions: TenantRoutePlaceholderAction[]
}

export function TenantRoutePlaceholder({
  title,
  cardTitle,
  description,
  icon: Icon,
  actions,
}: TenantRoutePlaceholderProps) {
  const { base } = useTenantAdminBase()

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader title={title} profileHref={`${base}/configuracoes`} avatarFallback="A" />

      <PageContent className="space-y-4 md:space-y-6">
        <Card className="mx-auto w-full max-w-lg border-dashed md:max-w-xl lg:max-w-2xl">
          <CardHeader className="space-y-3 pb-2 text-center sm:text-left">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary sm:mx-0">
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <CardTitle className="text-lg md:text-xl">{cardTitle ?? title}</CardTitle>
            <CardDescription className="text-pretty text-sm leading-relaxed md:text-base">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
            {actions.map((a) => (
              <Button
                key={`${a.label}-${a.href}`}
                variant={a.variant ?? 'default'}
                asChild
                className="w-full sm:w-auto"
              >
                <Link href={a.href}>{a.label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </PageContent>
    </TenantPanelPageContainer>
  )
}
