'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { PageContent } from '@/components/shared/page-container'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { cn } from '@/lib/utils'
import { type TenantAdminMenuKey } from '@/lib/tenant-admin-nav'
import {
  DEFAULT_EQUIPE_MENU_ACCESS,
  type EquipeMenuPermissionsJson,
  mergeEquipeMenuPermissions,
  menuSectionsForMatrix,
  sanitizeEquipeMenuPermissionsForSave,
} from '@/lib/tenant-menu-permissions'

type CustomRoleKey = 'moderador' | 'barbeiro_lider'
const ROLE_LABEL: Record<CustomRoleKey, string> = {
  moderador: 'Moderador',
  barbeiro_lider: 'Barbeiro Líder',
}

const MENU_PERMISSION_HELP_TEXT: Partial<Record<TenantAdminMenuKey, string>> = {
  dashboard: 'Visualizar indicadores e status geral da barbearia.',
  clientes: 'Acessar e manter os dados da base de clientes.',
  agendamentos: 'Gerenciar agenda, horários e reservas.',
  comandas: 'Criar e acompanhar comandas de atendimento.',
  servicos: 'Cadastrar e ajustar serviços oferecidos.',
  planos: 'Configurar planos e benefícios para clientes.',
  financeiro: 'Consultar movimentações e resultados financeiros.',
  relatorios: 'Analisar métricas e relatórios operacionais.',
  estoque: 'Controlar produtos e itens de estoque.',
  assinatura: 'Visualizar e gerenciar assinatura da unidade.',
  equipe: 'Gerenciar membros, funções e vínculo da equipe.',
  configuracoes: 'Ajustar configurações da barbearia e do sistema.',
}

function snapshotPermissions(
  state: Record<CustomRoleKey, Record<TenantAdminMenuKey, boolean>>,
): string {
  return JSON.stringify(sanitizeEquipeMenuPermissionsForSave(state))
}

