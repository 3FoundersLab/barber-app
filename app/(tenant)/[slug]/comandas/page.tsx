'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, RefreshCw } from 'lucide-react'
import { ComandaEditorSheet } from '@/components/domain/comanda-editor-sheet'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { toUserFriendlyErrorMessage } from '@/lib/to-user-friendly-error'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { formatTime } from '@/lib/constants'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { getDemoComandasParaLista } from '@/lib/comanda-demo-data'
import type { Comanda } from '@/types/comanda'
import { cn } from '@/lib/utils'

function formatDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'aberta':
      return 'bg-amber-600 hover:bg-amber-600'
    case 'fechada':
      return 'bg-secondary text-secondary-foreground'
    default:
      return 'bg-destructive text-destructive-foreground'
  }
}

export default function TenantComandasPage() {
  const { slug, base } = useTenantAdminBase()
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [comandas, setComandas] = useState<Comanda[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [comandaAtiva, setComandaAtiva] = useState<Comanda | null>(null)
  const [useDemoData, setUseDemoData] = useState(false)

  const dateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate])

  /**
   * Em modo demo mostramos dados sintéticos; fora do demo, a lista vem de `comandas`.
   * Incluir sempre `comandas` nas deps cumpre as regras do React; em demo o corpo ignora `comandas`.
   */
  const comandasExibicao = useMemo(() => {
    if (useDemoData && barbeariaId) return getDemoComandasParaLista(barbeariaId, dateKey)
    return comandas
  }, [useDemoData, barbeariaId, dateKey, comandas])

  const showListLoading = isLoading && !useDemoData

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const id = await resolveAdminBarbeariaId(supabase, user.id, { slug })
      setBarbeariaId(id)
    }
    void init()
  }, [slug])

  const loadComandas = useCallback(async () => {
    if (!barbeariaId) return
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: qErr } = await supabase
      .from('comandas')
      .select(
        `
        *,
        cliente:clientes(nome),
        barbeiro:barbeiros(nome),
        agendamento:agendamentos(data, horario, servico_id, valor, servico:servicos(nome))
      `,
      )
      .eq('barbearia_id', barbeariaId)
      .eq('referencia_data', dateKey)
      .order('numero', { ascending: false })

    if (qErr) {
      setError(
        'Não foi possível carregar as comandas. Aplique o script scripts/032_comandas_estoque.sql no Supabase se ainda não aplicou.',
      )
      setComandas([])
    } else {
      setComandas((data ?? []) as Comanda[])
    }
    setIsLoading(false)
  }, [barbeariaId, dateKey])

  useEffect(() => {
    void loadComandas()
  }, [loadComandas])

  useEffect(() => {
    if (!useDemoData && comandaAtiva?.id.startsWith('demo-comanda')) {
      setEditorOpen(false)
      setComandaAtiva(null)
    }
  }, [useDemoData, comandaAtiva])

  /** Após salvar (ex.: reativar cancelada), alinhar o painel ao registro recém-carregado. */
  useEffect(() => {
    if (!editorOpen || !comandaAtiva || useDemoData) return
    const row = comandas.find((c) => c.id === comandaAtiva.id)
    if (row && row !== comandaAtiva) {
      setComandaAtiva(row)
    }
  }, [comandas, editorOpen, comandaAtiva, useDemoData])

  const backfillComAgendamentos = async () => {
    if (useDemoData) return
    if (!barbeariaId) return
    setSyncing(true)
    setError(null)
    const supabase = createClient()

    const { data: ags, error: e1 } = await supabase
      .from('agendamentos')
      .select('id, barbeiro_id, cliente_id, data')
      .eq('barbearia_id', barbeariaId)
      .eq('data', dateKey)
      .in('status', ['agendado', 'concluido'])

    if (e1) {
      setError('Não foi possível ler agendamentos para sincronizar.')
      setSyncing(false)
      return
    }

    const { data: exist, error: e2 } = await supabase
      .from('comandas')
      .select('agendamento_id')
      .eq('barbearia_id', barbeariaId)
      .not('agendamento_id', 'is', null)

    if (e2) {
      setError('Não foi possível verificar comandas existentes.')
      setSyncing(false)
      return
    }

    const tem = new Set((exist ?? []).map((r) => r.agendamento_id as string))
    const faltam = (ags ?? []).filter((a) => !tem.has(a.id))

    for (const a of faltam) {
      const { error: insE } = await supabase.from('comandas').insert({
        barbearia_id: barbeariaId,
        agendamento_id: a.id,
        barbeiro_id: a.barbeiro_id,
        cliente_id: a.cliente_id,
        referencia_data: a.data,
      })
      if (insE) {
        setError(toUserFriendlyErrorMessage(insE, { fallback: 'Erro ao criar comanda para um agendamento.' }))
        break
      }
    }

    await loadComandas()
    setSyncing(false)
  }

  const abrirEditor = (c: Comanda) => {
    setComandaAtiva(c)
    setEditorOpen(true)
  }

  const prevDay = () => {
    setSelectedDate((d) => {
      const n = new Date(d)
      n.setDate(n.getDate() - 1)
      return n
    })
  }

  const nextDay = () => {
    setSelectedDate((d) => {
      const n = new Date(d)
      n.setDate(n.getDate() + 1)
      return n
    })
  }

  const hoje = () => setSelectedDate(new Date())

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader
        title="Comandas"
        profileHref={`${base}/configuracoes`}
        avatarFallback="A"
        headingActions={
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5">
            <Switch
              id="comandas-demo-data"
              checked={useDemoData}
              onCheckedChange={setUseDemoData}
              aria-label="Usar dados fictícios de demonstração"
            />
            <Label htmlFor="comandas-demo-data" className="cursor-pointer text-xs font-medium">
              Dados fictícios
            </Label>
          </div>
        }
      />

      <PageContent className="space-y-4 md:space-y-5">
        {useDemoData ? (
          <Alert variant="info">
            <AlertTitle>
              Modo demonstração: duas comandas de exemplo (uma aberta e uma fechada). Abra para mostrar o fluxo
              completo do sistema aos clientes. Desligue o interruptor para ver as comandas reais da barbearia.
            </AlertTitle>
          </Alert>
        ) : null}

        {error ? (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={prevDay} aria-label="Dia anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={hoje} className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Hoje
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={nextDay} aria-label="Próximo dia">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            disabled={!barbeariaId || syncing || useDemoData}
            title={useDemoData ? 'Desative dados fictícios para sincronizar com agendamentos reais' : undefined}
            onClick={() => void backfillComAgendamentos()}
          >
            {syncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sincronizar com agendamentos
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Novos agendamentos passam a gerar comanda automaticamente após o script 032. Use sincronizar para dias
          anteriores sem comanda. Ao salvar produtos na comanda, o estoque é baixado.
        </p>

        {showListLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">Carregando…</CardContent>
          </Card>
        ) : comandasExibicao.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma comanda nesta data.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void backfillComAgendamentos()}>
                Sincronizar com agendamentos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {comandasExibicao.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="flex flex-wrap items-center gap-2 text-lg font-semibold tabular-nums">
                        #{c.numero}
                        {useDemoData ? (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            Demo
                          </Badge>
                        ) : null}
                      </p>
                      <p className="text-sm font-medium">{c.cliente?.nome ?? 'Cliente'}</p>
                      <p className="text-xs text-muted-foreground">{c.barbeiro?.nome ?? 'Barbeiro'}</p>
                    </div>
                    <Badge className={cn('shrink-0', statusBadgeClass(c.status))}>
                      {c.status === 'aberta' ? 'Aberta' : c.status === 'fechada' ? 'Fechada' : 'Cancelada'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.agendamento?.horario ? (
                      <span>Agendamento {formatTime(c.agendamento.horario)}</span>
                    ) : (
                      <span>Sem horário de agendamento</span>
                    )}
                    {c.mesa ? <span className="ml-2">· Mesa {c.mesa}</span> : null}
                  </div>
                  <Button type="button" size="sm" className="w-full" onClick={() => abrirEditor(c)}>
                    Abrir comanda
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContent>

      <ComandaEditorSheet
        open={editorOpen}
        onOpenChange={(o) => {
          setEditorOpen(o)
          if (!o) setComandaAtiva(null)
        }}
        comanda={comandaAtiva}
        onSaved={() => void loadComandas()}
        demoMode={useDemoData}
      />
    </TenantPanelPageContainer>
  )
}
