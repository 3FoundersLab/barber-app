'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { LoginLandingShell } from '@/components/auth/login-landing-shell'
import { LANDING_LINKS } from '@/components/landing/constants'
import {
  landingButtonLift,
  landingContainer,
  landingEyebrow,
  landingPrimaryCtaClass,
} from '@/components/landing/landing-classes'
import { AppBrandLogo } from '@/components/shared/app-brand-logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  ALERT_DEFAULT_AUTO_CLOSE_MS,
} from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { CadastroPlanoGridSkeleton } from '@/components/shared/loading-skeleton'
import { createClient } from '@/lib/supabase/client'
import { mapSupabaseAuthErrorToMessage } from '@/lib/map-supabase-auth-error'
import { toUserFriendlyErrorMessage } from '@/lib/to-user-friendly-error'
import { resolveBarbeariaSlugForUser } from '@/lib/resolve-admin-barbearia-slug'
import { rpcGetMyBarbeariaSlug } from '@/lib/barbearia-rpc'
import { formatCurrency } from '@/lib/constants'
import { linhasBeneficiosPlano } from '@/lib/plano-beneficios'
import { maskTelefoneBr, normalizeEmailInput, telefoneDigits } from '@/lib/format-contato'
import { tenantBarbeariaDashboardPath } from '@/lib/routes'
import { clearTenantUnidadeSessionStorage } from '@/lib/tenant-unidade-session'
import {
  emptyBarbeariaEnderecoParts,
  serializeBarbeariaEndereco,
  type BarbeariaEnderecoParts,
} from '@/lib/barbearia-endereco'
import { BarbeariaEnderecoFields } from '@/components/shared/barbearia-endereco-fields'
import { PlanoPeriodicidadeToggle } from '@/components/shared/plano-periodicidade-toggle'
import { cepDigits } from '@/lib/viacep'
import {
  labelPeriodicidade,
  mesesPorPeriodicidade,
  precoTotalNoPeriodo,
  sufixoPrecoPeriodicidade,
  type PlanoPeriodicidade,
} from '@/lib/plano-periodicidade'
import type { Plano } from '@/types'
import { LANDING_EASE } from '@/lib/landing-motion'

const STEPS = [
  { id: 1 as const, label: 'Dados principais', short: 'Dados' },
  { id: 2 as const, label: 'Endereço', short: 'Endereço' },
  { id: 3 as const, label: 'Plano', short: 'Plano' },
]

const cadastroInputPremium = cn(
  'h-11 rounded-xl border border-input bg-background text-foreground shadow-none placeholder:text-muted-foreground',
  'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35',
)

const cadastroLabelPremium = cn(
  'text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground',
  '[&_span.text-destructive]:text-destructive',
)

const cadastroInputError = 'border-red-500/70 focus-visible:border-red-500/70 focus-visible:ring-red-500/25'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateStep1(
  formData: {
    nomeBarbearia: string
    slug: string
    telefoneBarbearia: string
    emailResponsavel: string
    senha: string
    confirmarSenha: string
  },
  hasSession: boolean,
): Record<string, string> {
  const e: Record<string, string> = {}
  if (!formData.nomeBarbearia.trim()) {
    e.nomeBarbearia = 'Informe o nome da barbearia.'
  }
  const slug = slugify(formData.slug || formData.nomeBarbearia)
  if (!slug) {
    e.slug = 'Defina um identificador (slug) válido.'
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    e.slug = 'Use apenas letras minúsculas, números e hífens.'
  }
  const tel = telefoneDigits(formData.telefoneBarbearia)
  if (tel.length < 10 || tel.length > 11) {
    e.telefoneBarbearia = 'Informe um telefone válido com DDD (10 ou 11 dígitos).'
  }
  const em = formData.emailResponsavel.trim()
  if (!em) {
    e.emailResponsavel = 'Informe o e-mail de acesso.'
  } else if (!EMAIL_RE.test(em)) {
    e.emailResponsavel = 'Informe um e-mail válido.'
  }
  if (!hasSession) {
    if (formData.senha.length < 6) {
      e.senha = 'A senha deve ter pelo menos 6 caracteres.'
    }
    if (formData.senha !== formData.confirmarSenha) {
      e.confirmarSenha = 'As senhas não coincidem.'
    }
  }
  return e
}

