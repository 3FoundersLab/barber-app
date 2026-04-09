'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, Mail, Phone, Save, Shield, User } from 'lucide-react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import { superPageContainerClass, superPremiumAppHeaderClass } from '@/components/super/super-ui'
import {
  landingButtonLift,
  landingEyebrow,
  landingPrimaryCtaClass,
} from '@/components/landing/landing-classes'
import { maskTelefoneBr } from '@/lib/format-contato'
import { createClient } from '@/lib/supabase/client'
import { setProfileCache } from '@/lib/profile-cache'
import { ProfileAvatarUpload } from '@/components/shared/profile-avatar-upload'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

const inputPremiumClass = cn(
  'h-10 shadow-none transition-[border-color,box-shadow,background-color] duration-300 focus-visible:border-ring focus-visible:ring-ring/45 disabled:opacity-70',
  'border-zinc-200 bg-white text-foreground placeholder:text-zinc-500 hover:border-zinc-300',
  'dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-white/[0.14]',
)

const glassCardClass = cn(
  'rounded-2xl border backdrop-blur-md transition-[border-color,box-shadow] duration-300',
  'border-zinc-200/95 bg-white/80 shadow-[0_22px_44px_-24px_rgba(0,0,0,0.12)] hover:border-zinc-300/90',
  'dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-[0_24px_48px_-28px_rgba(0,0,0,0.65)] dark:hover:border-white/[0.11]',
)

function SuperPerfilPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className={cn(glassCardClass, 'p-6')}>
        <div className="flex gap-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full bg-zinc-200/90 dark:bg-white/10" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-6 w-48 bg-zinc-200/90 dark:bg-white/10" />
            <Skeleton className="h-4 w-32 bg-zinc-200/90 dark:bg-white/10" />
            <Skeleton className="h-3 w-full max-w-xs bg-zinc-200/90 dark:bg-white/10" />
          </div>
        </div>
      </div>
      <div className={cn(glassCardClass, 'overflow-hidden')}>
        <div className="border-b border-zinc-200/80 px-5 py-4 dark:border-white/[0.06] md:px-6">
          <Skeleton className="h-4 w-36 bg-zinc-200/90 dark:bg-white/10" />
          <Skeleton className="mt-2 h-3 w-56 bg-zinc-200/90 dark:bg-white/10" />
        </div>
        <div className="space-y-5 p-5 md:p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20 bg-zinc-200/90 dark:bg-white/10" />
              <Skeleton className="h-10 w-full bg-zinc-200/90 dark:bg-white/10" />
              {i === 0 ? <Skeleton className="h-3 w-full max-w-xs bg-zinc-200/90 dark:bg-white/10" /> : null}
            </div>
          ))}
          <div className="flex flex-col items-center gap-3 py-2">
            <Skeleton className="h-24 w-24 rounded-full bg-zinc-200/90 dark:bg-white/10" />
            <Skeleton className="h-9 w-28 bg-zinc-200/90 dark:bg-white/10" />
          </div>
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-full bg-zinc-200/90 dark:bg-white/10" />
    </div>
  )
}

