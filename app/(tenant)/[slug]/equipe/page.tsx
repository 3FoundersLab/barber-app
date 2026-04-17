'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, Search, Sparkles } from 'lucide-react'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { PageContent, PageTitle } from '@/components/shared/page-container'
import { TeamMemberCard } from '@/components/domain/team-member-card'
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
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TeamMemberCardSkeleton } from '@/components/shared/loading-skeleton'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { cn } from '@/lib/utils'
import type { Barbeiro } from '@/types'

const EQUIPE_PAGE_SIZE_OPTIONS = [12, 24, 36, 48] as const
type EquipePageSize = (typeof EQUIPE_PAGE_SIZE_OPTIONS)[number]

function pageNumberItems(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const set = new Set<number>([1, total])
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) set.add(i)
  }
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) out.push('ellipsis')
    out.push(p)
    prev = p
  }
  return out
}

export default function TenantEquipePage() {
  const router = useRouter()
  const { slug, base } = useTenantAdminBase()
  const novoMembroHref = `${base}/equipe/novo`

  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<EquipePageSize>(12)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [barbeiroParaExcluir, setBarbeiroParaExcluir] = useState<Barbeiro | null>(null)

  useEffect(() => {
    loadBarbeiros()
  }, [slug])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, pageSize])

  const filteredBarbeiros = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return barbeiros
    return barbeiros.filter(
      (b) =>
        b.nome.toLowerCase().includes(q) || (b.email?.toLowerCase().includes(q) ?? false),
    )
  }, [searchTerm, barbeiros])

  const totalFiltered = filteredBarbeiros.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const paginatedBarbeiros = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredBarbeiros.slice(start, start + pageSize)
  }, [filteredBarbeiros, page, pageSize])

  const rangeStart = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalFiltered)
  const pageItems = useMemo(() => pageNumberItems(page, totalPages), [page, totalPages])

  async function loadBarbeiros() {
    const supabase = createClient()
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Usuário não autenticado')
      setBarbeiros([])
      setIsLoading(false)
      return
    }

    const barbeariaIdResolved = await resolveAdminBarbeariaId(supabase, user.id, { slug })

    if (!barbeariaIdResolved) {
      setError('Barbearia não encontrada para este usuário')
      setBarbeiros([])
      setIsLoading(false)
      return
    }

    const { data, error: queryError } = await supabase
      .from('barbeiros')
      .select('*')
      .eq('barbearia_id', barbeariaIdResolved)
      .order('nome')

    if (queryError) {
      setError('Não foi possível carregar a equipe')
      setBarbeiros([])
    } else if (data) {
      setBarbeiros(data)
    }

    setIsLoading(false)
  }

  const solicitarExclusaoBarbeiro = (id: string) => {
    const b = barbeiros.find((x) => x.id === id)
    if (b) setBarbeiroParaExcluir(b)
  }

  const confirmarExclusaoBarbeiro = async () => {
    if (!barbeiroParaExcluir) return
    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('barbeiros')
      .delete()
      .eq('id', barbeiroParaExcluir.id)
    setBarbeiroParaExcluir(null)
    if (deleteError) {
      setError('Não foi possível excluir o membro')
      return
    }
    loadBarbeiros()
  }

  const abrirEdicao = (barbeiro: Barbeiro) => {
    router.push(`${base}/equipe/${barbeiro.id}/editar`)
  }

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader greetingOnly profileHref={`${base}/configuracoes`} avatarFallback="A" />

      <PageContent className="space-y-4 md:space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <PageTitle className="min-w-0 truncate">Equipe</PageTitle>
          <Button type="button" className="w-full shrink-0 sm:w-auto" size="sm" asChild>
            <Link href={novoMembroHref}>
              <Plus className="mr-1 h-4 w-4" />
              Novo
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
            <Label
              htmlFor="equipe-page-size"
              className="shrink-0 whitespace-nowrap text-sm text-muted-foreground"
            >
              Itens
            </Label>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v) as EquipePageSize)}
            >
              <SelectTrigger id="equipe-page-size" className="h-9 w-[4.75rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPE_PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        ) : null}

        <div
          className={
            isLoading || barbeiros.length > 0
              ? 'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 lg:grid-cols-4 lg:gap-4 xl:grid-cols-6'
              : undefined
          }
        >
          {isLoading ? (
            Array.from({ length: Math.min(pageSize, 48) }).map((_, i) => (
              <TeamMemberCardSkeleton key={i} />
            ))
          ) : filteredBarbeiros.length > 0 ? (
            <>
              {paginatedBarbeiros.map((barbeiro) => (
                <TeamMemberCard
                  key={barbeiro.id}
                  barbeiro={barbeiro}
                  onEdit={abrirEdicao}
                  onDelete={solicitarExclusaoBarbeiro}
                />
              ))}
              <Link
                href={novoMembroHref}
                className="group relative block cursor-pointer rounded-xl border border-dashed border-primary/30 bg-card text-card-foreground shadow-sm ring-offset-background transition-colors hover:border-primary/50 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 px-4 py-6 text-center">
                  <div className="rounded-full border border-primary/25 bg-primary/10 p-3 text-primary">
                    <Sparkles className="size-5" aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Adicionar novo membro</p>
                  <p className="text-xs text-muted-foreground">Clique para cadastrar na equipe</p>
                </div>
              </Link>
            </>
          ) : (
            <Card className="col-span-full border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm.trim() ? 'Nenhum membro encontrado' : 'Nenhum membro na equipe'}
                </p>
                {!searchTerm.trim() && (
                  <Button size="sm" className="mt-3" asChild>
                    <Link href={novoMembroHref}>
                      <Plus className="mr-1 h-4 w-4" />
                      Adicionar membro
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {!isLoading && totalFiltered > 0 ? (
          <div className="border-t border-border/60 pt-4">
            <Pagination className="mx-0 flex w-full max-w-full flex-col items-center gap-2">
              <PaginationContent className="flex h-9 flex-row flex-wrap items-center justify-center gap-1">
                <PaginationItem>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1 px-2.5"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>
                </PaginationItem>
                {pageItems.map((item, idx) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`e-${idx}`} className="flex h-9 items-center">
                      <PaginationEllipsis className="size-9" />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item} className="flex h-9 items-center">
                      <Button
                        type="button"
                        variant={item === page ? 'default' : 'ghost'}
                        size="icon"
                        className={cn(
                          'h-9 min-w-9',
                          item === page && 'pointer-events-none font-semibold',
                        )}
                        onClick={() => setPage(item)}
                        aria-label={`Página ${item}`}
                        aria-current={item === page ? 'page' : undefined}
                      >
                        {item}
                      </Button>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1 px-2.5"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Próxima página"
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
              <p className="text-center text-xs text-muted-foreground">
                {rangeStart}–{rangeEnd} de {totalFiltered}{' '}
                {totalFiltered === 1 ? 'membro' : 'membros'} · Página {page} de {totalPages}
              </p>
            </Pagination>
          </div>
        ) : null}
      </PageContent>

      <AlertDialog
        open={barbeiroParaExcluir != null}
        onOpenChange={(open) => {
          if (!open) setBarbeiroParaExcluir(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir membro da equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              {barbeiroParaExcluir
                ? `“${barbeiroParaExcluir.nome}” será removido da equipe. Esta ação não pode ser desfeita.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmarExclusaoBarbeiro()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TenantPanelPageContainer>
  )
}