function validateStep2(parts: BarbeariaEnderecoParts): Partial<Record<keyof BarbeariaEnderecoParts, string>> {
  const e: Partial<Record<keyof BarbeariaEnderecoParts, string>> = {}
  if (cepDigits(parts.cep).length !== 8) {
    e.cep = 'Informe um CEP válido (8 dígitos).'
  }
  if (!parts.logradouro.trim()) {
    e.logradouro = 'Informe a rua / logradouro.'
  }
  if (!parts.numero.trim()) {
    e.numero = 'Informe o número.'
  }
  if (!parts.bairro.trim()) {
    e.bairro = 'Informe o bairro.'
  }
  if (!parts.cidade.trim()) {
    e.cidade = 'Informe a cidade.'
  }
  const uf = parts.uf.trim().toUpperCase()
  if (uf.length !== 2) {
    e.uf = 'Informe a UF com 2 letras.'
  }
  return e
}

export default function CadastroBarbeariaPage() {
  const router = useRouter()
  const reduceMotion = useReducedMotion() === true
  const [currentStep, setCurrentStep] = useState(1)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [slugAutofill, setSlugAutofill] = useState(true)
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({})
  const [step2Errors, setStep2Errors] = useState<Partial<Record<keyof BarbeariaEnderecoParts, string>>>({})
  const [formData, setFormData] = useState({
    nomeBarbearia: '',
    slug: '',
    telefoneBarbearia: '',
    enderecoParts: emptyBarbeariaEnderecoParts(),
    emailResponsavel: '',
    senha: '',
    confirmarSenha: '',
    planoId: '',
    planoPeriodicidade: 'mensal' as PlanoPeriodicidade,
  })
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    loadPlanos()
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      setHasSession(!!user)
      if (user?.email) {
        setFormData((p) => ({
          ...p,
          emailResponsavel: p.emailResponsavel || normalizeEmailInput(user.email || ''),
        }))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function loadPlanos() {
    setIsLoadingPlans(true)
    setError(null)
    const supabase = createClient()

    const { data, error: queryError } = await supabase
      .from('planos')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (queryError) {
      setError('Nao foi possivel carregar os planos')
      setPlanos([])
    } else {
      setPlanos(data || [])
    }

    setIsLoadingPlans(false)
  }

  function goNext() {
    setError(null)
    if (currentStep === 1) {
      const err = validateStep1(formData, hasSession)
      setStep1Errors(err)
      if (Object.keys(err).length > 0) return
      setCurrentStep(2)
      return
    }
    if (currentStep === 2) {
      const err = validateStep2(formData.enderecoParts)
      setStep2Errors(err)
      if (Object.keys(err).length > 0) return
      setCurrentStep(3)
    }
  }

  function goBack() {
    setError(null)
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (currentStep !== 3) return

    if (!formData.planoId) {
      setError('Selecione um plano para continuar')
      return
    }

    const err1 = validateStep1(formData, hasSession)
    const err2 = validateStep2(formData.enderecoParts)
    if (Object.keys(err1).length > 0) {
      setStep1Errors(err1)
      setCurrentStep(1)
      return
    }
    if (Object.keys(err2).length > 0) {
      setStep2Errors(err2)
      setCurrentStep(2)
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()
    const slug = slugify(formData.slug || formData.nomeBarbearia)

    try {
      const { data: existingBarbearia } = await supabase
        .from('barbearias')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (existingBarbearia) {
        setError('Esse identificador de barbearia ja esta em uso')
        setCurrentStep(1)
        setStep1Errors((prev) => ({ ...prev, slug: 'Este identificador já está em uso.' }))
        return
      }

      const {
        data: { user: loggedInUser },
      } = await supabase.auth.getUser()

      if (loggedInUser) {
        const jaTemVinculo = await rpcGetMyBarbeariaSlug(supabase)

        if (jaTemVinculo) {
          const dest = await resolveBarbeariaSlugForUser(supabase, loggedInUser.id)
          clearTenantUnidadeSessionStorage()
          if (dest?.slug) {
            router.push(tenantBarbeariaDashboardPath(dest.slug))
          } else {
            router.push('/painel')
          }
          return
        }

        const { error: rpcErrorLogged } = await supabase.rpc('criar_barbearia_com_assinatura', {
          p_nome: formData.nomeBarbearia,
          p_slug: slug,
          p_telefone: formData.telefoneBarbearia || null,
          p_plano_id: formData.planoId,
          p_email_responsavel: formData.emailResponsavel.trim() || loggedInUser.email || '',
          p_endereco: serializeBarbeariaEndereco(formData.enderecoParts),
          p_periodicidade: formData.planoPeriodicidade,
        })

        if (rpcErrorLogged) {
          setError(
            toUserFriendlyErrorMessage(rpcErrorLogged, {
              fallback: 'Não foi possível finalizar o cadastro da barbearia.',
            }),
          )
          return
        }

        const vinculoOk = await rpcGetMyBarbeariaSlug(supabase)

        if (!vinculoOk) {
          setError(
            'O cadastro não gerou o vínculo com a barbearia. Verifique se a função criar_barbearia_com_assinatura está aplicada no Supabase e as políticas em scripts/023.',
          )
          return
        }

        await supabase.auth.refreshSession()
        setSuccess('Barbearia cadastrada com sucesso! Redirecionando para o painel...')
        setTimeout(() => {
          clearTenantUnidadeSessionStorage()
          router.push(tenantBarbeariaDashboardPath(slug))
        }, 900)
        return
      }

      if (formData.senha.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres')
        setCurrentStep(1)
        return
      }

      if (formData.senha !== formData.confirmarSenha) {
        setError('As senhas nao coincidem')
        setCurrentStep(1)
        return
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.emailResponsavel,
        password: formData.senha,
        options: {
          data: {
            nome: formData.nomeBarbearia,
            telefone: formData.telefoneBarbearia || null,
            role: 'admin',
          },
        },
      })

      if (signUpError) {
        setError(mapSupabaseAuthErrorToMessage(signUpError))
        return
      }

      const userId = signUpData.user?.id
      if (!userId) {
        setSuccess('Conta criada. Verifique seu email para confirmar o cadastro e depois faca login.')
        return
      }

      let session = signUpData.session
      if (!session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.emailResponsavel.trim(),
          password: formData.senha,
        })
        if (signInError || !signInData.session) {
          setSuccess(
            'Conta criada. Confirme o link no e-mail. Depois faça login e volte nesta página (Cadastrar barbearia), preencha nome da barbearia, slug e plano. Não é preciso criar senha de novo; você já estará logado e o sistema só criará a barbearia.',
          )
          return
        }
        session = signInData.session
      }

      const { error: rpcError } = await supabase.rpc('criar_barbearia_com_assinatura', {
        p_nome: formData.nomeBarbearia,
        p_slug: slug,
        p_telefone: formData.telefoneBarbearia || null,
        p_plano_id: formData.planoId,
        p_email_responsavel: formData.emailResponsavel,
        p_endereco: serializeBarbeariaEndereco(formData.enderecoParts),
        p_periodicidade: formData.planoPeriodicidade,
      })

      if (rpcError) {
        setError(
          toUserFriendlyErrorMessage(rpcError, {
            fallback: 'Não foi possível finalizar o cadastro da barbearia.',
          }),
        )
        return
      }

      const vinculoCheck = await rpcGetMyBarbeariaSlug(supabase)

      if (!vinculoCheck) {
        setError(
          'O cadastro não gerou o vínculo com a barbearia (sessão ou políticas do banco). Tente sair e entrar de novo; se persistir, verifique no Supabase se a função criar_barbearia_com_assinatura foi aplicada.',
        )
        return
      }

      await supabase.auth.refreshSession()

      setSuccess('Barbearia cadastrada com sucesso! Redirecionando para o painel...')
      setTimeout(() => {
        clearTenantUnidadeSessionStorage()
        router.push(tenantBarbeariaDashboardPath(slug))
      }, 900)
    } catch {
      setError('Erro inesperado ao cadastrar. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedPlan = useMemo(
    () => planos.find((plano) => plano.id === formData.planoId),
    [planos, formData.planoId],
  )

  const inputErr = (key: string) => step1Errors[key]

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
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle inline variant="landing" />
            <Link
              href={LANDING_LINKS.login}
              className="text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground"
            >
              Já tenho conta
            </Link>
            <Button
              asChild
              variant="ghost"
              className={cn(
                landingPrimaryCtaClass,
                landingButtonLift,
                'hidden h-10 shrink-0 px-5 text-xs font-bold uppercase tracking-wide sm:inline-flex sm:h-11 sm:px-7',
              )}
            >
              <Link href="/">Site</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className={cn(landingContainer, 'w-full py-8 sm:py-10 lg:py-12')}>
          <motion.div
            className="mx-auto max-w-3xl space-y-8"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: LANDING_EASE, delay: reduceMotion ? 0 : 0.05 }}
          >
            <div className="text-center lg:text-left">
              <p className={landingEyebrow}>Onboarding BarberTool</p>
              <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Cadastre sua barbearia
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base lg:mx-0">
                Três passos rápidos: dados, endereço e plano. Mesma identidade visual da landing, com você dentro do
                produto o tempo todo.
              </p>
            </div>

            <nav
              aria-label="Progresso do cadastro"
              className="rounded-2xl border border-border/80 bg-muted/30 p-4 shadow-[inset_0_1px_0_0_rgba(0,0,0,0.04)] backdrop-blur-sm sm:p-5 dark:border-white/[0.08] dark:bg-zinc-950/50 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
            >
              <ol className="flex w-full items-center">
                {STEPS.map((step, index) => {
                  const done = currentStep > step.id
                  const active = currentStep === step.id
                  const isLast = index === STEPS.length - 1
                  return (
                    <li key={step.id} className={cn('flex min-w-0 items-center', !isLast && 'flex-1')}>
                      <div className="flex min-w-0 flex-col items-center gap-1.5 sm:flex-row sm:gap-3">
                        <div
                          className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 sm:size-10',
                            done &&
                              'border-cyan-400/70 bg-cyan-500/20 text-cyan-100 shadow-[0_0_20px_-6px_rgba(34,211,238,0.45)]',
                            active &&
                              !done &&
                              'border-cyan-400/90 bg-cyan-500/15 text-foreground shadow-md ring-2 ring-cyan-400/35 ring-offset-2 ring-offset-background dark:text-white',
                            !active &&
                              !done &&
                              'border-border bg-muted text-muted-foreground dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-500',
                          )}
                          aria-current={active ? 'step' : undefined}
                        >
                          {done ? <Check className="size-4 stroke-[3]" aria-hidden /> : step.id}
                        </div>
                        <span
                          className={cn(
                            'max-w-[5.5rem] text-center text-[10px] font-medium leading-tight sm:max-w-none sm:text-left sm:text-sm',
                            active ? 'text-foreground dark:text-zinc-100' : 'text-muted-foreground dark:text-zinc-500',
                          )}
                        >
                          <span className="sm:hidden">{step.short}</span>
                          <span className="hidden sm:inline">{step.label}</span>
                        </span>
                      </div>
                      {!isLast ? (
                        <div
                          className={cn(
                            'mx-1.5 h-0.5 min-w-[0.75rem] flex-1 rounded-full transition-colors duration-300 sm:mx-3',
                            currentStep > step.id ? 'bg-cyan-500/60' : 'bg-border dark:bg-zinc-700/80',
                          )}
                          aria-hidden
                        />
                      ) : null}
                    </li>
                  )
                })}
              </ol>
            </nav>

            <div
              className={cn(
                'rounded-2xl border border-border/80 bg-card/95 p-6 shadow-[0_24px_64px_-28px_rgba(0,0,0,0.08)] backdrop-blur-md sm:p-8',
                'ring-1 ring-border/40 dark:border-white/[0.08] dark:bg-gradient-to-b dark:from-white/[0.07] dark:to-white/[0.025] dark:shadow-[0_24px_64px_-28px_rgba(0,0,0,0.55)] dark:ring-white/[0.04]',
              )}
            >
              <div className="border-b border-border pb-6 dark:border-white/[0.06]">
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-[1.35rem]">
                  {currentStep === 1 && 'Dados principais'}
                  {currentStep === 2 && 'Endereço da barbearia'}
                  {currentStep === 3 && 'Escolha do plano'}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {currentStep === 1 &&
                    'Nome, identificador na URL, contato e dados de acesso da conta responsável.'}
                  {currentStep === 2 &&
                    'CEP com preenchimento automático. Complemento é opcional; os demais campos são obrigatórios.'}
                  {currentStep === 3 && 'Selecione o plano e revise o resumo antes de finalizar.'}
                </p>
                {hasSession ? (
                  <p className="mt-3 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-sm text-sky-900 dark:border-cyan-500/20 dark:bg-cyan-500/[0.08] dark:text-cyan-100/90">
                    Você já está logado. Complete os passos; não é necessário informar senha novamente.
                  </p>
                ) : null}
              </div>

              <form className="mt-6 space-y-6" onSubmit={handleSubmit} noValidate>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentStep}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.32, ease: LANDING_EASE }}
                  >
                {currentStep === 1 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="nomeBarbearia" required className={cadastroLabelPremium}>
                        Nome da barbearia
                      </Label>
                      <Input
                        id="nomeBarbearia"
                        value={formData.nomeBarbearia}
                        onChange={(e) => {
                          setStep1Errors((prev) => {
                            const n = { ...prev }
                            delete n.nomeBarbearia
                            return n
                          })
                          setFormData((prev) => ({
                            ...prev,
                            nomeBarbearia: e.target.value,
                            ...(slugAutofill ? { slug: slugify(e.target.value) } : {}),
                          }))
                        }}
                        disabled={isSubmitting}
                        aria-invalid={!!inputErr('nomeBarbearia')}
                        className={cn(cadastroInputPremium, inputErr('nomeBarbearia') && cadastroInputError)}
                      />
                      {inputErr('nomeBarbearia') ? (
                        <p className="text-xs text-red-400">{inputErr('nomeBarbearia')}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slug" required className={cadastroLabelPremium}>
                        Slug (identificador)
                      </Label>
                      <Input
                        id="slug"
                        placeholder="minha-barbearia"
                        value={formData.slug}
                        onChange={(e) => {
                          setSlugAutofill(false)
                          setStep1Errors((prev) => {
                            const n = { ...prev }
                            delete n.slug
                            return n
                          })
                          setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                        }}
                        disabled={isSubmitting}
                        aria-invalid={!!inputErr('slug')}
                        className={cn(cadastroInputPremium, inputErr('slug') && cadastroInputError)}
                      />
                      {inputErr('slug') ? (
                        <p className="text-xs text-red-400">{inputErr('slug')}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefoneBarbearia" required className={cadastroLabelPremium}>
                        Telefone
                      </Label>
                      <Input
                        id="telefoneBarbearia"
                        value={formData.telefoneBarbearia}
                        onChange={(e) => {
                          setStep1Errors((prev) => {
                            const n = { ...prev }
                            delete n.telefoneBarbearia
                            return n
                          })
                          setFormData((prev) => ({
                            ...prev,
                            telefoneBarbearia: maskTelefoneBr(e.target.value),
                          }))
                        }}
                        disabled={isSubmitting}
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(00) 00000-0000"
                        aria-invalid={!!inputErr('telefoneBarbearia')}
                        className={cn(cadastroInputPremium, inputErr('telefoneBarbearia') && cadastroInputError)}
                      />
                      {inputErr('telefoneBarbearia') ? (
                        <p className="text-xs text-red-400">{inputErr('telefoneBarbearia')}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="emailResponsavel" required className={cadastroLabelPremium}>
                        E-mail de acesso
                      </Label>
                      <Input
                        id="emailResponsavel"
                        type="email"
                        value={formData.emailResponsavel}
                        onChange={(e) => {
                          setStep1Errors((prev) => {
                            const n = { ...prev }
                            delete n.emailResponsavel
                            return n
                          })
                          setFormData((prev) => ({
                            ...prev,
                            emailResponsavel: normalizeEmailInput(e.target.value),
                          }))
                        }}
                        disabled={isSubmitting || hasSession}
                        inputMode="email"
                        autoComplete="email"
                        placeholder="seu@email.com"
                        aria-invalid={!!inputErr('emailResponsavel')}
                        className={cn(cadastroInputPremium, inputErr('emailResponsavel') && cadastroInputError)}
                      />
                      {inputErr('emailResponsavel') ? (
                        <p className="text-xs text-red-400">{inputErr('emailResponsavel')}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="senha" required={!hasSession} className={cadastroLabelPremium}>
                        Senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="senha"
                          type={showSenha ? 'text' : 'password'}
                          value={formData.senha}
                          onChange={(e) => {
                            setStep1Errors((prev) => {
                              const n = { ...prev }
                              delete n.senha
                              return n
                            })
                            setFormData((prev) => ({ ...prev, senha: e.target.value }))
                          }}
                          disabled={isSubmitting || hasSession}
                          minLength={6}
                          className={cn(cadastroInputPremium, 'pr-11', inputErr('senha') && cadastroInputError)}
                          aria-invalid={!!inputErr('senha')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSenha((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {inputErr('senha') ? (
                        <p className="text-xs text-red-400">{inputErr('senha')}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmarSenha" required={!hasSession} className={cadastroLabelPremium}>
                        Confirmar senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmarSenha"
                          type={showConfirmarSenha ? 'text' : 'password'}
                          value={formData.confirmarSenha}
                          onChange={(e) => {
                            setStep1Errors((prev) => {
                              const n = { ...prev }
                              delete n.confirmarSenha
                              return n
                            })
                            setFormData((prev) => ({ ...prev, confirmarSenha: e.target.value }))
                          }}
                          disabled={isSubmitting || hasSession}
                          minLength={6}
                          className={cn(
                            cadastroInputPremium,
                            'pr-11',
                            inputErr('confirmarSenha') && cadastroInputError,
                          )}
                          aria-invalid={!!inputErr('confirmarSenha')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmarSenha((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={showConfirmarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showConfirmarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {inputErr('confirmarSenha') ? (
                        <p className="text-xs text-red-400">{inputErr('confirmarSenha')}</p>
                      ) : null}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <BarbeariaEnderecoFields
                    idPrefix="cadastro-barbearia"
                    value={formData.enderecoParts}
                    onChange={(enderecoParts) => {
                      setStep2Errors({})
                      setFormData((prev) => ({ ...prev, enderecoParts }))
                    }}
                    disabled={isSubmitting}
                    showHeading={false}
                    fieldErrors={step2Errors}
                    inputClassName={cadastroInputPremium}
                    labelClassName={cadastroLabelPremium}
                    className="[&_.text-muted-foreground]:text-muted-foreground"
                  />
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className={cadastroLabelPremium}>Período de cobrança</Label>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        O valor exibido em cada plano é o total do período (preço mensal do catálogo × meses).
                      </p>
                      <PlanoPeriodicidadeToggle
                        idPrefix="cadastro-periodicidade"
                        value={formData.planoPeriodicidade}
                        onChange={(planoPeriodicidade) =>
                          setFormData((prev) => ({ ...prev, planoPeriodicidade }))
                        }
                        disabled={isSubmitting || isLoadingPlans}
                        tone="default"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label required className={cadastroLabelPremium}>
                        Planos disponíveis
                      </Label>
                      {isLoadingPlans ? (
                        <CadastroPlanoGridSkeleton className="[&>div]:border-border [&>div]:bg-muted/50 dark:[&>div]:border-white/[0.08] dark:[&>div]:bg-zinc-900/35" />
                      ) : planos.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-3">
                          {planos.map((plano) => {
                            const isSelected = formData.planoId === plano.id
                            const totalPeriodo = precoTotalNoPeriodo(
                              plano.preco_mensal,
                              formData.planoPeriodicidade,
                            )
                            const meses = mesesPorPeriodicidade(formData.planoPeriodicidade)
                            return (
                              <button
                                key={plano.id}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                onClick={() => setFormData((prev) => ({ ...prev, planoId: plano.id }))}
                                className={cn(
                                  'relative rounded-xl border-2 p-4 pt-5 text-left transition-all duration-300',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                  isSelected
                                    ? 'border-primary/50 bg-primary/10 shadow-sm ring-2 ring-primary/20 dark:border-cyan-400/55 dark:bg-cyan-500/[0.12] dark:shadow-cyan-950/25 dark:ring-cyan-400/20'
                                    : 'border-border bg-muted/40 hover:border-primary/35 hover:bg-muted/70 dark:border-white/[0.1] dark:bg-zinc-900/40 dark:hover:border-cyan-500/35 dark:hover:bg-zinc-800/50',
                                )}
                                disabled={isSubmitting}
                              >
                                <span
                                  className={cn(
                                    'absolute right-3 top-3 flex size-8 items-center justify-center rounded-full border-2 transition-colors duration-200',
                                    isSelected
                                      ? 'border-primary bg-primary text-primary-foreground shadow-md dark:border-cyan-400 dark:bg-cyan-500 dark:text-white dark:shadow-[0_0_12px_-2px_rgba(34,211,238,0.45)]'
                                      : 'border-border bg-muted dark:border-zinc-600/80 dark:bg-zinc-800/80',
                                  )}
                                  aria-hidden
                                >
                                  {isSelected ? <Check className="size-4 stroke-[3]" /> : null}
                                </span>
                                <p className="pr-10 font-semibold text-foreground dark:text-zinc-100">{plano.nome}</p>
                                <p
                                  className={cn(
                                    'pr-10 text-sm font-medium tabular-nums',
                                    isSelected
                                      ? 'text-primary dark:text-cyan-100/90'
                                      : 'text-muted-foreground dark:text-zinc-500',
                                  )}
                                >
                                  {formatCurrency(totalPeriodo)}
                                  {sufixoPrecoPeriodicidade(formData.planoPeriodicidade)}
                                </p>
                                {formData.planoPeriodicidade !== 'mensal' ? (
                                  <p className="pr-10 text-[11px] text-muted-foreground dark:text-zinc-500">
                                    {meses}× {formatCurrency(plano.preco_mensal)}/mês
                                  </p>
                                ) : null}
                                <ul className="mt-2 space-y-1 text-left text-xs text-muted-foreground dark:text-zinc-500">
                                  {linhasBeneficiosPlano(plano).length === 0 ? (
                                    <li className="list-none text-muted-foreground/80 dark:text-zinc-600">
                                      Sem benefícios listados
                                    </li>
                                  ) : (
                                    linhasBeneficiosPlano(plano).map((linha, idx) => (
                                      <li key={`${plano.id}-${idx}`} className="flex items-start gap-1.5">
                                        <Check
                                          className={cn(
                                            'mt-0.5 size-3 shrink-0',
                                            isSelected
                                              ? 'text-primary dark:text-cyan-400'
                                              : 'text-muted-foreground dark:text-zinc-600',
                                          )}
                                          strokeWidth={2.5}
                                          aria-hidden
                                        />
                                        <span
                                          className={
                                            isSelected ? 'text-foreground/80 dark:text-zinc-400' : ''
                                          }
                                        >
                                          {linha}
                                        </span>
                                      </li>
                                    ))
                                  )}
                                </ul>
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-5 text-center text-sm text-muted-foreground dark:border-white/[0.12] dark:bg-zinc-900/30 dark:text-zinc-500">
                          Nenhum plano disponivel no momento.
                        </div>
                      )}
                    </div>

                    {selectedPlan && (
                      <Alert
                        variant="success"
                        className="border-sky-500/30 bg-sky-500/10 text-left text-sky-950 dark:border-cyan-500/25 dark:bg-cyan-950/30 dark:text-cyan-50"
                        role="status"
                        aria-live="polite"
                      >
                        <AlertTitle className="text-sky-900 dark:text-cyan-100">Resumo do plano selecionado</AlertTitle>
                        <AlertDescription className="text-sky-900/90 dark:text-cyan-100/85">
                          <p>
                            <span className="font-semibold text-foreground dark:text-white">{selectedPlan.nome}</span>
                            {', '}
                            {labelPeriodicidade(formData.planoPeriodicidade).toLowerCase()}
                          </p>
                          <p className="mt-1 font-medium tabular-nums text-sky-800 dark:text-cyan-50">
                            {formatCurrency(
                              precoTotalNoPeriodo(selectedPlan.preco_mensal, formData.planoPeriodicidade),
                            )}
                            {sufixoPrecoPeriodicidade(formData.planoPeriodicidade)}
                            {formData.planoPeriodicidade !== 'mensal' ? (
                              <span className="block text-xs font-normal text-sky-700/90 dark:text-cyan-200/70">
                                Base {formatCurrency(selectedPlan.preco_mensal)}/mês ×{' '}
                                {mesesPorPeriodicidade(formData.planoPeriodicidade)} meses
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-sky-900/85 dark:text-cyan-100/80">
                            Voce sera o administrador/proprietario da barbearia. Ate o pagamento ser confirmado em
                            Assinaturas, o acesso fica limitado ao dashboard e as configuracoes; o restante do painel
                            libera apos a aprovacao.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
                  </motion.div>
                </AnimatePresence>

              {error && (
                <Alert
                  variant="danger"
                  className="border-destructive/35 bg-destructive/10 text-left dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-100"
                  onClose={() => setError(null)}
                  autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
                >
                  <AlertTitle className="text-sm">{error}</AlertTitle>
                </Alert>
              )}
              {success ? (
                <Alert
                  variant="success"
                  className="border-emerald-500/30 bg-emerald-950/35 text-left text-emerald-50"
                  role="status"
                  aria-live="polite"
                >
                  <AlertTitle>Cadastro concluído</AlertTitle>
                  <AlertDescription className="text-emerald-100/90">{success}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Link
                    href={LANDING_LINKS.login}
                    className="text-sm text-muted-foreground transition-colors hover:text-sky-600 hover:underline dark:hover:text-cyan-400/95"
                  >
                    Já tem conta? Entrar
                  </Link>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {currentStep > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBack}
                      disabled={isSubmitting}
                      className="h-11 rounded-full border-border bg-transparent text-foreground hover:bg-muted dark:border-white/[0.12] dark:text-zinc-200 dark:hover:bg-white/[0.06] dark:hover:text-white"
                    >
                      <ChevronLeft className="mr-1 size-4" aria-hidden />
                      Voltar
                    </Button>
                  ) : null}
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={goNext}
                      disabled={isSubmitting}
                      className={cn(
                        'h-11 rounded-full px-6 text-sm font-bold',
                        landingPrimaryCtaClass,
                        landingButtonLift,
                      )}
                    >
                      Próximo
                      <ChevronRight className="ml-1 size-4" aria-hidden />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        isLoadingPlans ||
                        !formData.planoId ||
                        planos.length === 0
                      }
                      className={cn(
                        'h-11 min-w-[200px] rounded-full text-sm font-bold',
                        landingPrimaryCtaClass,
                        landingButtonLift,
                      )}
                    >
                      {isSubmitting ? <Spinner className="mr-2 size-4 text-primary-foreground" /> : null}
                      {isSubmitting ? 'Finalizando cadastro…' : 'Finalizar cadastro'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
            </div>
          </motion.div>
        </div>
      </main>
    </LoginLandingShell>
  )
}
