'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/constants'
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
  const [formData, setFormData] = useState({
    nomeBarbearia: '',
    slug: '',
    telefoneBarbearia: '',
    emailBarbearia: '',
    enderecoBarbearia: '',
    nomeResponsavel: '',
    emailResponsavel: '',
    telefoneResponsavel: '',
    senha: '',
    confirmarSenha: '',
    planoId: '',
  })

  useEffect(() => {
    loadPlanos()
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

    if (formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas nao coincidem')
      return
    }

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

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.emailResponsavel,
        password: formData.senha,
        options: {
          data: {
            nome: formData.nomeResponsavel,
            telefone: formData.telefoneResponsavel || null,
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

      const { error: rpcError } = await supabase.rpc('criar_barbearia_com_assinatura', {
        p_nome: formData.nomeBarbearia,
        p_slug: slug,
        p_telefone: formData.telefoneBarbearia || null,
        p_email: formData.emailBarbearia || null,
        p_endereco: formData.enderecoBarbearia || null,
        p_plano_id: formData.planoId,
        p_nome_responsavel: formData.nomeResponsavel,
        p_email_responsavel: formData.emailResponsavel,
        p_telefone_responsavel: formData.telefoneResponsavel || null,
      })

      if (rpcError) {
        setError(rpcError.message || 'Nao foi possivel finalizar o cadastro da barbearia')
        return
      }

      setSuccess('Barbearia cadastrada com sucesso! Redirecionando para o painel...')
      setTimeout(() => {
        router.push('/admin/dashboard')
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
            <CardTitle>Dados da barbearia e responsavel</CardTitle>
            <CardDescription>
              Preencha as informacoes abaixo para criar sua barbearia e contratar um plano.
            </CardDescription>
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
                        slug: prev.slug || slugify(e.target.value),
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefoneBarbearia">Telefone da barbearia</Label>
                  <Input
                    id="telefoneBarbearia"
                    value={formData.telefoneBarbearia}
                    onChange={(e) => setFormData((prev) => ({ ...prev, telefoneBarbearia: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailBarbearia">Email da barbearia</Label>
                  <Input
                    id="emailBarbearia"
                    type="email"
                    value={formData.emailBarbearia}
                    onChange={(e) => setFormData((prev) => ({ ...prev, emailBarbearia: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="enderecoBarbearia">Endereco</Label>
                  <Input
                    id="enderecoBarbearia"
                    value={formData.enderecoBarbearia}
                    onChange={(e) => setFormData((prev) => ({ ...prev, enderecoBarbearia: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nomeResponsavel">Nome do responsavel</Label>
                  <Input
                    id="nomeResponsavel"
                    value={formData.nomeResponsavel}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nomeResponsavel: e.target.value }))}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailResponsavel">Email de acesso</Label>
                  <Input
                    id="emailResponsavel"
                    type="email"
                    value={formData.emailResponsavel}
                    onChange={(e) => setFormData((prev) => ({ ...prev, emailResponsavel: e.target.value }))}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefoneResponsavel">Telefone do responsavel</Label>
                  <Input
                    id="telefoneResponsavel"
                    value={formData.telefoneResponsavel}
                    onChange={(e) => setFormData((prev) => ({ ...prev, telefoneResponsavel: e.target.value }))}
                    disabled={isSubmitting}
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
                      disabled={isSubmitting}
                      minLength={6}
                      required
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
                      disabled={isSubmitting}
                      minLength={6}
                      required
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
                  <Card className="border-dashed">
                    <CardContent className="py-4 text-sm text-muted-foreground">Carregando planos...</CardContent>
                  </Card>
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
                          <p className="mt-2 text-xs text-muted-foreground">
                            Barbeiros: {plano.limite_barbeiros ?? 'Ilimitado'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Agendamentos: {plano.limite_agendamentos ?? 'Ilimitado'}
                          </p>
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
                    {formatCurrency(selectedPlan.preco_mensal)} / mes)
                  </CardContent>
                </Card>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
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
                    !formData.nomeResponsavel ||
                    !formData.emailResponsavel ||
                    !formData.senha ||
                    !formData.confirmarSenha ||
                    !formData.planoId
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
