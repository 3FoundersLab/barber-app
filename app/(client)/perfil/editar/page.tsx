'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Save, User, Phone, Mail } from 'lucide-react'
import { PageContainer, PageContent, PageTitle } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { ProfileFormCardSkeleton } from '@/components/shared/loading-skeleton'
import { maskTelefoneBr } from '@/lib/format-contato'
import { createClient } from '@/lib/supabase/client'
import { setProfileCache } from '@/lib/profile-cache'
import { ProfileAvatarUpload } from '@/components/shared/profile-avatar-upload'
import type { Profile } from '@/types'

export default function ClienteEditarPerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [avatar, setAvatar] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      setError(null)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('Usuário não autenticado')
        setIsLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!data) {
        setError('Perfil não encontrado')
      } else {
        setProfile(data)
        setNome(data.nome || '')
        setTelefone(maskTelefoneBr(data.telefone || ''))
        setAvatar(data.avatar || '')
      }
      setIsLoading(false)
    }
    void load()
  }, [])

  const handleSave = async () => {
    if (!profile) return
    const trimmedNome = nome.trim()
    if (!trimmedNome) {
      setError('Informe seu nome')
      return
    }

    setIsSaving(true)
    setError(null)
    const supabase = createClient()

    const payload = {
      nome: trimmedNome,
      telefone: telefone.trim() || null,
      avatar: avatar.trim() || null,
    }

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', profile.id)
      .select('*')
      .single()

    if (updateError || !updated) {
      setError('Não foi possível salvar o perfil')
      setIsSaving(false)
      return
    }

    setProfile(updated)
    setProfileCache(profile.id, updated)
    setIsSaving(false)
    router.push('/inicio')
  }

  return (
    <PageContainer>
      <AppPageHeader greetingOnly profileHref="/perfil/editar" profile={profile} avatarFallback="C" />

      <PageContent className="space-y-6">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            onClick={() => router.back()}
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <PageTitle className="min-w-0 truncate">Perfil</PageTitle>
        </div>

        {isLoading ? (
          <ProfileFormCardSkeleton />
        ) : (
          <>
            {error && (
              <Alert
                variant="danger"
                onClose={() => setError(null)}
                autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
              >
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-5 w-5" />
                  Seus dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado aqui.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone" className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(maskTelefoneBr(e.target.value))}
                    placeholder="(00) 00000-0000"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>

                {profile ? (
                  <ProfileAvatarUpload
                    userId={profile.id}
                    avatarUrl={avatar}
                    onAvatarUrlChange={setAvatar}
                    fallbackLetter={nome.trim().charAt(0).toUpperCase() || 'C'}
                    disabled={isSaving}
                    onError={setError}
                  />
                ) : null}
              </CardContent>
            </Card>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={isSaving || !profile}
            >
              {isSaving ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar alterações
            </Button>
          </>
        )}
      </PageContent>
    </PageContainer>
  )
}
