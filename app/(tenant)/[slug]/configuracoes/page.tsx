'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ChevronLeft,
  Clock,
  CreditCard,
  LogOut,
  Mail,
  Phone,
  Save,
  Store,
  User,
} from 'lucide-react'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { TenantAssinaturaSummary } from '@/components/shared/tenant-assinatura-summary'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  ALERT_DEFAULT_AUTO_CLOSE_MS,
} from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProfileAvatarUpload } from '@/components/shared/profile-avatar-upload'
import { createClient } from '@/lib/supabase/client'
import { signOutWithPersistenceClear } from '@/lib/supabase/sign-out-client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { fetchLatestAssinaturaWithPlano, type AssinaturaComPlano } from '@/lib/tenant-assinatura-query'
import { clearProfileCache, setProfileCache } from '@/lib/profile-cache'
import {
  deserializeBarbeariaEndereco,
  emptyBarbeariaEnderecoParts,
  serializeBarbeariaEndereco,
} from '@/lib/barbearia-endereco'
import { BarbeariaEnderecoFields } from '@/components/shared/barbearia-endereco-fields'
import { maskTelefoneBr, normalizeEmailInput } from '@/lib/format-contato'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { SuperProfileTenantConfigSkeleton } from '@/components/super/super-profile-page-skeleton'
import {
  superProfileGlassCardClass,
  superProfileInputClass,
  superProfileDangerAlertClass,
  superProfileLabelClass,
} from '@/components/super/super-profile-styles'
import {
  landingButtonLift,
  landingEyebrow,
  landingPrimaryCtaClass,
} from '@/components/landing/landing-classes'
import { cn } from '@/lib/utils'
import type { Barbearia, Profile } from '@/types'

function timeFromDb(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 5)
}

function timeToDb(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  return v.length === 5 ? `${v}:00` : v
}

const profileAvatarUploadPremiumClass = cn(
  'space-y-3 border-t border-zinc-200/80 pt-5 dark:border-white/[0.06]',
  '[&_.text-muted-foreground]:text-muted-foreground [&_label]:text-foreground dark:[&_label]:text-zinc-300',
  '[&_button]:border-zinc-200 [&_button]:bg-zinc-50 [&_button]:text-foreground [&_button]:shadow-none [&_button]:transition-[background-color,border-color,box-shadow] [&_button]:duration-300',
  '[&_button:hover]:border-zinc-300 [&_button:hover]:bg-zinc-100',
  'dark:[&_button]:border-white/15 dark:[&_button]:bg-white/[0.06] dark:[&_button]:text-zinc-200',
  'dark:[&_button:hover]:border-white/22 dark:[&_button:hover]:bg-white/[0.1]',
)

