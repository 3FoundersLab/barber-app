'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Save, User, Phone, Mail } from 'lucide-react'
import {
  PageContainer,
  PageContent,
  PageTitle,
} from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { setProfileCache } from '@/lib/profile-cache'
import { ProfileAvatarUpload } from '@/components/shared/profile-avatar-upload'
import type { Profile } from '@/types'

export default function SuperEditarPerfilPage() {
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
        router.replace('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!data) {
        setError('Perfil não encontrado')
        setIsLoading(false)
        return
      }

      if (data.role !== 'super_admin') {
        router.replace('/')
        return
      }

      setProfile(data)
      setNome(data.nome || '')
      setTelefone(data.telefone || '')
      setAvatar(data.avatar || '')
      setIsLoading(false)
    }
    void load()
  }, [router])

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
    router.push('/super/dashboard')
  }

  const headerLeading = (
    <div className="flex min-w-0 items-center gap-3">
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <PageTitle className="truncate">Perfil</PageTitle>
    </div>
  )

  if (isLoading) {
    return (
      <PageContainer>
        <AppPageHeader
          leading={headerLeading}
          profileHref="/super/perfil/editar"
          profile={profile}
          avatarFallback="S"
        />
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <AppPageHeader
        leading={headerLeading}
        profileHref="/super/perfil/editar"
        profile={profile}
        avatarFallback="S"
      />

      <PageContent className="space-y-6">
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
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                autoComplete="tel"
              />
            </div>

            {profile ? (
              <ProfileAvatarUpload
                userId={profile.id}
                avatarUrl={avatar}
                onAvatarUrlChange={setAvatar}
                fallbackLetter={nome.trim().charAt(0).toUpperCase() || 'S'}
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
      </PageContent>
    </PageContainer>
  )
}
