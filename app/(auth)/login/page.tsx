'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
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
          .single()

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

      // Get user profile to determine role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const barbeariaSlug = searchParams.get('barbearia')?.trim().toLowerCase()

        if (barbeariaSlug) {
          const { data: vinculo } = await supabase
            .from('barbearia_users')
            .select(`
              barbearia:barbearias!inner(slug)
            `)
            .eq('user_id', user.id)
            .eq('barbearia.slug', barbeariaSlug)
            .limit(1)

          if (!vinculo || vinculo.length === 0) {
            setError('Seu usuário não pertence à barbearia da URL')
            await supabase.auth.signOut()
            return
          }
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        // Redirect based on role
        if (profile?.role === 'super_admin') {
          router.push('/super/dashboard')
        } else if (profile?.role === 'admin') {
          router.push('/admin/dashboard')
        } else if (profile?.role === 'barbeiro') {
          router.push('/barbeiro/agenda')
        } else {
          router.push('/cliente/home')
        }
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
            <Scissors className="h-7 w-7 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">BarberTool</h1>
          <p className="text-sm text-muted-foreground">Sistema de agendamentos</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Entrar</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar
            </CardDescription>
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
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Spinner className="mr-2" /> : null}
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

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