export default function SuperEditarPerfilPage() {
  const router = useRouter()
  const reduceMotion = useReducedMotion() === true
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
      setTelefone(maskTelefoneBr(data.telefone || ''))
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

    const res = await fetch('/api/platform/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: trimmedNome,
        telefone: telefone.trim() || null,
        avatar: avatar.trim() || null,
      }),
    })

    const json = (await res.json().catch(() => ({}))) as {
      error?: string
      profile?: Profile
    }

    if (!res.ok || !json.profile) {
      setError(
        typeof json.error === 'string'
          ? json.error
          : 'Não foi possível salvar o perfil. Verifique SUPABASE_SERVICE_ROLE_KEY no servidor.',
      )
      setIsSaving(false)
      return
    }

    const updated = json.profile
    setProfile(updated)
    setProfileCache(profile.id, updated)
    setIsSaving(false)
    router.push('/dashboard')
  }

  const previewSrc = avatar || undefined
  const fallbackLetter = nome.trim().charAt(0).toUpperCase() || 'S'

  return (
    <PageContainer className={superPageContainerClass} hasBottomNav>
      <AppPageHeader
        greetingOnly
        profileHref="/conta/editar"
        profile={profile}
        avatarFallback="S"
        className={superPremiumAppHeaderClass}
      />

      <PageContent className="relative flex-1">
        <div className="mx-auto w-full max-w-lg md:max-w-xl">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 text-muted-foreground transition-colors duration-300 hover:bg-zinc-100 hover:text-primary dark:hover:bg-white/[0.06]"
                onClick={() => router.back()}
                aria-label="Voltar"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <p className={landingEyebrow}>Conta da plataforma</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Seu perfil
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Dados visíveis na equipe e no painel. O email de login não é alterado aqui.
                </p>
              </div>
            </div>

            {isLoading ? (
              <SuperPerfilPageSkeleton />
            ) : (
              <>
                {error ? (
                  <Alert
                    variant="danger"
                    onClose={() => setError(null)}
                    autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
                    className="border-destructive/40 bg-destructive/10 dark:border-red-500/35 dark:bg-red-950/35"
                  >
                    <AlertTitle>{error}</AlertTitle>
                  </Alert>
                ) : null}

                {profile ? (
                  <div
                    className={cn(
                      glassCardClass,
                      'flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 md:p-6',
                    )}
                  >
                    <Avatar className="mx-auto h-20 w-20 shrink-0 ring-2 ring-primary/35 sm:mx-0 sm:h-[5.25rem] sm:w-[5.25rem]">
                      <AvatarImage src={previewSrc} alt="" />
                      <AvatarFallback className="bg-primary/15 text-xl font-semibold text-primary">
                        {fallbackLetter}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                        {nome.trim() || profile.nome || 'Super administrador'}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.1] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                        <Shield className="size-3.5 opacity-90" aria-hidden />
                        Super Admin
                      </div>
                      <p className="mt-2 truncate text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                ) : null}

                <section className={cn(glassCardClass, 'overflow-hidden')}>
                  <header className="border-b border-zinc-200/80 px-5 py-4 dark:border-white/[0.06] md:px-6">
                    <div className="flex items-center gap-2 text-foreground">
                      <User className="size-4 text-primary opacity-90" aria-hidden />
                      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Dados pessoais
                      </h2>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      Informações de contato e foto exibida no menu da conta.
                    </p>
                  </header>

                  <div className="space-y-5 p-5 md:p-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="flex items-center gap-1.5 text-sm font-medium text-foreground dark:text-zinc-300"
                      >
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={profile?.email || ''}
                        disabled
                        className={cn(
                          inputPremiumClass,
                          'cursor-not-allowed bg-zinc-100 text-muted-foreground dark:bg-white/[0.06] dark:text-zinc-400',
                        )}
                      />
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        O email não pode ser alterado aqui.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nome" className="text-sm font-medium text-foreground dark:text-zinc-300">
                        Nome
                      </Label>
                      <Input
                        id="nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Seu nome"
                        autoComplete="name"
                        className={inputPremiumClass}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="telefone"
                        className="flex items-center gap-1.5 text-sm font-medium text-foreground dark:text-zinc-300"
                      >
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        Telefone
                      </Label>
                      <Input
                        id="telefone"
                        value={telefone}
                        onChange={(e) => setTelefone(maskTelefoneBr(e.target.value))}
                        placeholder="(00) 00000-0000"
                        inputMode="tel"
                        autoComplete="tel"
                        className={inputPremiumClass}
                      />
                    </div>

                    {profile ? (
                      <ProfileAvatarUpload
                        userId={profile.id}
                        avatarUrl={avatar}
                        onAvatarUrlChange={setAvatar}
                        fallbackLetter={fallbackLetter}
                        disabled={isSaving}
                        onError={setError}
                        className={cn(
                          'space-y-3 border-t border-zinc-200/80 pt-5 dark:border-white/[0.06]',
                          '[&_.text-muted-foreground]:text-muted-foreground [&_label]:text-foreground dark:[&_label]:text-zinc-300',
                          '[&_button]:border-zinc-200 [&_button]:bg-zinc-50 [&_button]:text-foreground [&_button]:shadow-none [&_button]:transition-[background-color,border-color,box-shadow] [&_button]:duration-300',
                          '[&_button:hover]:border-zinc-300 [&_button:hover]:bg-zinc-100',
                          'dark:[&_button]:border-white/15 dark:[&_button]:bg-white/[0.06] dark:[&_button]:text-zinc-200',
                          'dark:[&_button:hover]:border-white/22 dark:[&_button:hover]:bg-white/[0.1]',
                        )}
                      />
                    ) : null}
                  </div>
                </section>

                <section className={cn(glassCardClass, 'px-5 py-4 md:px-6')}>
                  <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Shield className="size-4 text-sky-600 dark:text-sky-400/90" aria-hidden />
                    Acesso
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Super Admin tem visão global da plataforma (barbearias, usuários, planos e assinaturas). As
                    alterações nesta tela não mudam permissões.
                  </p>
                </section>

                <Button
                  type="button"
                  className={cn(
                    landingPrimaryCtaClass,
                    landingButtonLift,
                    'h-12 w-full text-xs uppercase tracking-wide sm:text-sm',
                  )}
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
          </motion.div>
        </div>
      </PageContent>
    </PageContainer>
  )
}
