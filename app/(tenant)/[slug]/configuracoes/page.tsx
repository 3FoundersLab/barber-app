'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Building2,
  Clock,
  CreditCard,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Store,
  Trash2,
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProfileAvatarUpload } from '@/components/shared/profile-avatar-upload'
import { createClient } from '@/lib/supabase/client'
import { signOutWithPersistenceClear } from '@/lib/supabase/sign-out-client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import {
  rpcCriarUnidadeBarbeariaTenant,
  rpcRemoverUnidadeBarbeariaTenant,
  rpcUpdateBarbeariaDadosTenant,
} from '@/lib/barbearia-rpc'
import { fetchLatestAssinaturaWithPlano, type AssinaturaComPlano } from '@/lib/tenant-assinatura-query'
import { clearProfileCache, setProfileCache } from '@/lib/profile-cache'
import { toUserFriendlyErrorMessage } from '@/lib/to-user-friendly-error'
import {
  deserializeBarbeariaEndereco,
  emptyBarbeariaEnderecoParts,
  serializeBarbeariaEndereco,
} from '@/lib/barbearia-endereco'
import { BarbeariaEnderecoFields } from '@/components/shared/barbearia-endereco-fields'
import { maskTelefoneBr } from '@/lib/format-contato'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { tenantBarbeariaBasePath } from '@/lib/routes'
import { slugifyBarbeariaSlug } from '@/lib/super-barbearia-form'
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
import { DIAS_SEMANA } from '@/lib/constants'
import {
  BARBEARIA_DIAS_FUNCIONAMENTO_PADRAO,
  diasFuncionamentoToFormFlags,
  formFlagsToDiasFuncionamento,
} from '@/lib/barbearia-dias-funcionamento'
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

/** PostgREST quando a coluna ainda não existe no banco (migração não aplicada). */
function isBarbeariaHorarioColumnError(err: { message?: string } | null): boolean {
  const m = err?.message ?? ''
  return (
    /horario_abertura|horario_fechamento/i.test(m) &&
    /column|schema cache|does not exist|PGRST204/i.test(m)
  )
}

function isBarbeariaDiasColumnError(err: { message?: string } | null): boolean {
  const m = err?.message ?? ''
  return (
    /dias_funcionamento/i.test(m) &&
    /column|schema cache|does not exist|PGRST204/i.test(m)
  )
}

const MSGS = {
  barbeariaUpdateBloqueado:
    'Não foi possível salvar os dados da barbearia. Só o administrador da barbearia pode alterá-los. Tente sair da conta e entrar de novo; se o problema continuar, entre em contato com o suporte.',
} as const

/** Query `?tab=` nas configurações: mantém aba após navegar entre unidades ou dar refresh. */
const CONFIG_TAB_QUERY = 'tab' as const
const CONFIG_TAB_BEARBEARIA = 'barbearia' as const

type ConfiguracoesTab = 'conta' | 'barbearia' | 'assinatura'

function configuracoesTabFromParam(raw: string | null): ConfiguracoesTab {
  if (raw === 'barbearia' || raw === 'assinatura') return raw
  return 'conta'
}

const profileAvatarUploadPremiumClass = cn(
  'space-y-3 border-t border-zinc-200/80 pt-5 dark:border-white/[0.06]',
  '[&_.text-muted-foreground]:text-muted-foreground [&_label]:text-foreground dark:[&_label]:text-zinc-300',
  '[&_button]:border-zinc-200 [&_button]:bg-zinc-50 [&_button]:text-foreground [&_button]:shadow-none [&_button]:transition-[background-color,border-color,box-shadow] [&_button]:duration-300',
  '[&_button:hover]:border-zinc-300 [&_button:hover]:bg-zinc-100',
  'dark:[&_button]:border-white/15 dark:[&_button]:bg-white/[0.06] dark:[&_button]:text-zinc-200',
  'dark:[&_button:hover]:border-white/22 dark:[&_button:hover]:bg-white/[0.1]',
)

/** Borda de validação nos inputs da página (mensagem continua no Alert no topo). */
const configuracoesInputErrorClass =
  'border-red-500/90 focus-visible:border-red-500 focus-visible:ring-red-500/25 dark:border-red-500/70'

/** Painel único: filiais + endereço + horário da unidade atual. */
const barbeariaPainelLocalClass = cn(
  'overflow-hidden rounded-xl border border-zinc-200/85 bg-white/75 shadow-sm',
  'dark:border-white/[0.1] dark:bg-white/[0.04]',
)

const barbeariaPainelSecaoClass = 'border-b border-zinc-200/70 px-5 py-5 last:border-b-0 md:px-6 dark:border-white/[0.08]'

const barbeariaPainelSecaoTituloClass =
  'flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground dark:text-zinc-100'

const barbeariaPainelSecaoDescClass =
  'mt-1.5 w-full min-w-0 text-pretty text-xs leading-relaxed text-muted-foreground'

type MinhaUnidade = { id: string; nome: string; slug: string }

function parseMinhasUnidadesFromBarbeariaUsers(
  rows: { barbearias?: MinhaUnidade | MinhaUnidade[] | null }[] | null,
): MinhaUnidade[] {
  const byId = new Map<string, MinhaUnidade>()
  for (const row of rows ?? []) {
    const raw = row.barbearias
    const b = Array.isArray(raw) ? raw[0] : raw
    if (b?.id && b.slug) {
      byId.set(b.id, { id: b.id, nome: b.nome?.trim() || b.slug, slug: b.slug })
    }
  }
  return [...byId.values()].sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }),
  )
}

