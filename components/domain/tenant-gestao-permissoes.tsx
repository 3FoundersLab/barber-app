'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { PageContent } from '@/components/shared/page-container'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
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
import {
  TENANT_ADMIN_MENU_BLUEPRINT,
  type TenantAdminMenuKey,
} from '@/lib/tenant-admin-nav'
import {
  ADMINISTRADOR_MENU_ACCESS_FULL,
  type EquipeMenuPermissionsJson,
  mergeEquipeMenuPermissions,
  menuSectionsForMatrix,
  sanitizeEquipeMenuPermissionsForSave,
  TENANT_MENU_KEYS_FOR_ROLE_MATRIX,
} from '@/lib/tenant-menu-permissions'

type CustomRoleKey = 'moderador' | 'barbeiro_lider'

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

  const matrixSections = useMemo(() => menuSectionsForMatrix(), [])
  const adminMatrixSections = useMemo(() => [...TENANT_ADMIN_MENU_BLUEPRINT], [])

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

  const setAllForRole = (role: CustomRoleKey, value: boolean) => {
    setCustomAccess((prev) => {
      if (!prev) return prev
      const next = { ...prev[role] }
      for (const k of TENANT_MENU_KEYS_FOR_ROLE_MATRIX) {
        next[k] = value
      }
      return { ...prev, [role]: next }
    })
  }

  const restoreFactoryDefaults = () => {
    const merged = mergeEquipeMenuPermissions(null)
    setCustomAccess(merged)
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
        <header className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Gestão de Permissões 🛡️
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
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
                    <p className="mb-4 text-sm text-muted-foreground">
                      Este papel não pode ser restringido por menu. Todas as áreas permanecem disponíveis.
                    </p>
                    <MenuMatrixReadOnly
                      access={ADMINISTRADOR_MENU_ACCESS_FULL}
                      sections={adminMatrixSections}
                    />
                  </RoleCardShell>

                  <RoleCardShell
                    emoji="✂️"
                    title="Barbeiro"
                    badge="Sistema"
                    badgeVariant="outline"
                    description="Agenda própria, horários e clientes atendidos."
                  >
                    <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
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
                    <CustomRoleToolbar
                      onSelectAll={() => setAllForRole('moderador', true)}
                      onClearAll={() => setAllForRole('moderador', false)}
                    />
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
                    <CustomRoleToolbar
                      onSelectAll={() => setAllForRole('barbeiro_lider', true)}
                      onClearAll={() => setAllForRole('barbeiro_lider', false)}
                    />
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
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={restoreFactoryDefaults}
                    disabled={isSaving}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restaurar padrões (Moderador e Líder)
                  </Button>
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
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Membros da equipe</h2>
                  <p className="text-sm text-muted-foreground">
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
    <Card className="overflow-hidden shadow-sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-start gap-3 p-4 text-left transition-colors',
              'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <span className="text-2xl leading-none" aria-hidden>
              {emoji}
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{title}</span>
                <Badge variant={badgeVariant}>{badge}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <ChevronDown
              className={cn(
                'mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="border-t border-border/60 pb-5 pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function CustomRoleToolbar({
  onSelectAll,
  onClearAll,
}: {
  onSelectAll: () => void
  onClearAll: () => void
}) {
  return (
    <div className="flex flex-wrap gap-2 py-4">
      <Button type="button" variant="secondary" size="sm" onClick={onSelectAll}>
        Marcar todos os menus
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onClearAll}>
        Desmarcar todos
      </Button>
    </div>
  )
}

function MenuMatrixReadOnly({
  access,
  sections,
}: {
  access: Record<TenantAdminMenuKey, boolean>
  sections: ReturnType<typeof menuSectionsForMatrix>
}) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.label} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {section.label}
          </p>
          <div className="space-y-2">
            {section.items.map((item) => {
              const Icon = item.icon
              const on = access[item.key] ?? false
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <Switch checked={on} disabled />
                </div>
              )
            })}
          </div>
        </div>
      ))}
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
  return (
    <div className="space-y-6 pb-1">
      {sections.map((section) => (
        <div key={section.label} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {section.label}
          </p>
          <div className="space-y-2">
            {section.items.map((item) => {
              const Icon = item.icon
              const id = `menu-${role}-${item.key}`
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
                      {item.label}
                    </Label>
                  </div>
                  <Switch
                    id={id}
                    checked={access[item.key] ?? false}
                    onCheckedChange={(v) => onChange(role, item.key, v)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
