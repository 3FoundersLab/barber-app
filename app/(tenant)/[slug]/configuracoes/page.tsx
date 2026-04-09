'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Check,
  CreditCard,
  LogOut,
  Mail,
  Phone,
  Save,
  Store,
  User,
} from 'lucide-react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  ALERT_DEFAULT_AUTO_CLOSE_MS,
} from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { AdminConfiguracoesPageSkeleton } from '@/components/shared/loading-skeleton'
import { Separator } from '@/components/ui/separator'
import { ProfileAvatarUpload } from '@/components/shared/profile-avatar-upload'
import { createClient } from '@/lib/supabase/client'
import { signOutWithPersistenceClear } from '@/lib/supabase/sign-out-client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { tenantBarbeariaBasePath } from '@/lib/routes'
import { clearProfileCache, setProfileCache } from '@/lib/profile-cache'
import {
  deserializeBarbeariaEndereco,
  emptyBarbeariaEnderecoParts,
  serializeBarbeariaEndereco,
} from '@/lib/barbearia-endereco'
import { BarbeariaEnderecoFields } from '@/components/shared/barbearia-endereco-fields'
import { formatCurrency } from '@/lib/constants'
import { maskTelefoneBr, normalizeEmailInput } from '@/lib/format-contato'
import { linhasBeneficiosPlano } from '@/lib/plano-beneficios'
import {
  labelPeriodicidade,
  mesesPorPeriodicidade,
  parsePlanoPeriodicidade,
  precoTotalNoPeriodo,
  sufixoPrecoPeriodicidade,
} from '@/lib/plano-periodicidade'
import type { Assinatura, Barbearia, Plano, Profile } from '@/types'

function labelAssinaturaStatus(status: string) {
  const map: Record<string, string> = {
    pendente: 'Pagamento pendente',
    ativa: 'Ativa',
    inadimplente: 'Inadimplente',
    cancelada: 'Cancelada',
  }
  return map[status] ?? status
}

