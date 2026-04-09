'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { PageContainer, PageContent, PageTitle } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { superPageContainerClass, superPremiumAppHeaderClass } from '@/components/super/super-ui'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { SuperGridEntityListSkeleton } from '@/components/shared/loading-skeleton'
import { PlanoPeriodicidadeToggle } from '@/components/shared/plano-periodicidade-toggle'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { logSistemaAcao } from '@/lib/log-sistema-acao'
import { linhasBeneficiosPlano, parsePlanoBeneficios } from '@/lib/plano-beneficios'
import {
  mesesPorPeriodicidade,
  precoTotalNoPeriodo,
  sufixoPrecoPeriodicidade,
  type PlanoPeriodicidade,
} from '@/lib/plano-periodicidade'
import type { Plano } from '@/types'

type BeneficioFormRow = { key: string; texto: string; ativo: boolean }

function newBeneficioRow(partial?: Partial<Pick<BeneficioFormRow, 'texto' | 'ativo'>>): BeneficioFormRow {
  return {
    key: globalThis.crypto?.randomUUID?.() ?? `b-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    texto: partial?.texto ?? '',
    ativo: partial?.ativo ?? true,
  }
}

function planoToBeneficioRows(plano: Plano): BeneficioFormRow[] {
  const parsed = parsePlanoBeneficios(plano.beneficios)
  if (parsed.length === 0) return []
  return parsed.map((b) => newBeneficioRow({ texto: b.texto, ativo: b.ativo }))
}

const emptyForm = {
  nome: '',
  preco_mensal: '',
  beneficios: [] as BeneficioFormRow[],
  ativo: true,
}

function snapshotPlanoParaLog(plano: Plano) {
  return {
    id: plano.id,
    nome: plano.nome,
    preco_mensal: plano.preco_mensal,
    beneficios: plano.beneficios ?? null,
    ativo: plano.ativo,
  }
}

export default function SuperPlanosPage() {
  const router = useRouter()
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
  const [intervaloPreco, setIntervaloPreco] = useState<PlanoPeriodicidade>('mensal')

  const filtered = useMemo(() => {
    let rows = planos
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      rows = rows.filter((p) => {
        if (p.nome.toLowerCase().includes(q)) return true
        return parsePlanoBeneficios(p.beneficios).some((b) => b.texto.toLowerCase().includes(q))
      })
    }
    return [...rows].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
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
      .order('nome', { ascending: true })

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
      beneficios: planoToBeneficioRows(plano),
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
    const beneficios = form.beneficios
      .map((b) => ({ texto: b.texto.trim(), ativo: b.ativo }))
      .filter((b) => b.texto.length > 0)

    const payload = {
      nome: form.nome,
      preco_mensal: Number(form.preco_mensal),
      beneficios,
      ativo: form.ativo,
    }

    if (editingPlano) {
      const antes = snapshotPlanoParaLog(editingPlano)
      const { error: updateError } = await supabase.from('planos').update(payload).eq('id', editingPlano.id)
      if (updateError) {
        setError('Não foi possível atualizar o plano')
        setIsSaving(false)
        return
      }
      const depois = { ...antes, ...payload }
      await logSistemaAcao(supabase, {
        tipo_acao: 'edicao',
        entidade: 'plano',
        entidade_id: editingPlano.id,
        entidade_nome: payload.nome,
        resumo_acao: 'Editou plano',
        descricao: `Alterações em “${payload.nome}”.`,
        payload_antes: antes,
        payload_depois: depois,
      })
    } else {
      const { data: created, error: insertError } = await supabase
        .from('planos')
        .insert(payload)
        .select('id, nome, preco_mensal, beneficios, ativo')
        .single()
      if (insertError) {
        setError('Não foi possível criar o plano')
        setIsSaving(false)
        return
      }
      if (created) {
        await logSistemaAcao(supabase, {
          tipo_acao: 'criacao',
          entidade: 'plano',
          entidade_id: created.id,
          entidade_nome: created.nome,
          resumo_acao: 'Criou plano',
          descricao: `Plano “${created.nome}” cadastrado.`,
          payload_depois: {
            id: created.id,
            nome: created.nome,
            preco_mensal: created.preco_mensal,
            beneficios: created.beneficios ?? null,
            ativo: created.ativo,
          },
        })
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
    const antes = snapshotPlanoParaLog(deleteTarget)
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
    await logSistemaAcao(supabase, {
      tipo_acao: 'exclusao',
      entidade: 'plano',
      entidade_id: deleteTarget.id,
      entidade_nome: deleteTarget.nome,
      resumo_acao: 'Excluiu plano',
      descricao: `Removido o plano “${deleteTarget.nome}”.`,
      payload_antes: antes,
    })
    setDeleteTarget(null)
    loadPlanos()
  }

  return (
    <PageContainer className={superPageContainerClass}>
      <AppPageHeader
        greetingOnly
        profileHref="/conta/editar"
        avatarFallback="S"
        className={superPremiumAppHeaderClass}
      />

      <PageContent className="space-y-4 pb-20 md:space-y-5 md:pb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2 lg:min-w-[12rem] lg:flex-none">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              onClick={() => router.back()}
              aria-label="Voltar"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <PageTitle className="min-w-0 truncate">Planos</PageTitle>
          </div>
          <div className="relative min-w-0 flex-1 lg:max-w-xl xl:max-w-2xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou benefício..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="button" className="w-full shrink-0 lg:w-auto" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo plano
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

        {!isLoading && planos.length > 0 ? (
          <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4 md:flex md:flex-wrap md:items-end md:justify-between md:gap-4 lg:p-5">
            <div className="min-w-0 space-y-2 md:max-w-xl md:flex-1">
              <Label className="text-foreground">Visualizar preço por período</Label>
              <p className="text-xs text-muted-foreground md:text-sm">
                O cadastro do plano continua com o valor mensal de referência; abaixo os valores são calculados para o
                período escolhido.
              </p>
            </div>
            <div className="shrink-0 md:min-w-[min(100%,20rem)]">
              <PlanoPeriodicidadeToggle
                idPrefix="super-planos-intervalo"
                value={intervaloPreco}
                onChange={setIntervaloPreco}
                disabled={isSaving || isDeleting}
              />
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <SuperGridEntityListSkeleton
            count={6}
            listClassName="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5"
          />
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
          <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
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
                      {formatCurrency(precoTotalNoPeriodo(plano.preco_mensal, intervaloPreco))}
                      <span className="font-normal text-muted-foreground/80">
                        {' '}
                        {sufixoPrecoPeriodicidade(intervaloPreco)}
                      </span>
                    </p>
                    {intervaloPreco !== 'mensal' ? (
                      <p className="text-xs text-muted-foreground/90">
                        Ref. {formatCurrency(plano.preco_mensal)}/mês × {mesesPorPeriodicidade(intervaloPreco)}
                      </p>
                    ) : null}
                    <ul className="pt-2 text-xs leading-relaxed text-muted-foreground/90">
                      {linhasBeneficiosPlano(plano).length === 0 ? (
                        <li className="list-none text-muted-foreground/70">Nenhum benefício ativo</li>
                      ) : (
                        linhasBeneficiosPlano(plano).map((linha, idx) => (
                          <li key={`${plano.id}-${idx}`} className="flex items-start gap-2">
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
        <DialogContent className="flex max-h-[90vh] flex-col rounded-2xl sm:max-w-lg lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingPlano ? 'Editar plano' : 'Novo plano'}</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
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

            <div className="space-y-2 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <Label className="text-foreground">Benefícios</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg"
                  onClick={() =>
                    setForm((p) => ({ ...p, beneficios: [...p.beneficios, newBeneficioRow()] }))
                  }
                >
                  <Plus className="mr-1 size-3.5" />
                  Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Escreva cada benefício (ex.: até 10 barbeiros). Marque a caixa para incluí-lo no plano com check.
              </p>
              {form.beneficios.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-center text-sm text-muted-foreground">
                  Nenhum item. Use &quot;Adicionar&quot; para incluir benefícios.
                </p>
              ) : (
                <ul className="space-y-2">
                  {form.beneficios.map((row, index) => (
                    <li
                      key={row.key}
                      className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-2"
                    >
                      <div className="pt-2">
                        <Checkbox
                          checked={row.ativo}
                          onCheckedChange={(checked) =>
                            setForm((p) => ({
                              ...p,
                              beneficios: p.beneficios.map((b, i) =>
                                i === index ? { ...b, ativo: checked === true } : b,
                              ),
                            }))
                          }
                          aria-label={row.ativo ? 'Benefício ativo no plano' : 'Benefício inativo'}
                        />
                      </div>
                      <Input
                        value={row.texto}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            beneficios: p.beneficios.map((b, i) =>
                              i === index ? { ...b, texto: e.target.value } : b,
                            ),
                          }))
                        }
                        placeholder="Ex.: Até 2 unidades"
                        className="min-w-0 flex-1 rounded-lg"
                        aria-label={`Texto do benefício ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            beneficios: p.beneficios.filter((_, i) => i !== index),
                          }))
                        }
                        aria-label="Remover benefício"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.75} />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
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
