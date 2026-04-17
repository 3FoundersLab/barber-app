'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { EquipeMembroForm } from '@/components/domain/equipe-membro-form'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { PageContent, PageTitle } from '@/components/shared/page-container'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'

export default function TenantEquipeNovoMembroPage() {
  const { slug, base } = useTenantAdminBase()
  const tenantSlug = slug.trim()
  const equipeHref = `${base}/equipe`

  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      setError(null)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) {
          setError('Usuário não autenticado')
          setBarbeariaId(null)
          setIsLoading(false)
        }
        return
      }
      const id = await resolveAdminBarbeariaId(supabase, user.id, { slug })
      if (!cancelled) {
        if (!id) setError('Barbearia não encontrada para este usuário')
        setBarbeariaId(id)
        setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader greetingOnly profileHref={`${base}/configuracoes`} avatarFallback="A" />

      <PageContent className="relative flex-1">
        <div className="mx-auto w-full max-w-2xl space-y-5 md:max-w-3xl lg:max-w-4xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" size="sm" className="-ml-2 w-fit shrink-0 gap-1 px-2 text-muted-foreground" asChild>
              <Link href={equipeHref}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Equipe
              </Link>
            </Button>
          </div>

          <div>
            <PageTitle className="text-2xl">Novo membro</PageTitle>
            <p className="mt-1 text-sm text-muted-foreground">Identificação, contato e preferências da equipe.</p>
          </div>

          {error ? (
            <Alert
              variant="danger"
              onClose={() => setError(null)}
              autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
            >
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          ) : null}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : barbeariaId ? (
            <EquipeMembroForm
            barbeariaId={barbeariaId}
            tenantSlug={tenantSlug}
            editingBarbeiro={null}
            equipeListHref={equipeHref}
          />
          ) : null}
        </div>
      </PageContent>
    </TenantPanelPageContainer>
  )
}