export default function AdminConfiguracoesPage() {
  const router = useRouter()
  const reduceMotion = useReducedMotion() === true
  const { slug, base } = useTenantAdminBase()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [assinatura, setAssinatura] = useState<AssinaturaComPlano | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingBarbearia, setIsSavingBarbearia] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nomePerfil, setNomePerfil] = useState('')
  const [telefonePerfil, setTelefonePerfil] = useState('')
  const [avatar, setAvatar] = useState('')

  const [formBarbearia, setFormBarbearia] = useState({
    nome: '',
    enderecoParts: emptyBarbeariaEnderecoParts(),
    telefone: '',
    email: '',
    horario_abertura: '',
    horario_fechamento: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      setError(null)

      await supabase.auth.refreshSession()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('Usuário não autenticado')
        setIsLoading(false)
        return
      }

      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileErr) {
        setError(profileErr.message || 'Não foi possível carregar o perfil')
        setIsLoading(false)
        return
      }

      if (profileData) {
        setProfile(profileData)
        setNomePerfil(profileData.nome || '')
        setTelefonePerfil(maskTelefoneBr(profileData.telefone || ''))
        setAvatar(profileData.avatar || '')
      }

      let b: Barbearia | null = null

      const barbeariaIdResolved = await resolveAdminBarbeariaId(supabase, user.id, { slug })

      if (barbeariaIdResolved) {
        const { data: bDirect, error: bErr } = await supabase
          .from('barbearias')
          .select('*')
          .eq('id', barbeariaIdResolved)
          .maybeSingle()
        if (bErr) {
          setError(bErr.message || 'Não foi possível carregar a barbearia')
        } else {
          b = bDirect
        }
      }

      if (b) {
        setBarbearia(b)
        setFormBarbearia({
          nome: b.nome,
          enderecoParts: deserializeBarbeariaEndereco(b.endereco ?? null),
          telefone: maskTelefoneBr(b.telefone || ''),
          email: normalizeEmailInput(b.email || ''),
          horario_abertura: timeFromDb(b.horario_abertura),
          horario_fechamento: timeFromDb(b.horario_fechamento),
        })

        const assinaturaData = await fetchLatestAssinaturaWithPlano(supabase, b.id)
        setAssinatura(assinaturaData)
      }

      setIsLoading(false)
    }

    void load()
  }, [slug])

  const handleSaveBarbearia = async () => {
    if (!barbearia) return

    const abre = formBarbearia.horario_abertura.trim()
    const fecha = formBarbearia.horario_fechamento.trim()
    if (abre && fecha && abre >= fecha) {
      setError('O horário de abertura deve ser anterior ao horário de fechamento.')
      return
    }

    setIsSavingBarbearia(true)
    setError(null)
    const supabase = createClient()

    const { data: updatedB, error: updateError } = await supabase
      .from('barbearias')
      .update({
        nome: formBarbearia.nome,
        endereco: serializeBarbeariaEndereco(formBarbearia.enderecoParts),
        telefone: formBarbearia.telefone || null,
        email: formBarbearia.email || null,
        horario_abertura: timeToDb(formBarbearia.horario_abertura),
        horario_fechamento: timeToDb(formBarbearia.horario_fechamento),
      })
      .eq('id', barbearia.id)
      .select('*')
      .single()

    if (updateError) {
      setError('Não foi possível salvar os dados da barbearia')
    } else if (updatedB) {
      setBarbearia(updatedB)
    }

    setIsSavingBarbearia(false)
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    const trimmedNome = nomePerfil.trim()
    if (!trimmedNome) {
      setError('Informe seu nome')
      return
    }

    setIsSavingProfile(true)
    setError(null)
    const supabase = createClient()

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({
        nome: trimmedNome,
        telefone: telefonePerfil.trim() || null,
        avatar: avatar.trim() || null,
      })
      .eq('id', profile.id)
      .select('*')
      .single()

    if (updateError || !updated) {
      setError('Não foi possível salvar os dados da conta')
      setIsSavingProfile(false)
      return
    }

    setProfile(updated)
    setProfileCache(profile.id, updated)
    setIsSavingProfile(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    clearProfileCache()
    await signOutWithPersistenceClear(supabase)
    router.push('/login')
  }

  const previewSrc = avatar || undefined
  const fallbackLetter = nomePerfil.trim().charAt(0).toUpperCase() || 'A'

  const pagamentoPendente =
    barbearia?.status_cadastro === 'pagamento_pendente' || assinatura?.status === 'pendente'

  const showAguardandoPagamento =
    pagamentoPendente || (profile?.role === 'admin' && !barbearia && !error)

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader
        greetingOnly
        profileHref={`${base}/configuracoes`}
        profile={profile}
        avatarFallback="A"
      />

      <PageContent className="relative flex-1">
        <div className="mx-auto w-full max-w-2xl md:max-w-3xl lg:max-w-4xl">
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
                <p className={landingEyebrow}>Painel da barbearia</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Configurações
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Sua conta, dados do negócio e assinatura. O email de login não é alterado aqui.
                </p>
              </div>
            </div>

            {isLoading ? (
              <SuperProfileTenantConfigSkeleton />
            ) : (
              <>
                {showAguardandoPagamento ? (
                  <Alert variant="warning" className="text-left">
                    <AlertTitle>Aguardando confirmação de pagamento</AlertTitle>
                    <AlertDescription>
                      Sua barbearia está com status de pagamento pendente (cadastro novo ou renovação após a data de
                      expiração do plano) até o administrador da plataforma confirmar o pagamento na área de assinaturas.
                      Até lá, o painel fica limitado ao dashboard, à assinatura e a esta página.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {error ? (
                  <Alert
                    variant="danger"
                    onClose={() => setError(null)}
                    autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
                    className={superProfileDangerAlertClass}
                  >
                    <AlertTitle>{error}</AlertTitle>
                  </Alert>
                ) : null}

                {profile ? (
                  <div
                    className={cn(
                      superProfileGlassCardClass,
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
                        {nomePerfil.trim() || profile.nome || 'Administrador'}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.1] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                        <Store className="size-3.5 opacity-90" aria-hidden />
                        Administrador da barbearia
                      </div>
                      <p className="mt-2 truncate text-sm text-muted-foreground">{profile.email}</p>
                      {barbearia?.nome ? (
                        <p className="mt-1 truncate text-xs text-muted-foreground">{barbearia.nome}</p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <Tabs defaultValue="conta" className="w-full gap-5">
                  <TabsList
                    className={cn(
                      'grid h-auto w-full grid-cols-3 gap-1 rounded-xl border border-zinc-200/80 bg-zinc-50/90 p-1 shadow-none',
                      'dark:border-white/[0.08] dark:bg-white/[0.05]',
                    )}
                  >
                    <TabsTrigger
                      value="conta"
                      className="gap-1.5 text-xs sm:text-sm"
                      disabled={!profile}
                    >
                      <User className="size-3.5 opacity-90 sm:size-4" aria-hidden />
                      Conta
                    </TabsTrigger>
                    <TabsTrigger value="barbearia" className="gap-1.5 text-xs sm:text-sm">
                      <Store className="size-3.5 opacity-90 sm:size-4" aria-hidden />
                      Barbearia
                    </TabsTrigger>
                    <TabsTrigger value="assinatura" className="gap-1.5 text-xs sm:text-sm">
                      <CreditCard className="size-3.5 opacity-90 sm:size-4" aria-hidden />
                      Assinatura
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="conta" className="mt-0 space-y-6 outline-none">
                    <section className={cn(superProfileGlassCardClass, 'overflow-hidden')}>
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
                            htmlFor="emailPerfil"
                            className="flex items-center gap-1.5 text-sm font-medium text-foreground dark:text-zinc-300"
                          >
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                            Email
                          </Label>
                          <Input
                            id="emailPerfil"
                            value={profile?.email || ''}
                            disabled
                            className={cn(
                              superProfileInputClass,
                              'cursor-not-allowed bg-zinc-100 text-muted-foreground dark:bg-white/[0.06] dark:text-zinc-400',
                            )}
                          />
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            O email não pode ser alterado aqui.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nomePerfil" className={superProfileLabelClass}>
                            Nome
                          </Label>
                          <Input
                            id="nomePerfil"
                            value={nomePerfil}
                            onChange={(e) => setNomePerfil(e.target.value)}
                            placeholder="Nome de exibição"
                            autoComplete="name"
                            className={superProfileInputClass}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="telefonePerfil"
                            className="flex items-center gap-1.5 text-sm font-medium text-foreground dark:text-zinc-300"
                          >
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                            Telefone
                          </Label>
                          <Input
                            id="telefonePerfil"
                            value={telefonePerfil}
                            onChange={(e) => setTelefonePerfil(maskTelefoneBr(e.target.value))}
                            placeholder="(00) 00000-0000"
                            inputMode="tel"
                            autoComplete="tel"
                            className={superProfileInputClass}
                          />
                        </div>

                        {profile?.id ? (
                          <ProfileAvatarUpload
                            userId={profile.id}
                            avatarUrl={avatar}
                            onAvatarUrlChange={setAvatar}
                            fallbackLetter={fallbackLetter}
                            disabled={isSavingProfile}
                            onError={setError}
                            className={profileAvatarUploadPremiumClass}
                          />
                        ) : null}
                      </div>
                    </section>

                    <Button
                      type="button"
                      className={cn(
                        landingPrimaryCtaClass,
                        landingButtonLift,
                        'h-12 w-full text-xs uppercase tracking-wide sm:text-sm',
                      )}
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile || !profile}
                    >
                      {isSavingProfile ? (
                        <Spinner className="mr-2 h-4 w-4" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Salvar dados da conta
                    </Button>
                  </TabsContent>

                  <TabsContent value="barbearia" className="mt-0 space-y-6 outline-none">
                    <section className={cn(superProfileGlassCardClass, 'overflow-hidden')}>
                      <header className="border-b border-zinc-200/80 px-5 py-4 dark:border-white/[0.06] md:px-6">
                        <div className="flex items-center gap-2 text-foreground">
                          <Store className="size-4 text-primary opacity-90" aria-hidden />
                          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Dados da barbearia
                          </h2>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          Nome, contato, endereço e horário de funcionamento de referência.
                        </p>
                      </header>

                      <div className="space-y-5 p-5 md:p-6">
                        {barbearia ? (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="slug" className={superProfileLabelClass}>
                                Identificador (slug)
                              </Label>
                              <Input
                                id="slug"
                                value={barbearia.slug}
                                readOnly
                                disabled
                                className={cn(
                                  superProfileInputClass,
                                  'cursor-not-allowed bg-zinc-100 font-mono text-sm text-muted-foreground dark:bg-white/[0.06] dark:text-zinc-400',
                                )}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="nomeBarbearia" className={superProfileLabelClass} required>
                                Nome da barbearia
                              </Label>
                              <Input
                                id="nomeBarbearia"
                                value={formBarbearia.nome}
                                onChange={(e) => setFormBarbearia({ ...formBarbearia, nome: e.target.value })}
                                placeholder="Nome da barbearia"
                                aria-required="true"
                                className={superProfileInputClass}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="telefoneBarbearia"
                                className="flex items-center gap-1.5 text-sm font-medium text-foreground dark:text-zinc-300"
                              >
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                                Telefone de contato
                              </Label>
                              <Input
                                id="telefoneBarbearia"
                                value={formBarbearia.telefone}
                                onChange={(e) =>
                                  setFormBarbearia({
                                    ...formBarbearia,
                                    telefone: maskTelefoneBr(e.target.value),
                                  })
                                }
                                placeholder="(00) 00000-0000"
                                inputMode="tel"
                                autoComplete="tel"
                                className={superProfileInputClass}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="emailBarbearia"
                                className="flex items-center gap-1.5 text-sm font-medium text-foreground dark:text-zinc-300"
                              >
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                                Email de contato da barbearia
                              </Label>
                              <Input
                                id="emailBarbearia"
                                type="email"
                                value={formBarbearia.email}
                                onChange={(e) =>
                                  setFormBarbearia({
                                    ...formBarbearia,
                                    email: normalizeEmailInput(e.target.value),
                                  })
                                }
                                placeholder="Opcional — contato@barbearia.com"
                                inputMode="email"
                                autoComplete="email"
                                className={superProfileInputClass}
                              />
                            </div>

                            <BarbeariaEnderecoFields
                              idPrefix="cfg-barbearia"
                              value={formBarbearia.enderecoParts}
                              onChange={(enderecoParts) =>
                                setFormBarbearia((prev) => ({ ...prev, enderecoParts }))
                              }
                              disabled={isSavingBarbearia}
                              inputClassName={superProfileInputClass}
                              labelClassName={cn(superProfileLabelClass, 'flex items-center gap-1.5')}
                            />

                            <div
                              className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]"
                              role="group"
                              aria-labelledby="cfg-horario-funcionamento-label"
                            >
                              <p
                                id="cfg-horario-funcionamento-label"
                                className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground dark:text-zinc-300"
                              >
                                <Clock className="size-4 text-muted-foreground" aria-hidden />
                                Horário de funcionamento
                              </p>
                              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                                Opcional. Referência para equipe e clientes; não substitui os horários individuais da
                                equipe.
                              </p>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label htmlFor="horarioAbertura" className={superProfileLabelClass}>
                                    Abre às
                                  </Label>
                                  <Input
                                    id="horarioAbertura"
                                    type="time"
                                    value={formBarbearia.horario_abertura}
                                    onChange={(e) =>
                                      setFormBarbearia((prev) => ({
                                        ...prev,
                                        horario_abertura: e.target.value,
                                      }))
                                    }
                                    disabled={isSavingBarbearia}
                                    className={superProfileInputClass}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="horarioFechamento" className={superProfileLabelClass}>
                                    Fecha às
                                  </Label>
                                  <Input
                                    id="horarioFechamento"
                                    type="time"
                                    value={formBarbearia.horario_fechamento}
                                    onChange={(e) =>
                                      setFormBarbearia((prev) => ({
                                        ...prev,
                                        horario_fechamento: e.target.value,
                                      }))
                                    }
                                    disabled={isSavingBarbearia}
                                    className={superProfileInputClass}
                                  />
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            Quando o cadastro estiver sincronizado, o nome, telefone e demais dados da barbearia
                            aparecerão aqui para edição.
                          </p>
                        )}
                      </div>
                    </section>

                    {barbearia ? (
                      <Button
                        type="button"
                        className={cn(
                          landingPrimaryCtaClass,
                          landingButtonLift,
                          'h-12 w-full text-xs uppercase tracking-wide sm:text-sm',
                        )}
                        onClick={handleSaveBarbearia}
                        disabled={isSavingBarbearia}
                      >
                        {isSavingBarbearia ? (
                          <Spinner className="mr-2 h-4 w-4" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Salvar dados da barbearia
                      </Button>
                    ) : null}
                  </TabsContent>

                  <TabsContent value="assinatura" className="mt-0 space-y-6 outline-none">
                    {assinatura ? <TenantAssinaturaSummary assinatura={assinatura} variant="premium" /> : null}

                    <section className={cn(superProfileGlassCardClass, 'px-5 py-4 md:px-6')}>
                      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        <Store className="size-4 text-sky-600 dark:text-sky-400/90" aria-hidden />
                        Acesso
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Você gerencia apenas a barbearia vinculada à sua conta. Alterações nesta tela não mudam o plano nem
                        as permissões definidas pela plataforma.
                      </p>
                    </section>

                    <section className={cn(superProfileGlassCardClass, 'overflow-hidden')}>
                      <header className="border-b border-zinc-200/80 px-5 py-4 dark:border-white/[0.06] md:px-6">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Sessão
                        </h2>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          Encerre o login neste dispositivo.
                        </p>
                      </header>
                      <div className="p-5 md:p-6">
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full border-zinc-200 bg-zinc-50 text-destructive shadow-none transition-[background-color,border-color] duration-300',
                            'hover:border-red-300 hover:bg-red-50 hover:text-destructive',
                            'dark:border-white/12 dark:bg-white/[0.04] dark:hover:border-red-500/40 dark:hover:bg-red-950/35',
                          )}
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sair da conta
                        </Button>
                      </div>
                    </section>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </motion.div>
        </div>
      </PageContent>
    </TenantPanelPageContainer>
  )
}
