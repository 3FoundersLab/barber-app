'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { EquipeMembroForm } from '@/components/domain/equipe-membro-form'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { PageContent, PageTitle } from '@/components/shared/page-container'
import { ProfileFormCardSkeleton } from '@/components/shared/loading-skeleton'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import type { Barbeiro } from '@/types'

export default function TenantEquipeEditarMembroPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const { slug, base } = useTenantAdminBase()
  const tenantSlug = slug.trim()
  const equipeHref = `${base}/equipe`

  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [barbeiro, setBarbeiro] = useState<Barbeiro | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [membroNaoEncontrado, setMembroNaoEncontrado] = useState(false)

  useEffect(() => {
    if (!id) {
      setMembroNaoEncontrado(true)
      setIsLoading(false)
      return
    }
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
          setIsLoading(false)
        }
        return
      }
      const barbeariaIdResolved = await resolveAdminBarbeariaId(supabase, user.id, { slug })
      if (!barbeariaIdResolved) {
        if (!cancelled) {
          setError('Barbearia não encontrada para este usuário')
          setIsLoading(false)
        }
        return
      }

      const { data: row, error: rowErr } = await supabase
        .from('barbeiros')
        .select('*')
        .eq('id', id)
        .eq('barbearia_id', barbeariaIdResolved)
        .maybeSingle()

      if (cancelled) return

      if (rowErr) {
        setError('Não foi possível carregar o membro')
        setIsLoading(false)
        return
      }
      if (!row) {
        setMembroNaoEncontrado(true)
        setIsLoading(false)
        return
      }

      setBarbeariaId(barbeariaIdResolved)
      setBarbeiro(row as Barbeiro)
      setIsLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id, slug])

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
            <PageTitle className="text-2xl">Editar membro</PageTitle>
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

          {membroNaoEncontrado ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm text-muted-foreground">Membro não encontrado ou sem permissão para editar.</p>
                <Button asChild variant="outline" size="sm">
                  <Link href={equipeHref}>Voltar para a equipe</Link>
                </Button>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <ProfileFormCardSkeleton />
          ) : barbeariaId && barbeiro ? (
            <EquipeMembroForm
              barbeariaId={barbeariaId}
              tenantSlug={tenantSlug}
              editingBarbeiro={barbeiro}
              equipeListHref={equipeHref}
            />
          ) : null}
        </div>
      </PageContent>
    </TenantPanelPageContainer>
  )
}
