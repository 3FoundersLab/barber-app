'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { SubscriptionListSkeleton } from '@/components/shared/loading-skeleton'
import { createClient } from '@/lib/supabase/client'
import type { Assinatura, Barbearia, Plano } from '@/types'

const STATUS_OPTIONS = ['pendente', 'trial', 'ativa', 'inadimplente', 'cancelada'] as const

function labelAssinaturaStatus(status: string) {
  const map: Record<string, string> = {
    pendente: 'Pagamento pendente',
    ativa: 'Ativa',
    trial: 'Trial',
    inadimplente: 'Inadimplente',
    cancelada: 'Cancelada',
  }
  return map[status] ?? status
}

export default function SuperAssinaturasPage() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [barbearias, setBarbearias] = useState<Barbearia[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState({
    barbearia_id: '',
    plano_id: '',
    status: 'trial',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    setError(null)

    const [assinaturasRes, barbeariasRes, planosRes] = await Promise.all([
      supabase
        .from('assinaturas')
        .select(`
          *,
          barbearia:barbearias(*),
          plano:planos(*)
        `)
        .order('created_at', { ascending: false }),
      supabase.from('barbearias').select('*').order('nome'),
      supabase.from('planos').select('*').eq('ativo', true).order('nome'),
    ])

    if (assinaturasRes.error || barbeariasRes.error || planosRes.error) {
      setError('Não foi possível carregar os dados de assinaturas')
      setIsLoading(false)
      return
    }

    const list = (assinaturasRes.data || []) as Assinatura[]
    list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    setAssinaturas(list)
    setBarbearias(barbeariasRes.data || [])
    setPlanos(planosRes.data || [])
    setIsLoading(false)
  }

  async function handleCreate() {
    if (!form.barbearia_id || !form.plano_id) return
    setIsSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('assinaturas')
      .insert({
        barbearia_id: form.barbearia_id,
        plano_id: form.plano_id,
        status: form.status,
        inicio_em: new Date().toISOString().split('T')[0],
      })

    if (insertError) {
      setError('Não foi possível criar a assinatura')
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    setForm({ barbearia_id: '', plano_id: '', status: 'trial' })
    loadData()
  }

  async function handleConfirmarPagamento(assinaturaId: string) {
    setConfirmingId(assinaturaId)
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('assinaturas')
      .update({ status: 'ativa' })
      .eq('id', assinaturaId)

    if (updateError) {
      setError('Não foi possível confirmar o pagamento')
    } else {
      loadData()
    }
    setConfirmingId(null)
  }

  const { pendentesConfirmacao, demaisAssinaturas } = useMemo(() => {
    const pendentes = assinaturas.filter((a) => a.status === 'pendente')
    const demais = assinaturas.filter((a) => a.status !== 'pendente')
    return { pendentesConfirmacao: pendentes, demaisAssinaturas: demais }
  }, [assinaturas])

  function renderAssinaturaCard(assinatura: Assinatura) {
    return (
      <Card key={assinatura.id}>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate font-medium">{assinatura.barbearia?.nome || 'Barbearia'}</p>
            <p className="truncate text-xs text-muted-foreground">
              {assinatura.plano?.nome || 'Plano'} — {labelAssinaturaStatus(assinatura.status)}
            </p>
            {assinatura.barbearia?.status_cadastro === 'pagamento_pendente' && (
              <p className="truncate text-xs text-amber-700 dark:text-amber-500">
                Cadastro da barbearia: pagamento pendente
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">{assinatura.inicio_em}</p>
            {assinatura.status === 'pendente' && (
              <Button
                size="sm"
                disabled={confirmingId === assinatura.id}
                onClick={() => handleConfirmarPagamento(assinatura.id)}
              >
                {confirmingId === assinatura.id ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Confirmar pagamento
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <PageContainer>
      <AppPageHeader
        title="Assinaturas"
        profileHref="/conta/editar"
        avatarFallback="S"
      />

      <PageContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Barbearias cadastradas em <span className="font-medium text-foreground">/cadastro/barbearia</span> aparecem com
          assinatura em <span className="font-medium text-foreground">pagamento pendente</span>. Confirme o pagamento
          abaixo para liberar o painel completo da barbearia.
        </p>
        <div className="flex justify-end">
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova assinatura
          </Button>
        </div>

        {error && (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {isLoading ? (
          <SubscriptionListSkeleton count={5} />
        ) : assinaturas.length > 0 ? (
          <div className="space-y-6">
            {pendentesConfirmacao.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Aguardando confirmação de pagamento
                </h2>
                <p className="text-xs text-muted-foreground">
                  Novas barbearias cadastradas em /cadastro/barbearia aparecem aqui. Ao confirmar, a assinatura fica
                  ativa e o painel completo é liberado para o administrador da barbearia.
                </p>
                <div className="space-y-3">{pendentesConfirmacao.map(renderAssinaturaCard)}</div>
              </div>
            ) : null}
            {demaisAssinaturas.length > 0 ? (
              <div className="space-y-3">
                {pendentesConfirmacao.length > 0 ? (
                  <h2 className="text-sm font-semibold text-foreground">Demais assinaturas</h2>
                ) : null}
                <div className="space-y-3">{demaisAssinaturas.map(renderAssinaturaCard)}</div>
              </div>
            ) : null}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma assinatura cadastrada
            </CardContent>
          </Card>
        )}
      </PageContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Assinatura</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Barbearia</Label>
              <Select value={form.barbearia_id} onValueChange={(v) => setForm((p) => ({ ...p, barbearia_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {barbearias.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Plano</Label>
              <Select value={form.plano_id} onValueChange={(v) => setForm((p) => ({ ...p, plano_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {planos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSaving || !form.barbearia_id || !form.plano_id}>
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Salvando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
