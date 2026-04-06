'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Eye, EyeOff, Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { CadastroPlanoGridSkeleton } from '@/components/shared/loading-skeleton'
import { createClient } from '@/lib/supabase/client'
import { resolveBarbeariaSlugForUser } from '@/lib/resolve-admin-barbearia-slug'
import { rpcGetMyBarbeariaSlug } from '@/lib/barbearia-rpc'
import { formatCurrency } from '@/lib/constants'
import { linhasBeneficiosPlano } from '@/lib/plano-beneficios'
import { tenantBarbeariaDashboardPath } from '@/lib/routes'
import type { Plano } from '@/types'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function CadastroBarbeariaPage() {
  const router = useRouter()
  const [planos, setPlanos] = useState<Plano[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [slugAutofill, setSlugAutofill] = useState(true)
  const [formData, setFormData] = useState({
    nomeBarbearia: '',
    slug: '',
    telefoneBarbearia: '',
    enderecoBarbearia: '',
    emailResponsavel: '',
    senha: '',
    confirmarSenha: '',
    planoId: '',
  })
  /** Já autenticado: só completa barbearia (ex.: confirmou e-mail antes). */
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
          emailResponsavel: p.emailResponsavel || user.email || '',
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
      .order('preco_mensal', { ascending: true })

    if (queryError) {
      setError('Nao foi possivel carregar os planos')
      setPlanos([])
    } else {
      setPlanos(data || [])
    }

    setIsLoadingPlans(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.planoId) {
      setError('Selecione um plano para continuar')
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
        return
      }

      const {
        data: { user: loggedInUser },
      } = await supabase.auth.getUser()

      /** Já autenticado (ex.: confirmou o e-mail e fez login): só chama o RPC, sem novo signUp. */
      if (loggedInUser) {
        const jaTemVinculo = await rpcGetMyBarbeariaSlug(supabase)

        if (jaTemVinculo) {
          const dest = await resolveBarbeariaSlugForUser(supabase, loggedInUser.id)
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
          p_endereco: formData.enderecoBarbearia || null,
        })

        if (rpcErrorLogged) {
          setError(rpcErrorLogged.message || 'Nao foi possivel finalizar o cadastro da barbearia')
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
          router.push(tenantBarbeariaDashboardPath(slug))
        }, 900)
        return
      }

      if (formData.senha.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres')
        return
      }

      if (formData.senha !== formData.confirmarSenha) {
        setError('As senhas nao coincidem')
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
        setError(signUpError.message || 'Nao foi possivel criar o usuario responsavel')
        return
      }

      const userId = signUpData.user?.id
      if (!userId) {
        setSuccess('Conta criada. Verifique seu email para confirmar o cadastro e depois faca login.')
        return
      }

      // O RPC usa auth.uid(): sem sessão JWT o vínculo não é criado (comum com "confirmar e-mail" ativo).
      let session = signUpData.session
      if (!session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.emailResponsavel.trim(),
          password: formData.senha,
        })
        if (signInError || !signInData.session) {
          setSuccess(
            'Conta criada. Confirme o link no e-mail. Depois faça login e volte nesta página (Cadastrar barbearia), preencha nome da barbearia, slug e plano — não é preciso criar senha de novo; você já estará logado e o sistema só criará a barbearia.',
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
        p_endereco: formData.enderecoBarbearia || null,
      })

      if (rpcError) {
        setError(rpcError.message || 'Nao foi possivel finalizar o cadastro da barbearia')
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
    [planos, formData.planoId]
  )

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
            <Scissors className="h-7 w-7 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastro de Barbearia</h1>
          <p className="text-sm text-muted-foreground">Crie sua conta e escolha um plano para comecar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados da barbearia e acesso</CardTitle>
            <CardDescription>
              Preencha as informacoes abaixo para criar sua barbearia e contratar um plano.
            </CardDescription>
            {hasSession ? (
              <p className="text-sm text-muted-foreground">
                Voce ja esta logado. Complete nome, slug e plano; nao e necessario informar senha novamente.
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nomeBarbearia">Nome da barbearia</Label>
                  <Input
                    id="nomeBarbearia"
                    value={formData.nomeBarbearia}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        nomeBarbearia: e.target.value,
                        ...(slugAutofill ? { slug: slugify(e.target.value) } : {}),
                      }))
                    }
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (identificador)</Label>
                  <Input
                    id="slug"
                    placeholder="minha-barbearia"
                    value={formData.slug}
                    onChange={(e) => {
                      setSlugAutofill(false)
                      setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                    }}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefoneBarbearia">Telefone</Label>
                  <Input
                    id="telefoneBarbearia"
                    value={formData.telefoneBarbearia}
                    onChange={(e) => setFormData((prev) => ({ ...prev, telefoneBarbearia: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="enderecoBarbearia">Endereço</Label>
                  <Input
                    id="enderecoBarbearia"
                    placeholder="Rua, numero, bairro, cidade"
                    value={formData.enderecoBarbearia}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, enderecoBarbearia: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="emailResponsavel">Email de acesso</Label>
                  <Input
                    id="emailResponsavel"
                    type="email"
                    value={formData.emailResponsavel}
                    onChange={(e) => setFormData((prev) => ({ ...prev, emailResponsavel: e.target.value }))}
                    disabled={isSubmitting || hasSession}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showSenha ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={(e) => setFormData((prev) => ({ ...prev, senha: e.target.value }))}
                      disabled={isSubmitting || hasSession}
                      minLength={6}
                      required={!hasSession}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmarSenha"
                      type={showConfirmarSenha ? 'text' : 'password'}
                      value={formData.confirmarSenha}
                      onChange={(e) => setFormData((prev) => ({ ...prev, confirmarSenha: e.target.value }))}
                      disabled={isSubmitting || hasSession}
                      minLength={6}
                      required={!hasSession}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmarSenha((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showConfirmarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showConfirmarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Escolha o plano</Label>
                {isLoadingPlans ? (
                  <CadastroPlanoGridSkeleton />
                ) : planos.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    {planos.map((plano) => {
                      const isSelected = formData.planoId === plano.id
                      return (
                        <button
                          key={plano.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, planoId: plano.id }))}
                          className={`rounded-xl border p-4 text-left transition ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60'
                          }`}
                          disabled={isSubmitting}
                        >
                          <p className="font-semibold">{plano.nome}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(plano.preco_mensal)} / mes</p>
                          <ul className="mt-2 space-y-1 text-left text-xs text-muted-foreground">
                            {linhasBeneficiosPlano(plano).length === 0 ? (
                              <li className="list-none text-muted-foreground/80">Sem benefícios listados</li>
                            ) : (
                              linhasBeneficiosPlano(plano).map((linha, idx) => (
                                <li key={`${plano.id}-${idx}`} className="flex items-start gap-1.5">
                                  <Check
                                    className="mt-0.5 size-3 shrink-0 text-emerald-600 dark:text-emerald-400"
                                    strokeWidth={2.5}
                                    aria-hidden
                                  />
                                  <span>{linha}</span>
                                </li>
                              ))
                            )}
                          </ul>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-4 text-sm text-muted-foreground">
                      Nenhum plano disponivel no momento.
                    </CardContent>
                  </Card>
                )}
              </div>

              {selectedPlan && (
                <Card className="border-dashed">
                  <CardContent className="py-3 text-sm text-muted-foreground">
                    Plano selecionado: <span className="font-medium text-foreground">{selectedPlan.nome}</span> (
                    {formatCurrency(selectedPlan.preco_mensal)} / mes). Voce sera o administrador/proprietario da
                    barbearia. Ate o pagamento ser confirmado em Assinaturas, o acesso fica limitado ao dashboard e as
                    configuracoes; o restante do painel libera apos a aprovacao.
                  </CardContent>
                </Card>
              )}

              {error && (
                <Alert
                  variant="danger"
                  className="text-left"
                  onClose={() => setError(null)}
                  autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
                >
                  <AlertTitle className="text-sm">{error}</AlertTitle>
                </Alert>
              )}
              {success && <p className="text-sm text-success">{success}</p>}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                  Ja tem conta? Entrar
                </Link>

                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isLoadingPlans ||
                    !formData.nomeBarbearia ||
                    !formData.slug ||
                    !formData.emailResponsavel ||
                    !formData.planoId ||
                    (!hasSession && (!formData.senha || !formData.confirmarSenha))
                  }
                >
                  {isSubmitting ? <Spinner className="mr-2" /> : null}
                  {isSubmitting ? 'Finalizando cadastro...' : 'Cadastrar e contratar plano'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
