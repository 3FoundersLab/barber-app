'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { PageContainer, PageContent, PageHeader, PageTitle } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { Plano } from '@/types'

export default function SuperPlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    preco_mensal: '',
    limite_barbeiros: '',
    limite_agendamentos: '',
    ativo: true,
  })

  useEffect(() => {
    loadPlanos()
  }, [])

  async function loadPlanos() {
    const supabase = createClient()
    setError(null)

    const { data, error: queryError } = await supabase
      .from('planos')
      .select('*')
      .order('preco_mensal')

    if (queryError) {
      setError('Não foi possível carregar os planos')
      setPlanos([])
    } else {
      setPlanos(data || [])
    }

    setIsLoading(false)
  }

  async function handleCreate() {
    if (!form.nome || !form.preco_mensal) return
    setIsSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('planos')
      .insert({
        nome: form.nome,
        preco_mensal: Number(form.preco_mensal),
        limite_barbeiros: form.limite_barbeiros ? Number(form.limite_barbeiros) : null,
        limite_agendamentos: form.limite_agendamentos ? Number(form.limite_agendamentos) : null,
        ativo: form.ativo,
      })

    if (insertError) {
      setError('Não foi possível criar o plano')
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    setForm({
      nome: '',
      preco_mensal: '',
      limite_barbeiros: '',
      limite_agendamentos: '',
      ativo: true,
    })
    loadPlanos()
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Planos</PageTitle>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Novo
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
        ) : planos.length > 0 ? (
          planos.map((plano) => (
            <Card key={plano.id} className={!plano.ativo ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{plano.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(plano.preco_mensal)} / mês
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {plano.ativo ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Limite barbeiros: {plano.limite_barbeiros ?? 'Ilimitado'} | Limite agendamentos:{' '}
                  {plano.limite_agendamentos ?? 'Ilimitado'}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhum plano cadastrado
            </CardContent>
          </Card>
        )}
      </PageContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Plano</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="preco">Preço mensal</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                value={form.preco_mensal}
                onChange={(e) => setForm((p) => ({ ...p, preco_mensal: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="limite-barbeiros">Limite de barbeiros</Label>
              <Input
                id="limite-barbeiros"
                type="number"
                value={form.limite_barbeiros}
                onChange={(e) => setForm((p) => ({ ...p, limite_barbeiros: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="limite-agendamentos">Limite de agendamentos</Label>
              <Input
                id="limite-agendamentos"
                type="number"
                value={form.limite_agendamentos}
                onChange={(e) => setForm((p) => ({ ...p, limite_agendamentos: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Plano ativo</Label>
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, ativo: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSaving || !form.nome || !form.preco_mensal}>
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Salvando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
