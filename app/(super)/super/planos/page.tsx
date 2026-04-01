'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
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
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Plano } from '@/types'

const emptyForm = {
  nome: '',
  preco_mensal: '',
  limite_barbeiros: '',
  limite_agendamentos: '',
  ativo: true,
}

export default function SuperPlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Plano | null>(null)
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    if (!search.trim()) return planos
    const q = search.toLowerCase().trim()
    return planos.filter((p) => p.nome.toLowerCase().includes(q))
  }, [planos, search])

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

  function openCreate() {
    setEditingPlano(null)
    setForm(emptyForm)
    setIsDialogOpen(true)
  }

  function openEdit(plano: Plano) {
    setEditingPlano(plano)
    setForm({
      nome: plano.nome,
      preco_mensal: String(plano.preco_mensal),
      limite_barbeiros: plano.limite_barbeiros != null ? String(plano.limite_barbeiros) : '',
      limite_agendamentos: plano.limite_agendamentos != null ? String(plano.limite_agendamentos) : '',
      ativo: plano.ativo,
    })
    setIsDialogOpen(true)
  }

  function handleDialogOpenChange(open: boolean) {
    setIsDialogOpen(open)
    if (!open) setEditingPlano(null)
  }

  async function handleSave() {
    if (!form.nome || !form.preco_mensal) return
    setIsSaving(true)
    setError(null)

    const supabase = createClient()
    const payload = {
      nome: form.nome,
      preco_mensal: Number(form.preco_mensal),
      limite_barbeiros: form.limite_barbeiros ? Number(form.limite_barbeiros) : null,
      limite_agendamentos: form.limite_agendamentos ? Number(form.limite_agendamentos) : null,
      ativo: form.ativo,
    }

    if (editingPlano) {
      const { error: updateError } = await supabase.from('planos').update(payload).eq('id', editingPlano.id)
      if (updateError) {
        setError('Não foi possível atualizar o plano')
        setIsSaving(false)
        return
      }
    } else {
      const { error: insertError } = await supabase.from('planos').insert(payload)
      if (insertError) {
        setError('Não foi possível criar o plano')
        setIsSaving(false)
        return
      }
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    setEditingPlano(null)
    setForm(emptyForm)
    loadPlanos()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    setError(null)
    const supabase = createClient()
    const { error: deleteError } = await supabase.from('planos').delete().eq('id', deleteTarget.id)
    setIsDeleting(false)
    if (deleteError) {
      setError(
        deleteError.code === '23503'
          ? 'Este plano está em uso e não pode ser excluído'
          : 'Não foi possível excluir o plano',
      )
      setDeleteTarget(null)
      return
    }
    setDeleteTarget(null)
    loadPlanos()
  }

  return (
    <PageContainer className="bg-muted/30">
      <AppPageHeader title="Planos" profileHref="/super/perfil/editar" avatarFallback="S" />

      <PageContent className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.75}
            />
            <Input
              placeholder="Pesquisar plano..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-lg border-border/80 bg-background pl-9 shadow-none"
            />
          </div>
          <Button
            size="sm"
            className="h-10 w-full shrink-0 rounded-lg shadow-sm sm:w-auto"
            onClick={openCreate}
          >
            <Plus className="size-4" />
            Plano
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spinner className="size-7 text-muted-foreground" />
          </div>
        ) : planos.length === 0 ? (
          <Card className="border-dashed border-border/60 bg-transparent shadow-none">
            <CardContent className="py-14 text-center text-sm text-muted-foreground">
              Nenhum plano cadastrado
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-border/60 bg-transparent shadow-none">
            <CardContent className="py-14 text-center text-sm text-muted-foreground">
              Nenhum plano corresponde à pesquisa
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((plano) => (
              <li key={plano.id}>
                <article
                  className={cn(
                    'flex h-full flex-col rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.04] transition-shadow duration-200 hover:shadow-md dark:ring-white/[0.06]',
                    !plano.ativo && 'opacity-[0.72]',
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{plano.nome}</h2>
                    <p className="text-sm font-medium tabular-nums text-muted-foreground">
                      {formatCurrency(plano.preco_mensal)}
                      <span className="font-normal text-muted-foreground/80"> / mês</span>
                    </p>
                    <p className="pt-2 text-xs leading-relaxed text-muted-foreground/90">
                      Barbeiros: {plano.limite_barbeiros ?? 'Ilimitado'}
                      <span className="mx-1.5 text-border">·</span>
                      Agendamentos: {plano.limite_agendamentos ?? 'Ilimitado'}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/50 pt-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                        plano.ativo
                          ? 'bg-emerald-500/[0.12] text-emerald-800 dark:text-emerald-400'
                          : 'bg-red-500/[0.1] text-red-800 dark:text-red-400',
                      )}
                    >
                      <span
                        className={cn('size-1.5 shrink-0 rounded-full', plano.ativo ? 'bg-emerald-500' : 'bg-red-500')}
                        aria-hidden
                      />
                      {plano.ativo ? 'Ativo' : 'Inativo'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 rounded-lg border-border/80 bg-background px-2.5 font-normal shadow-none hover:bg-muted hover:text-foreground dark:hover:bg-muted/80"
                        onClick={() => openEdit(plano)}
                      >
                        <Pencil className="size-3.5" strokeWidth={1.75} />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="size-8 rounded-lg border-border/80 bg-background shadow-none hover:border-destructive/40 hover:bg-destructive/10 hover:[&_svg]:text-destructive dark:hover:border-destructive/50 dark:hover:bg-destructive/15"
                        onClick={() => setDeleteTarget(plano)}
                        aria-label={`Excluir ${plano.nome}`}
                      >
                        <Trash2 className="size-3.5 text-muted-foreground transition-colors" strokeWidth={1.75} />
                      </Button>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </PageContent>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlano ? 'Editar plano' : 'Novo plano'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="preco">Preço mensal</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                value={form.preco_mensal}
                onChange={(e) => setForm((p) => ({ ...p, preco_mensal: e.target.value }))}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="limite-barbeiros">Limite de barbeiros</Label>
              <Input
                id="limite-barbeiros"
                type="number"
                value={form.limite_barbeiros}
                onChange={(e) => setForm((p) => ({ ...p, limite_barbeiros: e.target.value }))}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="limite-agendamentos">Limite de agendamentos</Label>
              <Input
                id="limite-agendamentos"
                type="number"
                value={form.limite_agendamentos}
                onChange={(e) => setForm((p) => ({ ...p, limite_agendamentos: e.target.value }))}
                className="rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
              <Label htmlFor="ativo" className="cursor-pointer">
                Plano ativo
              </Label>
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, ativo: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-lg hover:bg-muted hover:text-foreground dark:hover:bg-muted/80"
              onClick={() => handleDialogOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-lg"
              onClick={handleSave}
              disabled={isSaving || !form.nome || !form.preco_mensal}
            >
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Salvando...' : editingPlano ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Tem certeza que deseja excluir “${deleteTarget.nome}”? Esta ação não pode ser desfeita.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-lg hover:bg-muted hover:text-foreground dark:hover:bg-muted/80"
              disabled={isDeleting}
            >
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="rounded-lg"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? <Spinner className="mr-2" /> : null}
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}
