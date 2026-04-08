'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { Banknote, CalendarPlus, Eye, EyeOff, UserCheck } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { LANDING_EASE } from '@/lib/landing-motion'
import { normalizeEmailInput } from '@/lib/format-contato'
import { createClient } from '@/lib/supabase/client'
import { clearProfileCache } from '@/lib/profile-cache'
import { fetchSessionProfile } from '@/lib/supabase/fetch-session-profile'
import { resolveBarbeariaSlugForUser } from '@/lib/resolve-admin-barbearia-slug'
import { rpcUserIsMemberOfBarbearia } from '@/lib/barbearia-rpc'
import { tenantBarbeariaDashboardPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

const LOGIN_VISUAL_IMAGE =
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=960&q=82'

const inputPremiumClass = cn(
  'h-11 rounded-xl border-zinc-700/80 bg-zinc-900/70 text-zinc-100 shadow-none placeholder:text-zinc-500',
  'focus-visible:border-cyan-400/45 focus-visible:ring-2 focus-visible:ring-cyan-400/20',
)

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reduceMotion = useReducedMotion() === true
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

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

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        setError('Email ou senha inválidos')
        return
      }

      await supabase.auth.refreshSession()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const barbeariaSlug = searchParams.get('barbearia')?.trim().toLowerCase()

        if (barbeariaSlug) {
          const { data: bar } = await supabase.from('barbearias').select('id').eq('slug', barbeariaSlug).maybeSingle()
          if (!bar?.id) {
            setError('Barbearia não encontrada para esta URL')
            clearProfileCache()
            await supabase.auth.signOut()
            return
          }
          const vinculo = await rpcUserIsMemberOfBarbearia(supabase, bar.id)

          if (!vinculo) {
            setError('Seu usuário não pertence à barbearia da URL')
            clearProfileCache()
            await supabase.auth.signOut()
            return
          }
        }

        const profile = await fetchSessionProfile(supabase, user.id)

        if (profile?.ativo === false) {
          setError('Esta conta está desativada. Entre em contato com o administrador da plataforma.')
          clearProfileCache()
          await supabase.auth.signOut()
          return
        }

        if (profile?.role === 'super_admin') {
          router.push('/dashboard')
          return
        } else if (profile?.role === 'admin') {
          let resolvedSlug: string | null = null

          if (barbeariaSlug) {
            const { data: bDirect } = await supabase.from('barbearias').select('slug').eq('slug', barbeariaSlug).maybeSingle()

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
            await supabase.auth.signOut()
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
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const inactiveRedirect = searchParams.get('reason') === 'inactive'

  return (
    <LoginLandingShell>
      <header className="shrink-0 border-b border-white/[0.06] bg-zinc-950/40 backdrop-blur-sm">
        <div className={cn(landingContainer, 'flex items-center justify-between py-4')}>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: LANDING_EASE }}
          >
            <AppBrandLogo
              href="/"
              textClassName="text-lg font-semibold tracking-tight text-white sm:text-xl"
              className="gap-2.5 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            />
          </motion.div>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: LANDING_EASE, delay: 0.05 }}
          >
            <Link
              href="/"
              className="text-sm font-medium text-zinc-400 transition-colors duration-300 hover:text-zinc-100"
            >
              Voltar ao site
            </Link>
          </motion.div>
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center">
        <div className={cn(landingContainer, 'w-full py-10 sm:py-12 lg:py-16')}>
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-16 xl:grid-cols-[1.15fr_minmax(0,28rem)] xl:gap-20">
            {/* Coluna visual — desktop */}
            <motion.div
              className="relative hidden lg:block"
              initial={reduceMotion ? false : { opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: LANDING_EASE }}
            >
              <p className={cn(landingEyebrow, 'text-amber-400/95')}>Acesso à plataforma</p>
              <h1 className="mt-4 max-w-xl text-balance text-4xl font-semibold tracking-tight text-white xl:text-[2.5rem] xl:leading-[1.12]">
                Entre e retome a operação da sua barbearia
              </h1>
              <p className="mt-5 max-w-lg text-pretty text-lg leading-relaxed text-zinc-400">
                Mesma experiência da landing: agenda, equipe e caixa na mesma tela. Um login, tudo sincronizado.
              </p>

              <div className="relative mx-auto mt-14 max-w-md">
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[102%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] bg-gradient-to-b from-cyan-500/[0.2] via-teal-600/[0.1] to-indigo-950/[0.28] blur-[48px] md:blur-[52px]"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          opacity: [0.5, 0.68, 0.5],
                        }
                  }
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative z-10 aspect-[3/4] overflow-hidden rounded-[1.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06)] ring-1 ring-white/[0.08]">
                  <Image
                    src={LOGIN_VISUAL_IMAGE}
                    alt=""
                    fill
                    className="object-cover object-[center_22%]"
                    sizes="(max-width: 1024px) 0vw, 420px"
                    priority
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/18 to-transparent"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-zinc-950/50 via-transparent to-zinc-950/35"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-cyan-950/20"
                    aria-hidden
                  />
                </div>

                <LandingHeroFloatingCard
                  icon={CalendarPlus}
                  title="Agenda do dia"
                  subtitle="Grade ao vivo · equipe alinhada"
                  delay={0.15}
                  floatDuration={5.4}
                  floatRange={4}
                  tier="all"
                  slideFrom="left"
                  onDarkSurface
                  className="left-0 top-[6%] sm:left-[-6%]"
                />
                <LandingHeroFloatingCard
                  icon={UserCheck}
                  title="Cliente na cadeira"
                  subtitle="Histórico na hora do corte"
                  delay={0.28}
                  floatDuration={6}
                  floatRange={5}
                  tier="all"
                  slideFrom="right"
                  onDarkSurface
                  className="right-0 top-[14%] sm:right-[-5%]"
                />
                <LandingHeroFloatingCard
                  icon={Banknote}
                  title="Caixa do turno"
                  subtitle="Fechamento claro · sem surpresa"
                  delay={0.4}
                  floatDuration={5.2}
                  floatRange={4}
                  tier="all"
                  slideFrom="left"
                  onDarkSurface
                  className="bottom-[8%] left-[-4%] sm:left-[-8%]"
                />
              </div>
            </motion.div>

            {/* Coluna formulário + mobile intro */}
            <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <motion.div
                className="mb-8 text-center lg:hidden"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: LANDING_EASE }}
              >
                <p className={cn(landingEyebrow, 'text-amber-400/95')}>Acesso à plataforma</p>
                <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Bem-vindo de volta
                </h1>
                <p className="mt-2 text-sm text-zinc-400">Entre com seu e-mail para continuar no BarberApp.</p>
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: LANDING_EASE, delay: reduceMotion ? 0 : 0.08 }}
              >
                <div className="hidden lg:block">
                  <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">Entrar na conta</h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Use o e-mail cadastrado. Em segundos você volta para a agenda e ao caixa.
                  </p>
                </div>

                <div
                  className={cn(
                    'mt-6 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.025] p-6 shadow-[0_24px_64px_-28px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8',
                    'ring-1 ring-white/[0.04]',
                  )}
                >
                  {inactiveRedirect ? (
                    <p className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-100/95">
                      Sua sessão foi encerrada porque esta conta está desativada.
                    </p>
                  ) : null}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
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
                        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500"
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
                          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {error ? (
                      <Alert
                        variant="danger"
                        className="border-red-500/30 bg-red-950/40 text-left text-red-100"
                        onClose={() => setError(null)}
                        autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
                      >
                        <AlertTitle className="text-sm">{error}</AlertTitle>
                      </Alert>
                    ) : null}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        'h-12 w-full rounded-full text-base font-bold',
                        landingPrimaryCtaClass,
                        landingButtonLift,
                      )}
                    >
                      {isLoading ? <Spinner className="mr-2 size-4 text-white" /> : null}
                      {isLoading ? 'Entrando…' : 'Entrar'}
                    </Button>
                  </form>
                </div>

                <p className="mt-8 text-center text-sm leading-relaxed text-zinc-500 lg:text-left">
                  Tem uma barbearia e ainda não usa a plataforma?{' '}
                  <Link
                    href={LANDING_LINKS.cadastro}
                    className="font-semibold text-cyan-400/95 underline-offset-4 transition-colors hover:text-cyan-300 hover:underline"
                  >
                    Cadastre sua barbearia
                  </Link>
                </p>

                <div className="mt-6 rounded-xl border border-white/[0.06] bg-zinc-950/50 px-4 py-4 ring-1 ring-white/[0.03]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Ambiente demo</p>
                  <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                    <span className="font-medium text-zinc-400">Super admin:</span> super@barbertool.com
                    <br />
                    <span className="font-medium text-zinc-400">Admin:</span> admin@barbertool.com
                    <br />
                    <span className="font-medium text-zinc-400">Barbeiro:</span> barbeiro@barbertool.com
                    <br />
                    <span className="font-medium text-zinc-400">Cliente:</span> cliente@barbertool.com
                  </p>
                  <p className="mt-3 border-t border-white/[0.06] pt-3 text-xs text-zinc-600">
                    Senha comum: <span className="font-mono text-zinc-400">123456</span>
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
            <Spinner className="size-9 text-cyan-400/80" />
            <p className="mt-4 text-sm text-zinc-500">Carregando…</p>
          </div>
        </LoginLandingShell>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