export function TenantGestaoPermissoes() {
  const { slug, base } = useTenantAdminBase()
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [customAccess, setCustomAccess] = useState<Record<
    CustomRoleKey,
    Record<TenantAdminMenuKey, boolean>
  > | null>(null)
  const [baselineSnapshot, setBaselineSnapshot] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmRestoreRole, setConfirmRestoreRole] = useState<CustomRoleKey | null>(null)

  const matrixSections = useMemo(() => menuSectionsForMatrix(), [])

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Usuário não autenticado')
      setCustomAccess(null)
      setIsLoading(false)
      return
    }
    const bid = await resolveAdminBarbeariaId(supabase, user.id, { slug })
    if (!bid) {
      setError('Barbearia não encontrada para este usuário')
      setCustomAccess(null)
      setIsLoading(false)
      return
    }
    setBarbeariaId(bid)
    const { data, error: qErr } = await supabase
      .from('barbearias')
      .select('equipe_menu_permissions')
      .eq('id', bid)
      .single()
    if (qErr || !data) {
      setError('Não foi possível carregar as permissões')
      setCustomAccess(null)
      setIsLoading(false)
      return
    }
    const merged = mergeEquipeMenuPermissions(
      data.equipe_menu_permissions as EquipeMenuPermissionsJson | null | undefined,
    )
    setCustomAccess(merged)
    setBaselineSnapshot(snapshotPermissions(merged))
    setIsLoading(false)
  }, [slug])

  useEffect(() => {
    void load()
  }, [load])

  const dirty =
    customAccess != null &&
    baselineSnapshot != null &&
    snapshotPermissions(customAccess) !== baselineSnapshot

  const setMenu = (role: CustomRoleKey, key: TenantAdminMenuKey, value: boolean) => {
    setCustomAccess((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [role]: { ...prev[role], [key]: value },
      }
    })
  }

  const restoreRoleDefaults = (role: CustomRoleKey) => {
    setCustomAccess((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [role]: {
          ...prev[role],
          ...DEFAULT_EQUIPE_MENU_ACCESS[role],
        },
      }
    })
  }

  const handleSave = async () => {
    if (!barbeariaId || !customAccess) return
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    const supabase = createClient()
    const payload = sanitizeEquipeMenuPermissionsForSave(customAccess)
    const { error: upErr } = await supabase
      .from('barbearias')
      .update({ equipe_menu_permissions: payload })
      .eq('id', barbeariaId)
    setIsSaving(false)
    if (upErr) {
      setError('Não foi possível salvar. Confira se a coluna equipe_menu_permissions existe no banco.')
      return
    }
    setBaselineSnapshot(snapshotPermissions(customAccess))
    setSuccess('Permissões salvas.')
    window.setTimeout(() => setSuccess(null), 3200)
  }

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader greetingOnly profileHref={`${base}/configuracoes`} avatarFallback="A" />

      <PageContent className="space-y-5 md:space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Gestão de Permissões</span>
              <span aria-hidden>🛡️</span>
            </span>
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
            Configure o que cada cargo pode acessar no sistema
          </p>
        </header>

        {error ? (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        ) : null}
        {success ? (
          <Alert
            variant="success"
            onClose={() => setSuccess(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{success}</AlertTitle>
          </Alert>
        ) : null}

        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid h-auto w-full max-w-md grid-cols-2 gap-1 p-1">
            <TabsTrigger value="roles" className="text-sm">
              Roles
            </TabsTrigger>
            <TabsTrigger value="membros" className="text-sm">
              Membros da Equipe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="mt-5 space-y-4 focus-visible:outline-none">
            {isLoading || !customAccess ? (
              <div className="flex justify-center py-16">
                <Spinner className="h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <RoleCardShell
                    emoji="👑"
                    title="Administrador"
                    badge="Sistema"
                    badgeVariant="outline"
                    description="Acesso total ao painel da barbearia (dono ou administrador da conta)."
                  >
                    <ul className="list-outside list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground/80">
                      <li>Este papel não pode ser restringido por menu: todas as áreas do painel permanecem disponíveis.</li>
                      <li>Inclui gestão de assinatura, equipe, permissões e configurações da barbearia.</li>
                      <li>Ideal para o proprietário ou quem administra a conta no dia a dia.</li>
                    </ul>
                  </RoleCardShell>

                  <RoleCardShell
                    emoji="✂️"
                    title="Barbeiro"
                    badge="Sistema"
                    badgeVariant="outline"
                    description="Agenda própria, horários e clientes atendidos."
                  >
                    <ul className="list-outside list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground/80">
                      <li>Uso principal pelo painel do profissional (agenda e horários).</li>
                      <li>Visível para clientes na escolha de profissional ao agendar.</li>
                      <li>As permissões por menu abaixo referem-se a cargos com acesso ao painel da barbearia.</li>
                    </ul>
                  </RoleCardShell>

                  <RoleCardShell
                    emoji="🛡️"
                    title="Moderador"
                    badge="Custom"
                    badgeVariant="secondary"
                    description="Acesso intermediário ao painel da barbearia, configurável por menu."
                    defaultOpen
                  >
                    <CustomRoleToolbar onRestoreDefaults={() => setConfirmRestoreRole('moderador')} />
                    <MenuMatrixEditable
                      role="moderador"
                      access={customAccess.moderador}
                      sections={matrixSections}
                      onChange={setMenu}
                    />
                  </RoleCardShell>

                  <RoleCardShell
                    emoji="⭐"
                    title="Barbeiro Líder"
                    badge="Custom"
                    badgeVariant="secondary"
                    description="Barbeiro com permissões extras no painel da barbearia."
                  >
                    <CustomRoleToolbar onRestoreDefaults={() => setConfirmRestoreRole('barbeiro_lider')} />
                    <MenuMatrixEditable
                      role="barbeiro_lider"
                      access={customAccess.barbeiro_lider}
                      sections={matrixSections}
                      onChange={setMenu}
                    />
                  </RoleCardShell>
                </div>

                <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    className="w-full sm:ml-auto sm:w-auto"
                    disabled={isSaving || !dirty}
                    onClick={() => void handleSave()}
                  >
                    {isSaving ? <Spinner className="mr-2" /> : null}
                    {isSaving ? 'Salvando…' : 'Salvar alterações'}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="membros" className="mt-5 focus-visible:outline-none">
            <Card>
              <CardContent className="space-y-4 py-6">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Membros da equipe</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Cadastre pessoas, defina a função (Barbeiro, Moderador ou Barbeiro Líder) e mantenha os dados
                    atualizados.
                  </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                  <Link href={`${base}/equipe`}>Abrir página da equipe</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <AlertDialog
          open={confirmRestoreRole != null}
          onOpenChange={(open) => {
            if (!open) setConfirmRestoreRole(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurar padrão deste cargo?</AlertDialogTitle>
              <AlertDialogDescription className="leading-relaxed">
                {confirmRestoreRole ? (
                  <>
                    As permissões de <span className="font-medium text-foreground">{ROLE_LABEL[confirmRestoreRole]}</span>{' '}
                    voltarão para o padrão inicial. Depois, clique em <strong>Salvar alterações</strong> para aplicar no
                    banco.
                  </>
                ) : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={isSaving || !confirmRestoreRole}
                onClick={() => {
                  if (!confirmRestoreRole) return
                  restoreRoleDefaults(confirmRestoreRole)
                  setConfirmRestoreRole(null)
                }}
              >
                Restaurar padrão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </PageContent>
    </TenantPanelPageContainer>
  )
}

function RoleCardShell({
  emoji,
  title,
  badge,
  badgeVariant,
  description,
  defaultOpen = false,
  children,
}: {
  emoji: string
  title: string
  badge: string
  badgeVariant: 'outline' | 'secondary'
  description: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full min-w-0 items-stretch gap-3 px-6 py-5 text-left transition-colors',
              'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <span className="flex shrink-0 items-center text-2xl leading-none" aria-hidden>
              {emoji}
            </span>
            <div className="flex min-w-0 flex-1 flex-col justify-center space-y-2 pr-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold">{title}</span>
                <Badge variant={badgeVariant} className="shrink-0">
                  {badge}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
            <span className="flex shrink-0 items-center text-muted-foreground">
              <ChevronDown
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform duration-200',
                  open && 'rotate-180',
                )}
              />
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="border-t border-border/60 pb-5 pt-4">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function CustomRoleToolbar({
  onRestoreDefaults,
}: {
  onRestoreDefaults: () => void
}) {
  return (
    <div className="flex justify-end border-b border-border/50 py-4">
      <Button type="button" variant="outline" size="sm" onClick={onRestoreDefaults}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Restaurar padrão deste cargo
      </Button>
    </div>
  )
}

function MenuMatrixEditable({
  role,
  access,
  sections,
  onChange,
}: {
  role: CustomRoleKey
  access: Record<TenantAdminMenuKey, boolean>
  sections: ReturnType<typeof menuSectionsForMatrix>
  onChange: (role: CustomRoleKey, key: TenantAdminMenuKey, value: boolean) => void
}) {
  const flatItems = sections.flatMap((section) => section.items)

  return (
    <div className="grid grid-cols-1 gap-2.5 pb-1 md:grid-cols-2">
      {flatItems.map((item) => {
        const Icon = item.icon
        const id = `menu-${role}-${item.key}`
        const helpText = MENU_PERMISSION_HELP_TEXT[item.key] ?? 'Permitir acesso a este menu no painel.'
        return (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-3 py-3 sm:px-4"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/30">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 space-y-1">
                <Label htmlFor={id} className="cursor-pointer break-words text-sm font-semibold leading-tight">
                  {item.label}
                </Label>
                <p className="text-xs leading-relaxed text-muted-foreground">{helpText}</p>
              </div>
            </div>
            <Switch
              className="shrink-0"
              id={id}
              checked={access[item.key] ?? false}
              onCheckedChange={(v) => onChange(role, item.key, v)}
            />
          </div>
        )
      })}
    </div>
  )
}
