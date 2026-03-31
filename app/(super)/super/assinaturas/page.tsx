'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { PageContainer, PageContent, PageHeader, PageTitle } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import type { Assinatura, Barbearia, Plano } from '@/types'

const STATUS_OPTIONS = ['trial', 'ativa', 'inadimplente', 'cancelada'] as const

export default function SuperAssinaturasPage() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [barbearias, setBarbearias] = useState<Barbearia[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

    setAssinaturas(assinaturasRes.data || [])
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

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Assinaturas</PageTitle>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Nova
        </Button>
      </PageHeader>

      <PageContent className="space-y-3">
        {error && (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">Carregando...</CardContent>
          </Card>
        ) : assinaturas.length > 0 ? (
          assinaturas.map((assinatura) => (
            <Card key={assinatura.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{assinatura.barbearia?.nome || 'Barbearia'}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {assinatura.plano?.nome || 'Plano'} - {assinatura.status}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{assinatura.inicio_em}</p>
              </CardContent>
            </Card>
          ))
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