export default function AdminConfiguracoesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const reduceMotion = useReducedMotion() === true
  const { slug, base } = useTenantAdminBase()
  const saveFeedbackAnchorRef = useRef<HTMLDivElement>(null)

  const scheduleScrollToSaveFeedback = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = saveFeedbackAnchorRef.current
        if (!el) return
        el.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start',
        })
      })
    })
  }, [reduceMotion])

  const activeConfiguracoesTab = configuracoesTabFromParam(searchParams.get(CONFIG_TAB_QUERY))

  const setConfiguracoesTabInUrl = useCallback(
    (next: ConfiguracoesTab) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next === 'conta') {
        params.delete(CONFIG_TAB_QUERY)
      } else {
        params.set(CONFIG_TAB_QUERY, next)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const [profile, setProfile] = useState<Profile | null>(null)
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [assinatura, setAssinatura] = useState<AssinaturaComPlano | null>(null)
  /** Falha ao ler `assinaturas` (RLS, rede) — distinto de “sem registro no banco”. */
  const [assinaturaFetchError, setAssinaturaFetchError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingBarbearia, setIsSavingBarbearia] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  /** Erros de preenchimento por campo (borda + texto abaixo do input). */
  const [fieldErrors, setFieldErrors] = useState<{
    contaNome?: string
    barbeariaNome?: string
    barbeariaHorario?: string
    barbeariaDias?: string
    barbeariaNovaUnidadeNome?: string
    barbeariaNovaUnidadeSlug?: string
  }>({})

  const clearFieldErrors = useCallback(() => {
    setFieldErrors({})
  }, [])

  const dismissError = useCallback(() => {
    setError(null)
    clearFieldErrors()
  }, [clearFieldErrors])

  const [nomePerfil, setNomePerfil] = useState('')
  const [telefonePerfil, setTelefonePerfil] = useState('')
  const [avatar, setAvatar] = useState('')

  const [formBarbearia, setFormBarbearia] = useState({
    nome: '',
    enderecoParts: emptyBarbeariaEnderecoParts(),
    horario_abertura: '',
    horario_fechamento: '',
    diasSemana: diasFuncionamentoToFormFlags([...BARBEARIA_DIAS_FUNCIONAMENTO_PADRAO]),
  })
  const [minhasUnidades, setMinhasUnidades] = useState<MinhaUnidade[]>([])
  const [novaUnidadeNome, setNovaUnidadeNome] = useState('')
  const [novaUnidadeSlug, setNovaUnidadeSlug] = useState('')
  const [novaUnidadeSlugAutofill, setNovaUnidadeSlugAutofill] = useState(true)
  const [isCreatingUnidade, setIsCreatingUnidade] = useState(false)
  const [unidadeRemoverDialog, setUnidadeRemoverDialog] = useState<MinhaUnidade | null>(null)
  const [isRemovingUnidade, setIsRemovingUnidade] = useState(false)

  const refreshMinhasUnidades = useCallback(async (userId: string): Promise<MinhaUnidade[]> => {
    const client = createClient()
    const { data: buRows } = await client
      .from('barbearia_users')
      .select('barbearias ( id, nome, slug )')
      .eq('user_id', userId)
    const list = parseMinhasUnidadesFromBarbeariaUsers(buRows)
    setMinhasUnidades(list)
    return list
  }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      setError(null)
      setSuccessMessage(null)
      setWarning(null)
      setAssinaturaFetchError(null)

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
        setError(toUserFriendlyErrorMessage(profileErr, { fallback: 'Não foi possível carregar o perfil' }))
        setIsLoading(false)
        return
      }

      if (profileData) {
        setProfile(profileData)
        setNomePerfil(profileData.nome || '')
        setTelefonePerfil(maskTelefoneBr(profileData.telefone || ''))
        setAvatar(profileData.avatar || '')
      }

      await refreshMinhasUnidades(user.id)

      let b: Barbearia | null = null

      const barbeariaIdResolved = await resolveAdminBarbeariaId(supabase, user.id, { slug })

      if (barbeariaIdResolved) {
        const { data: bDirect, error: bErr } = await supabase
          .from('barbearias')
          .select('*')
          .eq('id', barbeariaIdResolved)
          .maybeSingle()
        if (bErr) {
          setError(toUserFriendlyErrorMessage(bErr, { fallback: 'Não foi possível carregar a barbearia' }))
        } else {
          b = bDirect
        }
      }

      if (b) {
        setBarbearia(b)
        setFormBarbearia({
          nome: b.nome,
          enderecoParts: deserializeBarbeariaEndereco(b.endereco ?? null),
          horario_abertura: timeFromDb(b.horario_abertura),
          horario_fechamento: timeFromDb(b.horario_fechamento),
          diasSemana: diasFuncionamentoToFormFlags(b.dias_funcionamento ?? []),
        })

        const { assinatura: assinaturaData, error: assinaturaErr } = await fetchLatestAssinaturaWithPlano(
          supabase,
          b.id,
        )
        setAssinatura(assinaturaData)
        setAssinaturaFetchError(
          assinaturaErr
            ? toUserFriendlyErrorMessage(assinaturaErr, {
                fallback: 'Não foi possível carregar os dados da assinatura',
              })
            : null,
        )
      } else {
        setAssinatura(null)
        setAssinaturaFetchError(null)
      }

      setIsLoading(false)
    }

    void load()
  }, [slug, refreshMinhasUnidades])

  const handleSaveBarbearia = async () => {
    if (!barbearia) return

    setFieldErrors((prev) => {
      const { barbeariaNome, barbeariaHorario, barbeariaDias, ...rest } = prev
      return rest
    })

    const nomeBarbearia = formBarbearia.nome.trim()
    if (!nomeBarbearia) {
      setSuccessMessage(null)
      const msg = 'Informe o nome da barbearia.'
      setError(msg)
      setFieldErrors((prev) => ({ ...prev, barbeariaNome: msg }))
      scheduleScrollToSaveFeedback()
      return
    }

    const diasDb = formFlagsToDiasFuncionamento(formBarbearia.diasSemana)
    if (diasDb.length === 0) {
      setSuccessMessage(null)
      const msg = 'Marque pelo menos um dia de funcionamento.'
      setError(msg)
      setFieldErrors((prev) => ({ ...prev, barbeariaDias: msg }))
      scheduleScrollToSaveFeedback()
      return
    }

    const abre = formBarbearia.horario_abertura.trim()
    const fecha = formBarbearia.horario_fechamento.trim()
    if (abre && fecha && abre >= fecha) {
      setSuccessMessage(null)
      const msg = 'O horário de abertura deve ser anterior ao horário de fechamento.'
      setError(msg)
      setFieldErrors((prev) => ({ ...prev, barbeariaHorario: msg }))
      scheduleScrollToSaveFeedback()
      return
    }

    setIsSavingBarbearia(true)
    setError(null)
    setWarning(null)
    setSuccessMessage(null)
    clearFieldErrors()
    const supabase = createClient()

    const basePayload = {
      nome: nomeBarbearia,
      endereco: serializeBarbeariaEndereco(formBarbearia.enderecoParts),
      telefone: barbearia.telefone?.trim() || null,
      email: barbearia.email?.trim() ? barbearia.email.trim().toLowerCase() : null,
    }

    const withHorarios = {
      ...basePayload,
      horario_abertura: timeToDb(formBarbearia.horario_abertura),
      horario_fechamento: timeToDb(formBarbearia.horario_fechamento),
    }

    const withPayload = {
      ...withHorarios,
      dias_funcionamento: diasDb,
    }

    const rpc = await rpcUpdateBarbeariaDadosTenant(supabase, {
      p_barbearia_id: barbearia.id,
      p_nome: nomeBarbearia,
      p_endereco: basePayload.endereco,
      p_telefone: basePayload.telefone,
      p_email: basePayload.email,
      p_horario_abertura: withHorarios.horario_abertura,
      p_horario_fechamento: withHorarios.horario_fechamento,
      p_dias_funcionamento: diasDb,
    })

    if (rpc.row) {
      setBarbearia(rpc.row)
      setSuccessMessage('Dados da barbearia salvos com sucesso.')
      scheduleScrollToSaveFeedback()
      setIsSavingBarbearia(false)
      return
    }

    if (!rpc.missingFunction) {
      clearFieldErrors()
      setError(
        toUserFriendlyErrorMessage(rpc.error, { fallback: 'Não foi possível salvar os dados da barbearia.' }),
      )
      scheduleScrollToSaveFeedback()
      setIsSavingBarbearia(false)
      return
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from('barbearias')
      .update(withPayload)
      .eq('id', barbearia.id)
      .select('*')

    let updatedB = updatedRows?.[0] ?? null

    if (updateError && isBarbeariaDiasColumnError(updateError) && !isBarbeariaHorarioColumnError(updateError)) {
      const retryDias = await supabase
        .from('barbearias')
        .update(withHorarios)
        .eq('id', barbearia.id)
        .select('*')

      if (retryDias.error) {
        clearFieldErrors()
        setError(
          toUserFriendlyErrorMessage(retryDias.error, {
            fallback: 'Não foi possível salvar os dados da barbearia.',
          }),
        )
        scheduleScrollToSaveFeedback()
      } else if (!retryDias.data?.length) {
        clearFieldErrors()
        setError(MSGS.barbeariaUpdateBloqueado)
        scheduleScrollToSaveFeedback()
      } else {
        setBarbearia(retryDias.data[0])
        setSuccessMessage('Dados da barbearia salvos com sucesso.')
        setWarning(
          'Os dias de funcionamento não foram gravados: execute a migração `043_barbearias_dias_funcionamento.sql` (ou `20260411130000_barbearias_dias_funcionamento.sql`) no Supabase.',
        )
        scheduleScrollToSaveFeedback()
      }
      setIsSavingBarbearia(false)
      return
    }

    if (updateError && isBarbeariaHorarioColumnError(updateError)) {
      const retry = await supabase
        .from('barbearias')
        .update(basePayload)
        .eq('id', barbearia.id)
        .select('*')

      if (retry.error) {
        clearFieldErrors()
        setError(
          toUserFriendlyErrorMessage(retry.error, { fallback: 'Não foi possível salvar os dados da barbearia.' }),
        )
        scheduleScrollToSaveFeedback()
      } else if (!retry.data?.length) {
        clearFieldErrors()
        setError(MSGS.barbeariaUpdateBloqueado)
        scheduleScrollToSaveFeedback()
      } else {
        setBarbearia(retry.data[0])
        setSuccessMessage('Dados da barbearia salvos com sucesso.')
        setWarning(
          'Os horários de abertura/fechamento não foram gravados: o banco ainda não possui as colunas. Execute a migração `036_barbearias_horario_funcionamento.sql` (ou `20260410160000_barbearias_horario_funcionamento.sql`) no Supabase.',
        )
        scheduleScrollToSaveFeedback()
      }
    } else if (updateError) {
      clearFieldErrors()
      setError(
        (updateError as { code?: string }).code === 'PGRST116'
          ? MSGS.barbeariaUpdateBloqueado
          : toUserFriendlyErrorMessage(updateError, { fallback: 'Não foi possível salvar os dados da barbearia.' }),
      )
      scheduleScrollToSaveFeedback()
    } else if (!updatedB) {
      clearFieldErrors()
      setError(MSGS.barbeariaUpdateBloqueado)
      scheduleScrollToSaveFeedback()
    } else {
      setBarbearia(updatedB)
      setSuccessMessage('Dados da barbearia salvos com sucesso.')
      scheduleScrollToSaveFeedback()
    }

    setIsSavingBarbearia(false)
  }

  const podeGerenciarUnidades =
    profile?.role === 'admin' || profile?.role === 'super_admin'

  const podeOferecerRemoverUnidade =
    podeGerenciarUnidades &&
    (minhasUnidades.length >= 2 || profile?.role === 'super_admin')

  const handleCriarUnidade = async () => {
    if (!barbearia || !profile || !podeGerenciarUnidades) return

    setFieldErrors((prev) => {
      const { barbeariaNovaUnidadeNome, barbeariaNovaUnidadeSlug, ...rest } = prev
      return rest
    })

    const nome = novaUnidadeNome.trim()
    const slugRaw = novaUnidadeSlug.trim()
    const slugUnit = slugifyBarbeariaSlug(slugRaw)

    if (!nome) {
      setSuccessMessage(null)
      const msg = 'Informe o nome da nova unidade.'
      setError(msg)
      setFieldErrors((prev) => ({ ...prev, barbeariaNovaUnidadeNome: msg }))
      scheduleScrollToSaveFeedback()
      return
    }
    if (!slugUnit) {
      setSuccessMessage(null)
      const msg = 'Informe um identificador (slug) válido para a URL da unidade.'
      setError(msg)
      setFieldErrors((prev) => ({ ...prev, barbeariaNovaUnidadeSlug: msg }))
      scheduleScrollToSaveFeedback()
      return
    }

    setIsCreatingUnidade(true)
    setError(null)
    setWarning(null)
    setSuccessMessage(null)
    const supabase = createClient()

    const rpc = await rpcCriarUnidadeBarbeariaTenant(supabase, {
      p_barbearia_referencia_id: barbearia.id,
      p_nome: nome,
      p_slug: slugUnit,
    })

    if (rpc.row) {
      setNovaUnidadeNome('')
      setNovaUnidadeSlug('')
      setNovaUnidadeSlugAutofill(true)
      await refreshMinhasUnidades(profile.id)
      setSuccessMessage('Unidade criada com sucesso.')
      scheduleScrollToSaveFeedback()
      setIsCreatingUnidade(false)
      router.push(
        `${tenantBarbeariaBasePath(rpc.row.slug)}/configuracoes?${CONFIG_TAB_QUERY}=${CONFIG_TAB_BEARBEARIA}`,
      )
      return
    }

    if (rpc.missingFunction) {
      setWarning(
        'Não foi possível criar a unidade: a função no banco ainda não existe. Execute no Supabase o script `040_rpc_criar_unidade_barbearia_tenant.sql` (ou a migração `20260410210000_rpc_criar_unidade_barbearia_tenant.sql`).',
      )
      scheduleScrollToSaveFeedback()
      setIsCreatingUnidade(false)
      return
    }

    setError(
      toUserFriendlyErrorMessage(rpc.error, { fallback: 'Não foi possível criar a unidade. Tente de novo.' }),
    )
    scheduleScrollToSaveFeedback()
    setIsCreatingUnidade(false)
  }

  const handleConfirmRemoverUnidade = async () => {
    if (!unidadeRemoverDialog || !profile) return

    const alvo = unidadeRemoverDialog
    const nomeAlvo = alvo.nome
    const slugAlvo = alvo.slug
    const eraPainelAtual = slugAlvo === slug

    setIsRemovingUnidade(true)
    setError(null)
    setWarning(null)
    setSuccessMessage(null)
    const supabase = createClient()

    const rpc = await rpcRemoverUnidadeBarbeariaTenant(supabase, {
      p_barbearia_id: alvo.id,
    })

    if (rpc.missingFunction) {
      setUnidadeRemoverDialog(null)
      setWarning(
        'Não foi possível remover a unidade: a função no banco ainda não existe. Execute no Supabase o script `041_rpc_remover_unidade_barbearia_tenant.sql` (ou a migração `20260410230000_rpc_remover_unidade_barbearia_tenant.sql`).',
      )
      scheduleScrollToSaveFeedback()
      setIsRemovingUnidade(false)
      return
    }

    if (!rpc.ok) {
      setUnidadeRemoverDialog(null)
      const errCode = (rpc.error as { code?: string } | null)?.code
      const msgForeignKey =
        errCode === '23503'
          ? 'A exclusão foi bloqueada por restrições no banco (comandas/estoque). Execute no Supabase o script `042_comandas_fk_cascade_barbearia_delete.sql` ou a migração `20260410240000_comandas_fk_cascade_barbearia_delete.sql` e tente de novo.'
          : null
      setError(
        msgForeignKey ??
          toUserFriendlyErrorMessage(rpc.error, {
            fallback: 'Não foi possível remover a unidade. Tente de novo.',
          }),
      )
      scheduleScrollToSaveFeedback()
      setIsRemovingUnidade(false)
      return
    }

    setUnidadeRemoverDialog(null)
    const nextList = await refreshMinhasUnidades(profile.id)
    setSuccessMessage(`A unidade “${nomeAlvo}” foi removida.`)
    scheduleScrollToSaveFeedback()
    setIsRemovingUnidade(false)

    if (eraPainelAtual && nextList.length > 0) {
      router.push(
        `${tenantBarbeariaBasePath(nextList[0].slug)}/configuracoes?${CONFIG_TAB_QUERY}=${CONFIG_TAB_BEARBEARIA}`,
      )
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    setFieldErrors((prev) => {
      const { contaNome, ...rest } = prev
      return rest
    })

    const trimmedNome = nomePerfil.trim()
    if (!trimmedNome) {
      setSuccessMessage(null)
      const msg = 'Informe seu nome.'
      setError(msg)
      setFieldErrors((prev) => ({ ...prev, contaNome: msg }))
      scheduleScrollToSaveFeedback()
      return
    }

    setIsSavingProfile(true)
    setError(null)
    setWarning(null)
    setSuccessMessage(null)
    clearFieldErrors()
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
      clearFieldErrors()
      setError(
        updateError
          ? toUserFriendlyErrorMessage(updateError, { fallback: 'Não foi possível salvar os dados da conta.' })
          : 'Não foi possível salvar os dados da conta.',
      )
      scheduleScrollToSaveFeedback()
      setIsSavingProfile(false)
      return
    }

    setProfile(updated)
    setProfileCache(profile.id, updated)
    setSuccessMessage('Dados da conta salvos com sucesso.')
    scheduleScrollToSaveFeedback()
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
            <div className="min-w-0">
              <p className={landingEyebrow}>Painel da barbearia</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Configurações
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Sua conta, dados do negócio e assinatura. O email de login não é alterado aqui.
              </p>
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

                <div
                  ref={saveFeedbackAnchorRef}
                  className="scroll-mt-24 space-y-3 outline-none md:scroll-mt-28"
                  aria-live="polite"
                  aria-relevant="additions text"
                >
                  {error ? (
                    <Alert
                      variant="danger"
                      onClose={dismissError}
                      autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
                      className={superProfileDangerAlertClass}
                    >
                      <AlertTitle>{error}</AlertTitle>
                    </Alert>
                  ) : null}

                  {successMessage ? (
                    <Alert
                      variant="success"
                      className="text-left"
                      onClose={() => setSuccessMessage(null)}
                      autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
                    >
                      <AlertTitle>{successMessage}</AlertTitle>
                    </Alert>
                  ) : null}

                  {warning ? (
                    <Alert
                      variant="warning"
                      className="text-left"
                      onClose={() => setWarning(null)}
                      autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
                    >
                      <AlertTitle>Aviso</AlertTitle>
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ) : null}
                </div>

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

                <Tabs
                  value={activeConfiguracoesTab}
                  onValueChange={(v) => setConfiguracoesTabInUrl(configuracoesTabFromParam(v))}
                  className="w-full gap-5"
                >
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
                          <Label htmlFor="nomePerfil" className={superProfileLabelClass} required>
                            Nome
                          </Label>
                          <Input
                            id="nomePerfil"
                            value={nomePerfil}
                            onChange={(e) => {
                              setNomePerfil(e.target.value)
                              setFieldErrors((prev) => {
                                if (!prev.contaNome) return prev
                                const { contaNome: _removed, ...rest } = prev
                                return rest
                              })
                            }}
                            placeholder="Nome de exibição"
                            autoComplete="name"
                            aria-invalid={fieldErrors.contaNome ? true : undefined}
                            aria-describedby={fieldErrors.contaNome ? 'nomePerfil-error' : undefined}
                            aria-required="true"
                            className={cn(
                              superProfileInputClass,
                              fieldErrors.contaNome ? configuracoesInputErrorClass : null,
                            )}
                          />
                          {fieldErrors.contaNome ? (
                            <p id="nomePerfil-error" className="text-sm text-destructive" role="alert">
                              {fieldErrors.contaNome}
                            </p>
                          ) : null}
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
                          Nome, URL, filiais, endereço e horário da unidade que você está gerenciando agora.
                        </p>
                      </header>

                      <div className="space-y-5 p-5 md:p-6">
                        {barbearia ? (
                          <>
                            <div className={barbeariaPainelLocalClass} role="region" aria-label="Dados da unidade">
                              <div className="border-b border-zinc-200/75 bg-zinc-50/90 px-5 py-4 md:px-6 dark:border-white/[0.08] dark:bg-white/[0.03]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                                  Unidade atual
                                </p>
                                <p className="mt-2 text-sm font-medium leading-snug text-foreground">
                                  Nome, URL, filiais, endereço e horário
                                </p>
                                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                  Tudo neste quadro é desta unidade. Uma filial nova ganha painel próprio — você preenche
                                  endereço e horário ao acessar essa unidade. A assinatura da nova filial segue o plano e
                                  o status desta.
                                </p>
                              </div>

                              <div className={barbeariaPainelSecaoClass}>
                                <div className={barbeariaPainelSecaoTituloClass}>
                                  <Store className="size-4 shrink-0 text-primary" aria-hidden />
                                  Nome e identificador
                                </div>
                                <p className={barbeariaPainelSecaoDescClass}>
                                  Nome exibido no painel e o slug fixo da URL desta unidade (o identificador não pode ser
                                  alterado aqui).
                                </p>
                                <div className="mt-4 space-y-4">
                                  <div className="min-w-0 space-y-2">
                                    <Label htmlFor="nomeBarbearia" className={superProfileLabelClass} required>
                                      Nome da barbearia
                                    </Label>
                                    <Input
                                      id="nomeBarbearia"
                                      value={formBarbearia.nome}
                                      onChange={(e) => {
                                        setFormBarbearia({ ...formBarbearia, nome: e.target.value })
                                        setFieldErrors((prev) => {
                                          if (!prev.barbeariaNome) return prev
                                          const { barbeariaNome: _removed, ...rest } = prev
                                          return rest
                                        })
                                      }}
                                      placeholder="Nome da barbearia"
                                      aria-required="true"
                                      aria-invalid={fieldErrors.barbeariaNome ? true : undefined}
                                      aria-describedby={fieldErrors.barbeariaNome ? 'nomeBarbearia-error' : undefined}
                                      className={cn(
                                        superProfileInputClass,
                                        fieldErrors.barbeariaNome ? configuracoesInputErrorClass : null,
                                      )}
                                    />
                                    {fieldErrors.barbeariaNome ? (
                                      <p id="nomeBarbearia-error" className="text-sm text-destructive" role="alert">
                                        {fieldErrors.barbeariaNome}
                                      </p>
                                    ) : null}
                                  </div>
                                  <div className="min-w-0 space-y-2">
                                    <Label htmlFor="slug" className={superProfileLabelClass}>
                                      Identificador na URL (slug)
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
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                      Caminho base do painel:{' '}
                                      <span className="font-mono text-foreground/90">
                                        {tenantBarbeariaBasePath(barbearia.slug)}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className={barbeariaPainelSecaoClass}>
                                <Accordion type="single" collapsible className="w-full">
                                  <AccordionItem value="cfg-barbearia-filiais" className="border-0">
                                    <AccordionTrigger
                                      className={cn(
                                        barbeariaPainelSecaoTituloClass,
                                        'py-0 hover:no-underline [&[data-state=open]]:pb-2',
                                      )}
                                    >
                                      <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                                        <Building2 className="size-4 shrink-0 text-primary" aria-hidden />
                                        Filiais e acesso
                                      </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-0">
                                      <p className={barbeariaPainelSecaoDescClass}>
                                        Cada filial tem URL própria. Use{' '}
                                        <span className="font-medium text-foreground">Acessar</span> para abrir o painel
                                        noutra unidade (continua na aba Barbearia).
                                        {podeOferecerRemoverUnidade ? (
                                          <>
                                            {' '}
                                            O botão{' '}
                                            <span className="font-medium text-destructive dark:text-red-400">
                                              Remover
                                            </span>{' '}
                                            exclui
                                            a filial e todos os dados vinculados a ela — ação{' '}
                                            <span className="font-medium text-foreground">irreversível</span>.
                                          </>
                                        ) : null}
                                      </p>
                                      {minhasUnidades.length > 0 ? (
                                        <ul className="mt-4 space-y-2">
                                          {minhasUnidades.map((u) => {
                                            const isCurrent = u.slug === slug
                                            return (
                                              <li
                                                key={u.id}
                                                className="flex flex-col gap-3 rounded-lg border border-zinc-200/80 bg-white/90 px-3 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.1] dark:bg-white/[0.06]"
                                              >
                                                <div className="min-w-0 flex-1">
                                                  <p className="truncate text-sm font-medium text-foreground">
                                                    {u.nome}
                                                  </p>
                                                  <p className="truncate font-mono text-xs text-muted-foreground">
                                                    /{u.slug}
                                                  </p>
                                                </div>
                                                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                                                  {isCurrent ? (
                                                    <span className="rounded-full bg-primary/12 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                                                      Painel atual
                                                    </span>
                                                  ) : (
                                                    <Button variant="outline" size="sm" asChild>
                                                      <Link
                                                        href={`${tenantBarbeariaBasePath(u.slug)}/configuracoes?${CONFIG_TAB_QUERY}=${CONFIG_TAB_BEARBEARIA}`}
                                                      >
                                                        Acessar
                                                      </Link>
                                                    </Button>
                                                  )}
                                                  {podeOferecerRemoverUnidade ? (
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      className={cn(
                                                        'border-destructive/35 text-destructive hover:bg-destructive/10',
                                                        'dark:border-red-400/45 dark:text-red-400 dark:hover:border-red-400/70 dark:hover:bg-red-500/15 dark:hover:text-red-300',
                                                      )}
                                                      aria-label={`Remover unidade ${u.nome}`}
                                                      disabled={isRemovingUnidade || Boolean(unidadeRemoverDialog)}
                                                      onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        setUnidadeRemoverDialog(u)
                                                      }}
                                                    >
                                                      <Trash2 className="size-4 sm:mr-1.5" aria-hidden />
                                                      <span className="hidden sm:inline">Remover</span>
                                                    </Button>
                                                  ) : null}
                                                </div>
                                              </li>
                                            )
                                          })}
                                        </ul>
                                      ) : null}
                                      {podeGerenciarUnidades &&
                                      minhasUnidades.length === 1 &&
                                      profile?.role !== 'super_admin' ? (
                                        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                                          Com apenas uma filial, não é possível excluí-la aqui. Cadastre outra unidade
                                          antes ou fale com o suporte.
                                        </p>
                                      ) : null}

                                      {podeGerenciarUnidades ? (
                                        <div
                                          className={cn(
                                            'mt-5 rounded-xl border border-dashed border-primary/25 bg-primary/[0.04] p-4',
                                            'dark:border-primary/30 dark:bg-primary/[0.07]',
                                          )}
                                        >
                                          <p className="text-sm font-semibold text-foreground dark:text-zinc-100">
                                            Cadastrar nova unidade
                                          </p>
                                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            Nome e identificador da URL. Depois de criar, complete endereço e horário
                                            nesta mesma aba já no painel da nova filial.
                                          </p>
                                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2 sm:col-span-1">
                                              <Label htmlFor="novaUnidadeNome" className={superProfileLabelClass}>
                                                Nome da unidade
                                              </Label>
                                              <Input
                                                id="novaUnidadeNome"
                                                value={novaUnidadeNome}
                                                onChange={(e) => {
                                                  const v = e.target.value
                                                  setNovaUnidadeNome(v)
                                                  if (novaUnidadeSlugAutofill) {
                                                    setNovaUnidadeSlug(slugifyBarbeariaSlug(v))
                                                  }
                                                  setFieldErrors((prev) => {
                                                    if (!prev.barbeariaNovaUnidadeNome) return prev
                                                    const { barbeariaNovaUnidadeNome: _r, ...rest } = prev
                                                    return rest
                                                  })
                                                }}
                                                placeholder="Ex.: Filial Centro"
                                                disabled={isCreatingUnidade}
                                                aria-invalid={fieldErrors.barbeariaNovaUnidadeNome ? true : undefined}
                                                aria-describedby={
                                                  fieldErrors.barbeariaNovaUnidadeNome
                                                    ? 'novaUnidadeNome-error'
                                                    : undefined
                                                }
                                                className={cn(
                                                  superProfileInputClass,
                                                  fieldErrors.barbeariaNovaUnidadeNome
                                                    ? configuracoesInputErrorClass
                                                    : null,
                                                )}
                                              />
                                              {fieldErrors.barbeariaNovaUnidadeNome ? (
                                                <p
                                                  id="novaUnidadeNome-error"
                                                  className="text-sm text-destructive"
                                                  role="alert"
                                                >
                                                  {fieldErrors.barbeariaNovaUnidadeNome}
                                                </p>
                                              ) : null}
                                            </div>
                                            <div className="space-y-2 sm:col-span-1">
                                              <Label htmlFor="novaUnidadeSlug" className={superProfileLabelClass}>
                                                Identificador na URL (slug)
                                              </Label>
                                              <Input
                                                id="novaUnidadeSlug"
                                                value={novaUnidadeSlug}
                                                onChange={(e) => {
                                                  setNovaUnidadeSlugAutofill(false)
                                                  setNovaUnidadeSlug(e.target.value)
                                                  setFieldErrors((prev) => {
                                                    if (!prev.barbeariaNovaUnidadeSlug) return prev
                                                    const { barbeariaNovaUnidadeSlug: _r, ...rest } = prev
                                                    return rest
                                                  })
                                                }}
                                                placeholder="ex.: filial-centro"
                                                disabled={isCreatingUnidade}
                                                className={cn(
                                                  superProfileInputClass,
                                                  'font-mono text-sm',
                                                  fieldErrors.barbeariaNovaUnidadeSlug
                                                    ? configuracoesInputErrorClass
                                                    : null,
                                                )}
                                                aria-invalid={
                                                  fieldErrors.barbeariaNovaUnidadeSlug ? true : undefined
                                                }
                                                aria-describedby={
                                                  fieldErrors.barbeariaNovaUnidadeSlug
                                                    ? 'novaUnidadeSlug-error'
                                                    : undefined
                                                }
                                                autoComplete="off"
                                              />
                                              {fieldErrors.barbeariaNovaUnidadeSlug ? (
                                                <p
                                                  id="novaUnidadeSlug-error"
                                                  className="text-sm text-destructive"
                                                  role="alert"
                                                >
                                                  {fieldErrors.barbeariaNovaUnidadeSlug}
                                                </p>
                                              ) : null}
                                            </div>
                                          </div>
                                          <Button
                                            type="button"
                                            className={cn(
                                              landingPrimaryCtaClass,
                                              'mt-4 h-11 w-full sm:w-auto sm:min-w-[12rem]',
                                            )}
                                            onClick={() => void handleCriarUnidade()}
                                            disabled={isCreatingUnidade}
                                          >
                                            {isCreatingUnidade ? (
                                              <Spinner className="mr-2 h-4 w-4" />
                                            ) : (
                                              <Plus className="mr-2 h-4 w-4" aria-hidden />
                                            )}
                                            Criar unidade
                                          </Button>
                                        </div>
                                      ) : null}
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>

                              <div className={barbeariaPainelSecaoClass}>
                                <Accordion type="single" collapsible className="w-full">
                                  <AccordionItem value="cfg-barbearia-endereco" className="border-0">
                                    <AccordionTrigger
                                      className={cn(
                                        barbeariaPainelSecaoTituloClass,
                                        'py-0 hover:no-underline [&[data-state=open]]:pb-2',
                                      )}
                                    >
                                      <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                                        <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                                        Endereço
                                      </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-0">
                                      <p className={barbeariaPainelSecaoDescClass}>
                                        Localização desta unidade para referência no painel e cadastros.
                                      </p>
                                      <div className="mt-4">
                                        <BarbeariaEnderecoFields
                                          idPrefix="cfg-barbearia"
                                          value={formBarbearia.enderecoParts}
                                          onChange={(enderecoParts) =>
                                            setFormBarbearia((prev) => ({ ...prev, enderecoParts }))
                                          }
                                          disabled={isSavingBarbearia}
                                          showHeading={false}
                                          inputClassName={superProfileInputClass}
                                          labelClassName={cn(
                                            superProfileLabelClass,
                                            'flex items-center gap-1.5',
                                          )}
                                        />
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>

                              <div className={barbeariaPainelSecaoClass} role="group" aria-labelledby="cfg-horario-funcionamento-label">
                                <p id="cfg-horario-funcionamento-label" className={barbeariaPainelSecaoTituloClass}>
                                  <Clock className="size-4 shrink-0 text-primary" aria-hidden />
                                  Horário de funcionamento
                                </p>
                                <p className={barbeariaPainelSecaoDescClass}>
                                  Opcional. Referência geral da unidade; não substitui os horários individuais da equipe.
                                </p>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="horarioAbertura" className={superProfileLabelClass}>
                                      Abre às
                                    </Label>
                                    <Input
                                      id="horarioAbertura"
                                      type="time"
                                      value={formBarbearia.horario_abertura}
                                      onChange={(e) => {
                                        setFormBarbearia((prev) => ({
                                          ...prev,
                                          horario_abertura: e.target.value,
                                        }))
                                        setFieldErrors((prev) => {
                                          if (!prev.barbeariaHorario) return prev
                                          const { barbeariaHorario: _removed, ...rest } = prev
                                          return rest
                                        })
                                      }}
                                      disabled={isSavingBarbearia}
                                      aria-invalid={fieldErrors.barbeariaHorario ? true : undefined}
                                      aria-describedby={
                                        fieldErrors.barbeariaHorario ? 'cfg-horario-funcionamento-error' : undefined
                                      }
                                      className={cn(
                                        superProfileInputClass,
                                        fieldErrors.barbeariaHorario ? configuracoesInputErrorClass : null,
                                      )}
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
                                      onChange={(e) => {
                                        setFormBarbearia((prev) => ({
                                          ...prev,
                                          horario_fechamento: e.target.value,
                                        }))
                                        setFieldErrors((prev) => {
                                          if (!prev.barbeariaHorario) return prev
                                          const { barbeariaHorario: _removed, ...rest } = prev
                                          return rest
                                        })
                                      }}
                                      disabled={isSavingBarbearia}
                                      aria-invalid={fieldErrors.barbeariaHorario ? true : undefined}
                                      aria-describedby={
                                        fieldErrors.barbeariaHorario ? 'cfg-horario-funcionamento-error' : undefined
                                      }
                                      className={cn(
                                        superProfileInputClass,
                                        fieldErrors.barbeariaHorario ? configuracoesInputErrorClass : null,
                                      )}
                                    />
                                  </div>
                                </div>
                                <div className="mt-6 space-y-3">
                                  <Label className={superProfileLabelClass}>Dias com atendimento</Label>
                                  <p className={barbeariaPainelSecaoDescClass}>
                                    Usados no agendamento do cliente e indicados na agenda. Domingo a sábado (como no
                                    calendário do celular).
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                                    {DIAS_SEMANA.map((nome, i) => (
                                      <div
                                        key={nome}
                                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-2"
                                      >
                                        <span className="text-xs font-medium leading-tight text-foreground">
                                          {nome.replace('-feira', '').slice(0, 3)}
                                        </span>
                                        <Switch
                                          checked={formBarbearia.diasSemana[i] ?? false}
                                          onCheckedChange={(v) => {
                                            setFormBarbearia((prev) => {
                                              const next = [...prev.diasSemana]
                                              next[i] = v
                                              return { ...prev, diasSemana: next }
                                            })
                                            setFieldErrors((prev) => {
                                              if (!prev.barbeariaDias) return prev
                                              const { barbeariaDias: _r, ...rest } = prev
                                              return rest
                                            })
                                          }}
                                          disabled={isSavingBarbearia}
                                          aria-label={`${nome} — ${formBarbearia.diasSemana[i] ? 'abre' : 'fechado'}`}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  {fieldErrors.barbeariaDias ? (
                                    <p className="text-sm text-destructive" role="alert">
                                      {fieldErrors.barbeariaDias}
                                    </p>
                                  ) : null}
                                </div>
                                {fieldErrors.barbeariaHorario ? (
                                  <p
                                    id="cfg-horario-funcionamento-error"
                                    className="mt-3 text-sm text-destructive"
                                    role="alert"
                                  >
                                    {fieldErrors.barbeariaHorario}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            Quando o cadastro estiver sincronizado, o nome e demais dados da barbearia aparecerão aqui
                            para edição.
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
                    {assinaturaFetchError ? (
                      <Alert variant="danger" className="text-left">
                        <AlertTitle>Não foi possível carregar a assinatura</AlertTitle>
                        <AlertDescription>{assinaturaFetchError}</AlertDescription>
                      </Alert>
                    ) : null}

                    {assinatura ? (
                      <TenantAssinaturaSummary assinatura={assinatura} variant="premium" />
                    ) : !assinaturaFetchError && barbearia ? (
                      <section className={cn(superProfileGlassCardClass, 'overflow-hidden')}>
                        <header className="border-b border-zinc-200/80 px-5 py-4 dark:border-white/[0.06] md:px-6">
                          <div className="flex items-center gap-2 text-foreground">
                            <CreditCard className="size-4 text-primary opacity-90" aria-hidden />
                            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Plano contratado
                            </h2>
                          </div>
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            Ainda não há registro de assinatura vinculado a esta barbearia no sistema.
                          </p>
                        </header>
                        <div className="space-y-3 p-5 text-sm leading-relaxed text-muted-foreground md:p-6">
                          <p>
                            Quem gerencia a plataforma cadastra o plano e confirma o pagamento na área{' '}
                            <span className="font-medium text-foreground">Assinaturas</span>. Depois disso, o nome do
                            plano, início, validade e valores aparecem aqui automaticamente.
                          </p>
                          <p className="text-xs">
                            Ambiente de demonstração: se você usa o seed da Barbearia Modelo sem passar pelo fluxo de
                            cobrança, execute o script{' '}
                            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
                              scripts/038_demo_barbearia_modelo_assinatura.sql
                            </code>{' '}
                            no SQL Editor para criar um plano e uma assinatura de exemplo.
                          </p>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                            <Link href={`${base}/assinatura`}>Abrir página Assinatura</Link>
                          </Button>
                        </div>
                      </section>
                    ) : null}

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

                <AlertDialog
                  open={Boolean(unidadeRemoverDialog)}
                  onOpenChange={(open) => {
                    if (!open && !isRemovingUnidade) {
                      setUnidadeRemoverDialog(null)
                    }
                  }}
                >
                  <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover esta unidade?</AlertDialogTitle>
                      <AlertDialogDescription className="text-left">
                        {unidadeRemoverDialog
                          ? `A unidade “${unidadeRemoverDialog.nome}” (/${unidadeRemoverDialog.slug}) será excluída com todos os dados associados (serviços, equipe, clientes, agendamentos, assinatura, estoque etc.). Esta ação não pode ser desfeita.${
                              unidadeRemoverDialog.slug === slug
                                ? ' Você está no painel desta unidade; após remover, você será levado para outra filial da lista.'
                                : ''
                            }`
                          : ''}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel type="button" disabled={isRemovingUnidade}>
                        Cancelar
                      </AlertDialogCancel>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={isRemovingUnidade}
                        onClick={() => void handleConfirmRemoverUnidade()}
                      >
                        {isRemovingUnidade ? <Spinner className="mr-2 h-4 w-4" /> : null}
                        Sim, remover
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </motion.div>
        </div>
      </PageContent>
    </TenantPanelPageContainer>
  )
}