export default function AdminConfiguracoesPage() {
  const router = useRouter()
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const base = slug ? tenantBarbeariaBasePath(slug) : '/painel'

  const [profile, setProfile] = useState<Profile | null>(null)
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [assinatura, setAssinatura] = useState<(Assinatura & { plano?: Plano | null }) | null>(null)
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
        })

        const { data: assinaturaData } = await supabase
          .from('assinaturas')
          .select('*, plano:planos(*)')
          .eq('barbearia_id', b.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        setAssinatura(assinaturaData as (Assinatura & { plano?: Plano | null }) | null)
      }

      setIsLoading(false)
    }

    void load()
  }, [slug])

  const handleSaveBarbearia = async () => {
    if (!barbearia) return

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

  if (isLoading) {
    return (
      <PageContainer>
        <AppPageHeader title="Configurações" profileHref={`${base}/configuracoes`} avatarFallback="A" />
        <PageContent className="space-y-6">
          <AdminConfiguracoesPageSkeleton />
        </PageContent>
      </PageContainer>
    )
  }

  const pagamentoPendente =
    barbearia?.status_cadastro === 'pagamento_pendente' || assinatura?.status === 'pendente'

  const showAguardandoPagamento =
    pagamentoPendente || (profile?.role === 'admin' && !barbearia && !error)

  return (
    <PageContainer>
      <AppPageHeader
        title="Configurações"
        profileHref={`${base}/configuracoes`}
        profile={profile}
        avatarFallback="A"
      />

      <PageContent className="space-y-6">
        {showAguardandoPagamento && (
          <Alert variant="warning" className="text-left">
            <AlertTitle>Aguardando confirmação de pagamento</AlertTitle>
            <AlertDescription>
              Sua barbearia está com status de pagamento pendente (cadastro novo ou renovação após a data de expiração
              do plano) até o administrador da plataforma confirmar o pagamento na área de assinaturas. Até lá, apenas
              esta página de configurações fica disponível no painel.
            </AlertDescription>
          </Alert>
        )}

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
              Sua conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomePerfil">Nome</Label>
              <Input
                id="nomePerfil"
                value={nomePerfil}
                onChange={(e) => setNomePerfil(e.target.value)}
                placeholder="Nome de exibição"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailPerfil" className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                Email de acesso
              </Label>
              <Input id="emailPerfil" value={profile?.email || ''} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefonePerfil" className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                Telefone
              </Label>
              <Input
                id="telefonePerfil"
                value={telefonePerfil}
                onChange={(e) => setTelefonePerfil(maskTelefoneBr(e.target.value))}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>

            {profile?.id ? (
              <ProfileAvatarUpload
                userId={profile.id}
                avatarUrl={avatar}
                onAvatarUrlChange={setAvatar}
                fallbackLetter={nomePerfil.trim().charAt(0).toUpperCase() || 'A'}
                disabled={isSavingProfile}
                onError={setError}
              />
            ) : null}

            <Button className="w-full" onClick={handleSaveProfile} disabled={isSavingProfile || !profile}>
              {isSavingProfile ? <Spinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
              {isSavingProfile ? 'Salvando...' : 'Salvar dados da conta'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-5 w-5" />
              Dados da barbearia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {barbearia ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="slug">Identificador (slug)</Label>
                  <Input id="slug" value={barbearia.slug} readOnly disabled className="bg-muted font-mono text-sm" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomeBarbearia" required>
                    Nome da barbearia
                  </Label>
                  <Input
                    id="nomeBarbearia"
                    value={formBarbearia.nome}
                    onChange={(e) => setFormBarbearia({ ...formBarbearia, nome: e.target.value })}
                    placeholder="Nome da barbearia"
                    aria-required="true"
                  />
                </div>

                <BarbeariaEnderecoFields
                  idPrefix="cfg-barbearia"
                  value={formBarbearia.enderecoParts}
                  onChange={(enderecoParts) =>
                    setFormBarbearia((prev) => ({ ...prev, enderecoParts }))
                  }
                  disabled={isSavingBarbearia}
                />

                <div className="space-y-2">
                  <Label htmlFor="telefoneBarbearia" className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailBarbearia" className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
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
                  />
                </div>

                <Button className="w-full" onClick={handleSaveBarbearia} disabled={isSavingBarbearia}>
                  {isSavingBarbearia ? <Spinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSavingBarbearia ? 'Salvando...' : 'Salvar dados da barbearia'}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Quando o cadastro estiver sincronizado, o nome, telefone e demais dados da barbearia aparecerão aqui para
                edição.
              </p>
            )}
          </CardContent>
        </Card>

        {assinatura && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5" />
                Plano contratado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{assinatura.plano?.nome ?? 'Plano'}</span>
                <Badge variant={assinatura.status === 'ativa' ? 'default' : 'secondary'}>
                  {labelAssinaturaStatus(assinatura.status)}
                </Badge>
              </div>
              {assinatura.plano != null && (() => {
                const per = parsePlanoPeriodicidade(assinatura.periodicidade)
                return (
                <>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {formatCurrency(precoTotalNoPeriodo(assinatura.plano.preco_mensal, per))}
                      {sufixoPrecoPeriodicidade(per)}
                    </span>
                    <span className="mt-0.5 block text-xs">
                      Ciclo: {labelPeriodicidade(per)}
                      {per !== 'mensal'
                        ? ` · base ${formatCurrency(assinatura.plano.preco_mensal)}/mês × ${mesesPorPeriodicidade(per)}`
                        : null}
                    </span>
                  </p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    {linhasBeneficiosPlano(assinatura.plano).length === 0 ? (
                      <li className="list-none text-xs">Nenhum benefício listado para este plano.</li>
                    ) : (
                      linhasBeneficiosPlano(assinatura.plano).map((linha, idx) => (
                        <li key={`${assinatura.plano!.id}-${idx}`} className="flex items-start gap-2 text-xs">
                          <Check
                            className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                            strokeWidth={2.5}
                            aria-hidden
                          />
                          <span>{linha}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </>
                )
              })()}
            </CardContent>
          </Card>
        )}

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair da conta
            </Button>
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  )
}
