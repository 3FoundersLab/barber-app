'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Building2, ChevronLeft, Save } from 'lucide-react'
import { PageContainer, PageContent, PageTitle } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { serializeBarbeariaEndereco } from '@/lib/barbearia-endereco'
import { emptySuperBarbeariaForm } from '@/lib/super-barbearia-form'
import { SuperBarbeariaFormFields } from '@/components/super/super-barbearia-form-fields'

export default function SuperBarbeariaNovaPage() {
  const router = useRouter()
  const [form, setForm] = useState(emptySuperBarbeariaForm)
  const [slugAutofill, setSlugAutofill] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.slug.trim()) return
    setIsSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: insertError } = await supabase.from('barbearias').insert({
      nome: form.nome.trim(),
      slug: form.slug.trim(),
      telefone: form.telefone || null,
      email: form.email || null,
      endereco: serializeBarbeariaEndereco(form.enderecoParts),
    })
    if (insertError) {
      setError('Não foi possível criar a barbearia')
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
            <PageTitle className="min-w-0 truncate">Nova barbearia</PageTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Nome, contato e localização. O slug identifica a URL pública da barbearia.
            </p>
          </div>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              Dados da barbearia
            </CardTitle>
            <CardDescription>
              Campos opcionais podem ser preenchidos depois; o CEP preenche rua, bairro e cidade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SuperBarbeariaFormFields
              idPrefix="nova"
              value={form}
              onChange={setForm}
              slugAutofill={slugAutofill}
              onSlugAutofillChange={setSlugAutofill}
              showAtivo={false}
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
              onClick={() => void handleSubmit()}
              disabled={isSaving || !form.nome.trim() || !form.slug.trim()}
            >
              {isSaving ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? 'Salvando...' : 'Criar barbearia'}
            </Button>
          </CardFooter>
        </Card>
      </PageContent>
    </PageContainer>
  )
}
