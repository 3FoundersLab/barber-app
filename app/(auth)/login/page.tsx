'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { clearProfileCache } from '@/lib/profile-cache'
import { fetchSessionProfile } from '@/lib/supabase/fetch-session-profile'
import { resolveBarbeariaSlugForUser } from '@/lib/resolve-admin-barbearia-slug'
import { rpcUserIsMemberOfBarbearia } from '@/lib/barbearia-rpc'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
        const { data: barbearia } = await supabase
          .from('barbearias')
          .select('id')
          .eq('slug', barbeariaSlug)
          .maybeSingle()

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

      // Get user profile to determine role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const barbeariaSlug = searchParams.get('barbearia')?.trim().toLowerCase()

        if (barbeariaSlug) {
          const { data: bar } = await supabase
            .from('barbearias')
            .select('id')
            .eq('slug', barbeariaSlug)
            .maybeSingle()
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

        // Redirect based on role
        if (profile?.role === 'super_admin') {
          router.push('/dashboard')
          return
        } else if (profile?.role === 'admin') {
          let resolvedSlug: string | null = null

          if (barbeariaSlug) {
            const { data: bDirect } = await supabase
              .from('barbearias')
              .select('slug')
              .eq('slug', barbeariaSlug)
              .maybeSingle()

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

          router.push(`/b/${encodeURIComponent(resolvedSlug)}/dashboard`)
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
            <Scissors className="h-7 w-7 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">BarberApp</h1>
          <p className="text-sm text-muted-foreground">Sistema para Barbearias</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Entrar</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar
            </CardDescription>
            {inactiveRedirect ? (
              <p className="pt-2 text-sm text-amber-700 dark:text-amber-400">
                Sua sessão foi encerrada porque esta conta está desativada.
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Spinner className="mr-2" /> : null}
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Tem uma barbearia e quer usar a plataforma?{' '}
          <Link href="/cadastro/barbearia" className="font-medium text-primary hover:underline">
            Cadastre sua barbearia
          </Link>
        </p>

        {/* Demo accounts */}
        <Card className="border-dashed">
          <CardContent className="pt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Contas demo:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><span className="font-medium">Super Admin:</span> super@barbertool.com</p>
              <p><span className="font-medium">Admin:</span> admin@barbertool.com</p>
              <p><span className="font-medium">Barbeiro:</span> barbeiro@barbertool.com</p>
              <p><span className="font-medium">Cliente:</span> cliente@barbertool.com</p>
              <p className="mt-2 text-muted-foreground/70">Senha: 123456</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <Spinner className="h-8 w-8 text-muted-foreground" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
