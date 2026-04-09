'use client'

import { Suspense, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowLeft, Banknote, CalendarPlus, Eye, EyeOff, UserCheck } from 'lucide-react'
import { LoginLandingShell } from '@/components/auth/login-landing-shell'
import { LandingHeroFloatingCard } from '@/components/landing/landing-hero-floating-card'
import { LANDING_LINKS } from '@/components/landing/constants'
import {
  landingButtonLift,
  landingContainer,
  landingEyebrow,
  landingPrimaryCtaClass,
} from '@/components/landing/landing-classes'
import { AppBrandLogo } from '@/components/shared/app-brand-logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { LANDING_EASE } from '@/lib/landing-motion'
import {
  finalizeAuthPersistenceAfterLogin,
  prepareAuthPersistenceForLogin,
  resetPendingAuthPersistence,
} from '@/lib/auth-session-persistence'
import { normalizeEmailInput } from '@/lib/format-contato'
import { mapSupabaseAuthErrorToMessage } from '@/lib/map-supabase-auth-error'
import { createClient } from '@/lib/supabase/client'
import { signOutWithPersistenceClear } from '@/lib/supabase/sign-out-client'
import { clearProfileCache } from '@/lib/profile-cache'
import { fetchSessionProfile } from '@/lib/supabase/fetch-session-profile'
import { resolveBarbeariaSlugForUser } from '@/lib/resolve-admin-barbearia-slug'
import { rpcUserIsMemberOfBarbearia } from '@/lib/barbearia-rpc'
import { tenantBarbeariaDashboardPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

/** Mesma imagem principal da hero da landing. */
const LOGIN_HERO_IMAGE =
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=960&q=82'

const inputPremiumClass = cn(
  'h-11 rounded-xl border text-foreground placeholder:text-muted-foreground',
  'transition-[border-color,box-shadow,background-color] duration-200',
  'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:outline-none',
  'border-zinc-200/90 bg-white/95 shadow-[inset_0_1px_2px_rgba(24,24,27,0.04)]',
  'hover:border-zinc-300/90 hover:bg-white',
  'focus-visible:bg-white',
  'dark:border-input dark:bg-background dark:shadow-none dark:hover:border-primary/30',
)

const loginFormCardClass = cn(
  'rounded-2xl p-6 backdrop-blur-xl sm:p-8',
  'border border-white/75 bg-white/72',
  'shadow-[0_1px_0_0_rgba(255,255,255,0.92)_inset,0_28px_56px_-22px_rgba(15,23,42,0.12),0_0_0_1px_rgba(24,24,27,0.055),0_18px_48px_-26px_rgba(14,165,233,0.1),0_26px_56px_-34px_rgba(249,115,22,0.055)]',
  'ring-1 ring-zinc-950/[0.035]',
  // Dark: vidro escuro — sobrescreve bg-white/72 (evita card cinza-claro no tema escuro)
  'dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-[0_24px_64px_-28px_rgba(0,0,0,0.55)] dark:ring-white/[0.04]',
)

const loginDemoCardClass = cn(
  'mt-6 rounded-xl border border-white/65 bg-white/48 px-4 py-4 backdrop-blur-md',
  'shadow-[0_1px_0_0_rgba(255,255,255,0.8)_inset,0_14px_36px_-22px_rgba(15,23,42,0.1),0_0_0_1px_rgba(24,24,27,0.045)] ring-1 ring-zinc-950/[0.028]',
  'dark:border-white/10 dark:bg-zinc-950/55 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] dark:ring-white/[0.03]',
)

const loginSubmitClass = cn(
  'h-12 w-full rounded-full text-base font-bold',
  landingPrimaryCtaClass,
  landingButtonLift,
  'shadow-[0_0_24px_-8px_rgba(249,115,22,0.35)] transition-transform duration-200',
  'hover:shadow-[0_0_36px_-6px_rgba(249,115,22,0.45)] hover:scale-[1.01] active:scale-[0.99]',
  'dark:shadow-[0_0_28px_-6px_rgba(249,115,22,0.45)] dark:hover:shadow-[0_0_44px_-4px_rgba(249,115,22,0.5)]',
)

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reduceMotion = useReducedMotion() === true
  const visualRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [keepSignedIn, setKeepSignedIn] = useState(true)

  const { scrollYProgress } = useScroll({
    target: visualRef,
    offset: ['start end', 'end start'],
  })
  const parallaxRaw = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 22])
  const parallaxY = useSpring(parallaxRaw, { stiffness: 90, damping: 28, mass: 0.45 })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const barbeariaSlug = searchParams.get('barbearia')?.trim().toLowerCase()

      if (barbeariaSlug) {
        const { data: barbearia } = await supabase.from('barbearias').select('id').eq('slug', barbeariaSlug).maybeSingle()

        if (!barbearia) {
          setError('Barbearia não encontrada para esta URL')
          return
        }
      }

      prepareAuthPersistenceForLogin(keepSignedIn)
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        resetPendingAuthPersistence()
        setError(mapSupabaseAuthErrorToMessage(authError))
        return
      }

      finalizeAuthPersistenceAfterLogin(keepSignedIn)
      await supabase.auth.refreshSession()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const barbeariaSlugParam = searchParams.get('barbearia')?.trim().toLowerCase()

        if (barbeariaSlugParam) {
          const { data: bar } = await supabase.from('barbearias').select('id').eq('slug', barbeariaSlugParam).maybeSingle()
          if (!bar?.id) {
            setError('Barbearia não encontrada para esta URL')
            clearProfileCache()
            await signOutWithPersistenceClear(supabase)
            return
          }
          const vinculo = await rpcUserIsMemberOfBarbearia(supabase, bar.id)

          if (!vinculo) {
            setError('Seu usuário não pertence à barbearia da URL')
            clearProfileCache()
            await signOutWithPersistenceClear(supabase)
            return
          }
        }

        const profile = await fetchSessionProfile(supabase, user.id)

        if (profile?.ativo === false) {
          setError('Esta conta está desativada. Entre em contato com o administrador da plataforma.')
          clearProfileCache()
          await signOutWithPersistenceClear(supabase)
          return
        }

        if (profile?.role === 'super_admin') {
          router.push('/dashboard')
          return
        } else if (profile?.role === 'admin') {
          let resolvedSlug: string | null = null

          if (barbeariaSlugParam) {
            const { data: bDirect } = await supabase.from('barbearias').select('slug').eq('slug', barbeariaSlugParam).maybeSingle()

            if (bDirect?.slug) {
              resolvedSlug = bDirect.slug
            }
          } else {
            const resolved = await resolveBarbeariaSlugForUser(supabase, user.id)
            resolvedSlug = resolved?.slug ?? null
          }

          if (!resolvedSlug) {
            setError(
              'Não encontramos vínculo com uma barbearia para esta conta. Se você acabou de se cadastrar, use o mesmo e-mail do cadastro ou refaça o cadastro em Cadastrar barbearia. Se o problema continuar, peça ao suporte para conferir a tabela barbearia_users no banco.',
            )
            clearProfileCache()
            await signOutWithPersistenceClear(supabase)
            return
          }

          router.push(tenantBarbeariaDashboardPath(resolvedSlug))
          return
        } else if (profile?.role === 'barbeiro') {
          router.push('/agenda')
          return
        } else {
          router.push('/inicio')
          return
        }
      }
    } catch {
      resetPendingAuthPersistence()
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const inactiveRedirect = searchParams.get('reason') === 'inactive'

  return (
    <LoginLandingShell>
      <header className="shrink-0 border-b border-border/80 bg-background/75 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/50">
        <div className={cn(landingContainer, 'flex flex-wrap items-center justify-between gap-3 py-4')}>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: LANDING_EASE }}
          >
            <AppBrandLogo
              href="/"
              textClassName="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
              className="gap-2.5 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </motion.div>
          <motion.div
            className="flex items-center gap-3"
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: LANDING_EASE, delay: 0.05 }}
          >
            <ThemeToggle inline variant="landing" />
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              Voltar ao site
            </Link>
          </motion.div>
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center">
        <div className={cn(landingContainer, 'w-full py-10 sm:py-12 lg:py-16')}>
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-16 xl:grid-cols-[1.15fr_minmax(0,28rem)] xl:gap-20">
            {/* Coluna esquerda: copy + imagem (só desktop — como antes) */}
            <motion.div
              ref={visualRef}
              className="relative hidden lg:block"
              initial={reduceMotion ? false : { opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: LANDING_EASE }}
            >
              <p className={landingEyebrow}>Acesso à plataforma</p>
              <h1 className="mt-4 max-w-xl text-balance text-4xl font-semibold tracking-tight text-foreground xl:text-[2.5rem] xl:leading-[1.12]">
                Entre e retome a operação da sua barbearia
              </h1>
              <p className="mt-5 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
                A BarberTool reúne <span className="font-medium text-foreground/90">agendamento</span>,{' '}
                <span className="font-medium text-foreground/90">gestão da equipe</span> e{' '}
                <span className="font-medium text-foreground/90">controle do caixa</span> da sua barbearia em um só
                painel. Um login e você retoma a operação com menos caos no WhatsApp e mais previsibilidade no faturamento.
              </p>

              <div className="relative mx-auto mt-14 max-w-md">
                <motion.div className="relative w-full" style={{ y: parallaxY }}>
                  <motion.div
                    className="relative mx-auto w-full max-w-md"
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            y: [0, -5, 0],
                          }
                    }
                    transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.div
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[104%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-gradient-to-b from-primary/[0.14] via-cyan-500/[0.1] to-indigo-950/[0.22] blur-[48px] md:blur-[52px] dark:from-primary/[0.22] dark:via-cyan-500/[0.14] dark:to-indigo-950/[0.35]"
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              opacity: [0.4, 0.58, 0.4],
                            }
                      }
                      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-[40%] z-0 h-[36%] w-[52%] -translate-x-1/2 rounded-full bg-cyan-400/[0.08] blur-[36px] dark:bg-cyan-400/[0.14]"
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              opacity: [0.3, 0.48, 0.3],
                            }
                      }
                      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                    />
                    <motion.div
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-[60%] z-0 h-[22%] w-[40%] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-[40px] dark:bg-primary/[0.14]"
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              opacity: [0.2, 0.38, 0.2],
                            }
                      }
                      transition={{ duration: 8.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                    />

                    <div
                      className={cn(
                        'group relative z-10 aspect-[3/4] overflow-hidden rounded-3xl ring-1 transition-[transform,box-shadow,ring-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        'shadow-[0_28px_56px_-18px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.06)] ring-black/[0.06]',
                        'dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.07),0_0_64px_-20px_rgba(34,211,238,0.15),0_0_48px_-24px_rgba(249,115,22,0.12)] dark:ring-white/[0.1]',
                        'md:group-hover:-translate-y-1 md:group-hover:scale-[1.01]',
                        'dark:md:group-hover:shadow-[0_40px_80px_-18px_rgba(0,0,0,0.65),0_0_72px_-16px_rgba(34,211,238,0.18)]',
                      )}
                    >
                      <Image
                        src={LOGIN_HERO_IMAGE}
                        alt="Profissional em atendimento na barbearia"
                        fill
                        className="object-cover object-[center_22%]"
                        sizes="(max-width: 1024px) 0vw, 420px"
                        priority
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-zinc-950/35 dark:bg-zinc-950/42"
                        aria-hidden
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/15 to-transparent dark:from-zinc-950/90 dark:via-zinc-950/18"
                        aria-hidden
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-zinc-950/40 via-transparent to-zinc-950/25 dark:from-zinc-950/55 dark:to-cyan-950/25"
                        aria-hidden
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-cyan-500/[0.05] dark:to-cyan-500/[0.08]"
                        aria-hidden
                      />
                    </div>

                    <LandingHeroFloatingCard
                      icon={CalendarPlus}
                      title="Agenda do dia"
                      subtitle="Grade ao vivo, equipe alinhada"
                      delay={0.12}
                      floatDuration={5.4}
                      floatRange={5}
                      tier="all"
                      slideFrom="left"
                      onDarkSurface
                      premiumHero
                      className="left-0 top-[6%] sm:left-[-6%]"
                    />
                    <LandingHeroFloatingCard
                      icon={UserCheck}
                      title="Cliente na cadeira"
                      subtitle="Histórico na hora do corte"
                      delay={0.24}
                      floatDuration={6}
                      floatRange={5}
                      tier="all"
                      slideFrom="right"
                      onDarkSurface
                      premiumHero
                      className="right-0 top-[14%] sm:right-[-5%]"
                    />
                    <LandingHeroFloatingCard
                      icon={Banknote}
                      title="Caixa do turno"
                      subtitle="Fechamento claro, sem surpresa"
                      delay={0.36}
                      floatDuration={5.2}
                      floatRange={4}
                      tier="all"
                      slideFrom="left"
                      onDarkSurface
                      premiumHero
                      className="bottom-[8%] left-[-4%] sm:left-[-8%]"
                    />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            {/* Coluna direita: formulário */}
            <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <motion.div
                className="mb-8 text-center lg:hidden"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: LANDING_EASE }}
              >
                <p className={landingEyebrow}>Acesso à plataforma</p>
                <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Bem-vindo de volta
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Entre com seu e-mail para continuar no BarberTool.
                </p>
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: LANDING_EASE, delay: reduceMotion ? 0 : 0.08 }}
              >
                <div className="hidden lg:block">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
                    Entrar na conta
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Use o e-mail cadastrado. Em segundos você volta para a agenda e ao caixa.
                  </p>
                </div>

                <div className={cn(loginFormCardClass, 'mt-6')}>
                  {inactiveRedirect ? (
                    <p className="mb-4 rounded-xl border border-primary/25 bg-primary/[0.08] px-4 py-3 text-sm text-foreground/95 dark:text-orange-50">
                      Sua sessão foi encerrada porque esta conta está desativada.
                    </p>
                  ) : null}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="voce@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: normalizeEmailInput(e.target.value) })
                        }
                        required
                        disabled={isLoading}
                        inputMode="email"
                        autoComplete="email"
                        className={inputPremiumClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        Senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          disabled={isLoading}
                          autoComplete="current-password"
                          className={cn(inputPremiumClass, 'pr-11')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'flex items-start gap-3 pt-0.5 transition-opacity',
                        isLoading && 'pointer-events-none opacity-60',
                      )}
                    >
                      <Checkbox
                        id="keep-signed-in"
                        checked={keepSignedIn}
                        onCheckedChange={(v) => setKeepSignedIn(v === true)}
                        disabled={isLoading}
                        className="mt-0.5"
                        aria-describedby="keep-signed-in-hint"
                      />
                      <div className="grid gap-1 leading-none">
                        <Label
                          htmlFor="keep-signed-in"
                          className="cursor-pointer text-sm font-medium leading-snug text-foreground"
                        >
                          Manter conectado
                        </Label>
                        <p id="keep-signed-in-hint" className="text-xs leading-relaxed text-muted-foreground">
                          {keepSignedIn
                            ? 'Você permanece logado por até 30 dias neste dispositivo.'
                            : 'Ao fechar o navegador, será preciso entrar de novo neste aparelho.'}
                        </p>
                      </div>
                    </div>

                    {error ? (
                      <Alert
                        variant="danger"
                        className="border-destructive/35 bg-destructive/10 text-left dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-100"
                        onClose={() => setError(null)}
                        autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
                      >
                        <AlertTitle className="text-sm">{error}</AlertTitle>
                      </Alert>
                    ) : null}

                    <Button type="submit" disabled={isLoading} className={loginSubmitClass}>
                      {isLoading ? <Spinner className="mr-2 size-4 text-primary-foreground" /> : null}
                      {isLoading ? 'Entrando…' : 'Entrar'}
                    </Button>
                  </form>
                </div>

                <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground lg:text-left">
                  Tem uma barbearia e ainda não usa a plataforma?{' '}
                  <Link
                    href={LANDING_LINKS.cadastro}
                    className="font-semibold text-sky-600 underline-offset-4 transition-colors hover:text-sky-500 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
                  >
                    Cadastre sua barbearia
                  </Link>
                </p>

                <div className={loginDemoCardClass}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Ambiente demo
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground/80">Super admin:</span> super@barbertool.com
                    <br />
                    <span className="font-medium text-foreground/80">Admin:</span> admin@barbertool.com
                    <br />
                    <span className="font-medium text-foreground/80">Barbeiro:</span> barbeiro@barbertool.com
                    <br />
                    <span className="font-medium text-foreground/80">Cliente:</span> cliente@barbertool.com
                  </p>
                  <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground dark:border-white/10">
                    Senha comum: <span className="font-mono text-foreground/90">123456</span>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </LoginLandingShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <LoginLandingShell>
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-24">
            <Spinner className="size-9 text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>
          </div>
        </LoginLandingShell>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
