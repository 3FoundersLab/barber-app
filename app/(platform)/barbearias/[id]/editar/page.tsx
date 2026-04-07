'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Building2, ChevronLeft, Pencil, Save } from 'lucide-react'
import { PageContainer, PageContent, PageTitle } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { SuperBarbeariaFormCardSkeleton } from '@/components/shared/loading-skeleton'
import { createClient } from '@/lib/supabase/client'
import { deserializeBarbeariaEndereco, serializeBarbeariaEndereco } from '@/lib/barbearia-endereco'
import { maskTelefoneBr, normalizeEmailInput } from '@/lib/format-contato'
import {
  emptySuperBarbeariaForm,
  slugifyBarbeariaSlug,
} from '@/lib/super-barbearia-form'
import { SuperBarbeariaFormFields } from '@/components/super/super-barbearia-form-fields'
import type { Barbearia } from '@/types'

export default function SuperBarbeariaEditarPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''

  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [form, setForm] = useState(emptySuperBarbeariaForm)
  const [slugAutofill, setSlugAutofill] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      router.replace('/barbearias')
      return
    }
    let cancelled = false
    async function load() {
      setError(null)
      const supabase = createClient()
      const { data, error: qErr } = await supabase.from('barbearias').select('*').eq('id', id).maybeSingle()
      if (cancelled) return
      if (qErr || !data) {
        setError('Barbearia não encontrada')
        setBarbearia(null)
        setIsLoading(false)
        return
      }
      setBarbearia(data)
      setSlugAutofill(slugifyBarbeariaSlug(data.nome) === data.slug)
      setForm({
        nome: data.nome,
        slug: data.slug,
        telefone: maskTelefoneBr(data.telefone ?? ''),
        email: normalizeEmailInput(data.email ?? ''),
        enderecoParts: deserializeBarbeariaEndereco(data.endereco ?? null),
        ativo: data.ativo !== false,
      })
      setIsLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id, router])

  const handleSave = async () => {
    if (!barbearia || !form.nome.trim() || !form.slug.trim()) return
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/platform/barbearias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: barbearia.id,
          nome: form.nome.trim(),
          slug: form.slug,
          telefone: form.telefone || null,
          email: form.email || null,
          endereco: serializeBarbeariaEndereco(form.enderecoParts),
          ativo: form.ativo,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(
          typeof json.error === 'string'
            ? json.error
            : 'Não foi possível salvar. Verifique SUPABASE_SERVICE_ROLE_KEY no servidor.',
        )
        setIsSaving(false)
        return
      }
    } catch {
      setError('Não foi possível salvar as alterações.')
      setIsSaving(false)
      return
    }
    router.push('/barbearias')
    router.refresh()
  }

  return (
    <PageContainer>
      <AppPageHeader greetingOnly profileHref="/conta/editar" avatarFallback="S" />
      <PageContent className="space-y-4 pb-20 md:pb-6">
        <div className="flex min-w-0 flex-wrap items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="size-9 shrink-0" asChild>
            <Link href="/barbearias" aria-label="Voltar para barbearias">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <PageTitle className="min-w-0 truncate">Editar barbearia</PageTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {barbearia ? (
                <>
                  <span className="font-medium text-foreground">{barbearia.nome}</span>
                  {' · '}/{barbearia.slug}
                </>
              ) : (
                'Carregando dados…'
              )}
            </p>
          </div>
        </div>

        {isLoading ? (
          <SuperBarbeariaFormCardSkeleton />
        ) : error && !barbearia ? (
          <Card className="border-destructive/30">
            <CardContent className="space-y-4 py-8">
              <p className="text-center text-sm text-muted-foreground">{error}</p>
              <Button className="w-full" asChild>
                <Link href="/barbearias">Voltar para a lista</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {error ? (
              <Alert
                variant="danger"
                onClose={() => setError(null)}
                autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
              >
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Pencil className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  Dados da barbearia
                </CardTitle>
                <CardDescription>
                  Alterações no slug afetam a URL pública. Use o toggle para ativar ou desativar o cadastro.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SuperBarbeariaFormFields
                  idPrefix="edit"
                  value={form}
                  onChange={setForm}
                  slugAutofill={slugAutofill}
                  onSlugAutofillChange={setSlugAutofill}
                  showAtivo
                  disabled={isSaving}
                />
              </CardContent>
              <CardFooter className="border-border flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full sm:w-auto"
                  disabled={isSaving}
                  onClick={() => router.push('/barbearias')}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="w-full sm:w-auto sm:min-w-[11rem]"
                  onClick={() => void handleSave()}
                  disabled={isSaving || !form.nome.trim() || !form.slug.trim()}
                >
                  {isSaving ? (
                    <Spinner className="mr-2 h-4 w-4" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isSaving ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </PageContent>
    </PageContainer>
  )
}
