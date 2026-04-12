'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { DollarSign, DoorOpen, Scissors, ShoppingBag, Sparkles, Timer, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Barbearia } from '@/types'
import type { AdminDashboardStatusHoje, DashboardStatusSemantico } from '@/lib/build-admin-dashboard-status-hoje'

function useFlashOnChange(value: unknown): boolean {
  const [flash, setFlash] = useState(false)
  const prev = useRef(value)
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      prev.current = value
      return
    }
    if (prev.current !== value) {
      setFlash(true)
      prev.current = value
      const t = window.setTimeout(() => setFlash(false), 850)
      return () => window.clearTimeout(t)
    }
  }, [value])
  return flash
}

function semanticBorderClass(s: DashboardStatusSemantico): string {
  switch (s) {
    case 'bom':
      return 'border-l-emerald-500'
    case 'atencao':
      return 'border-l-amber-500'
    case 'critico':
      return 'border-l-red-500'
  }
}

function semanticRingColor(s: DashboardStatusSemantico): string {
  switch (s) {
    case 'bom':
      return 'hsl(142 71% 40%)'
    case 'atencao':
      return 'hsl(32 95% 44%)'
    case 'critico':
      return 'hsl(0 72% 51%)'
  }
}

function MetaRing({ pct, semantic }: { pct: number; semantic: DashboardStatusSemantico }) {
  const r = 32
  const c = 2 * Math.PI * r
  const clamped = Math.min(100, Math.max(0, pct))
  const off = c * (1 - clamped / 100)
  const stroke = semanticRingColor(semantic)
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0" aria-hidden>
      <circle cx="36" cy="36" r={r} fill="none" className="stroke-muted/30" strokeWidth="7" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform="rotate(-90 36 36)"
      />
    </svg>
  )
}

function formatMinutosLegivel(totalMin: number): string {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h <= 0) return `${m} min`
  return `${h}h ${String(m).padStart(2, '0')} min`
}

type DetailId = 'loja' | 'equipe' | 'espera' | 'fat' | 'atend' | 'vendas' | null

function StatusSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-muted h-40 animate-pulse rounded-xl border md:h-44" />
      ))}
    </div>
  )
}

export function AdminDashboardStatusCards(props: {
  base: string
  barbearia: Barbearia | null
  status: AdminDashboardStatusHoje | null
  isLoading: boolean
  operacaoLiberada: boolean
}) {
  const { base, barbearia, status, isLoading, operacaoLiberada } = props
  const [detail, setDetail] = useState<DetailId>(null)

  const flashFat = useFlashOnChange(status?.faturamentoHoje)
  const flashAt = useFlashOnChange(status?.atendimentosConcluidos)
  const flashV = useFlashOnChange(status?.vendasProdutosUnidades)
  const flashEsp = useFlashOnChange(status?.tempoEsperaMedioMin)
  const flashEq = useFlashOnChange(`${status?.barbeirosEscalados}/${status?.barbeirosAtivos}`)

  if (isLoading || !status) {
    return <StatusSkeleton />
  }

  const pctFat = Math.min(150, Math.round((status.faturamentoHoje / status.metaFaturamento) * 100))
  const pctAt = Math.min(150, Math.round((status.atendimentosConcluidos / status.metaAtendimentos) * 100))
  const pctVendasRing = Math.min(
    100,
    status.vendasSemanaAnterior > 0
      ? Math.round((status.vendasProdutosUnidades / Math.max(1, status.vendasSemanaAnterior)) * 100)
      : status.vendasProdutosUnidades > 0
        ? 100
        : 0,
  )

  const tempoTexto =
    status.tempoEsperaMedioMin != null ? formatMinutosLegivel(status.tempoEsperaMedioMin) : '—'
  const folgaLabel =
    status.barbeirosDeFolga <= 0
      ? 'Equipe completa na escala'
      : status.barbeirosDeFolga === 1
        ? '1 de folga'
        : `${status.barbeirosDeFolga} de folga`

  const vendasVarLabel =
    status.vendasVariacaoPct == null
      ? 'Sem base na semana anterior'
      : `${status.vendasVariacaoPct >= 0 ? '↑' : '↓'} ${Math.abs(status.vendasVariacaoPct)}%`

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
        {/* Linha 1 — operação */}
        <button
          type="button"
          onClick={() => setDetail('loja')}
          className={cn(
            'group text-left transition-shadow focus-visible:ring-ring rounded-xl border border-l-4 bg-card/80 shadow-sm focus-visible:ring-2 focus-visible:outline-none',
            semanticBorderClass(status.lojaSemantico),
            'hover:shadow-md',
          )}
        >
          <Card className="border-0 shadow-none">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
                    status.lojaAberta
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      status.lojaAberta ? 'animate-pulse bg-emerald-500' : 'bg-muted-foreground/50',
                    )}
                  />
                  {status.lojaAberta ? 'Aberto' : 'Fechado'}
                </span>
                <DoorOpen className="text-muted-foreground h-5 w-5 shrink-0 opacity-70" />
              </div>
              <div>
                <p className="text-foreground text-sm font-semibold">Barbearia</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{status.lojaDetalhe}</p>
              </div>
              <span className="text-primary text-xs font-medium group-hover:underline">Ver detalhes</span>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setDetail('equipe')}
          className={cn(
            'group text-left transition-shadow focus-visible:ring-ring rounded-xl border border-l-4 bg-card/80 shadow-sm focus-visible:ring-2 focus-visible:outline-none',
            semanticBorderClass(status.barbeirosSemantico),
            flashEq && 'ring-primary/35 motion-safe:ring-2',
            'hover:shadow-md',
          )}
        >
          <Card className="border-0 shadow-none">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-foreground text-2xl font-bold tabular-nums">
                  <span className={cn(flashEq && 'inline-block motion-safe:animate-in motion-safe:zoom-in-95')}>
                    {status.barbeirosAtivos <= 0
                      ? '—'
                      : `${status.barbeirosEscalados}/${status.barbeirosAtivos}`}
                  </span>
                </span>
                <Users className="text-muted-foreground h-5 w-5 shrink-0" />
              </div>
              <div>
                <p className="text-foreground text-sm font-semibold">Barbeiros ativos</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {operacaoLiberada ? folgaLabel : 'Disponível após ativação do plano'}
                </p>
              </div>
              <span className="text-primary text-xs font-medium group-hover:underline">Ver equipe</span>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setDetail('espera')}
          className={cn(
            'group text-left transition-shadow focus-visible:ring-ring rounded-xl border border-l-4 bg-card/80 shadow-sm focus-visible:ring-2 focus-visible:outline-none',
            semanticBorderClass(status.tempoEsperaSemantico),
            flashEsp && 'ring-primary/35 motion-safe:ring-2',
            'hover:shadow-md',
          )}
        >
          <Card className="border-0 shadow-none">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    'text-2xl font-bold tabular-nums',
                    flashEsp && 'inline-block motion-safe:animate-in motion-safe:zoom-in-95',
                  )}
                >
                  {tempoTexto}
                </span>
                <Timer className="text-muted-foreground h-5 w-5 shrink-0" />
              </div>
              <div>
                <p className="text-foreground text-sm font-semibold">Tempo médio de espera</p>
                <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                  <Sparkles className="h-3 w-3" />
                  {status.tempoEsperaLegenda}
                </p>
              </div>
              <span className="text-primary text-xs font-medium group-hover:underline">Ver agenda</span>
            </CardContent>
          </Card>
        </button>

        {/* Linha 2 — metas */}
        <button
          type="button"
          onClick={() => setDetail('fat')}
          className={cn(
            'group text-left transition-shadow focus-visible:ring-ring rounded-xl border border-l-4 bg-card/80 shadow-sm focus-visible:ring-2 focus-visible:outline-none',
            semanticBorderClass(status.faturamentoSemantico),
            flashFat && 'ring-primary/35 motion-safe:ring-2',
            'hover:shadow-md',
          )}
        >
          <Card className="border-0 shadow-none">
            <CardContent className="flex flex-row items-center gap-3 p-4">
              <MetaRing pct={Math.min(100, pctFat)} semantic={status.faturamentoSemantico} />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-foreground text-lg font-bold tabular-nums leading-tight">
                    <span className={cn(flashFat && 'inline-block motion-safe:animate-in motion-safe:zoom-in-95')}>
                      {formatCurrency(status.faturamentoHoje)}
                    </span>
                  </p>
                  <DollarSign className="text-muted-foreground h-4 w-4 shrink-0" />
                </div>
                <p className="text-muted-foreground text-xs">Faturamento hoje</p>
                <p className="text-muted-foreground text-[11px]">Meta: {pctFat}%</p>
                <span className="text-primary text-xs font-medium group-hover:underline">Ver detalhes</span>
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setDetail('atend')}
          className={cn(
            'group text-left transition-shadow focus-visible:ring-ring rounded-xl border border-l-4 bg-card/80 shadow-sm focus-visible:ring-2 focus-visible:outline-none',
            semanticBorderClass(status.atendimentosSemantico),
            flashAt && 'ring-primary/35 motion-safe:ring-2',
            'hover:shadow-md',
          )}
        >
          <Card className="border-0 shadow-none">
            <CardContent className="flex flex-row items-center gap-3 p-4">
              <MetaRing pct={Math.min(100, pctAt)} semantic={status.atendimentosSemantico} />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-foreground text-2xl font-bold tabular-nums">
                    <span className={cn(flashAt && 'inline-block motion-safe:animate-in motion-safe:zoom-in-95')}>
                      {status.atendimentosConcluidos}
                    </span>
                  </p>
                  <Scissors className="text-muted-foreground h-4 w-4 shrink-0" />
                </div>
                <p className="text-muted-foreground text-xs">Atendimentos concluídos</p>
                <p className="text-muted-foreground text-[11px]">Meta: {pctAt}%</p>
                <span className="text-primary text-xs font-medium group-hover:underline">Ver todos</span>
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setDetail('vendas')}
          className={cn(
            'group text-left transition-shadow focus-visible:ring-ring rounded-xl border border-l-4 bg-card/80 shadow-sm focus-visible:ring-2 focus-visible:outline-none',
            semanticBorderClass(status.vendasSemantico),
            flashV && 'ring-primary/35 motion-safe:ring-2',
            'hover:shadow-md',
          )}
        >
          <Card className="border-0 shadow-none">
            <CardContent className="flex flex-row items-center gap-3 p-4">
              <MetaRing pct={pctVendasRing} semantic={status.vendasSemantico} />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-foreground text-2xl font-bold tabular-nums">
                    <span className={cn(flashV && 'inline-block motion-safe:animate-in motion-safe:zoom-in-95')}>
                      {status.vendasProdutosUnidades}
                    </span>
                  </p>
                  <ShoppingBag className="text-muted-foreground h-4 w-4 shrink-0" />
                </div>
                <p className="text-muted-foreground text-xs">Vendas (produtos)</p>
                <p className="text-muted-foreground text-[11px]">{vendasVarLabel}</p>
                <span className="text-primary text-xs font-medium group-hover:underline">Ver produtos</span>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      <Drawer open={detail != null} onOpenChange={(o) => !o && setDetail(null)}>
        <DrawerContent className="max-h-[88vh]">
          <DrawerHeader>
            <DrawerTitle>
              {detail === 'loja' && 'Barbearia em operação'}
              {detail === 'equipe' && 'Barbeiros na escala hoje'}
              {detail === 'espera' && 'Tempo médio de espera'}
              {detail === 'fat' && 'Faturamento de hoje'}
              {detail === 'atend' && 'Atendimentos concluídos'}
              {detail === 'vendas' && 'Vendas de produtos'}
            </DrawerTitle>
            <DrawerDescription className="text-left">
              {!operacaoLiberada && detail != null && detail !== 'loja' && (
                <span className="text-amber-700 dark:text-amber-400 mb-2 block text-xs font-medium">
                  Com o plano pendente, os atalhos levam à assinatura até a liberação completa do painel.
                </span>
              )}
              {detail === 'loja' && barbearia && (
                <>
                  Status calculado com base nos dias de funcionamento e horários cadastrados em{' '}
                  <span className="font-medium">{barbearia.nome}</span>. Ajuste em configurações se algo não refletir a
                  operação real.
                </>
              )}
              {detail === 'equipe' && (
                <>
                  Mostramos quantos profissionais têm escala ativa hoje (tabela de horários) em relação ao total de
                  barbeiros ativos na equipe.
                </>
              )}
              {detail === 'espera' && (
                <>
                  Estimativa a partir de agendamentos de hoje ainda marcados como &quot;agendado&quot; cujo horário já
                  passou: medimos o atraso médio em relação ao horário marcado (proxy de pressão na fila).
                </>
              )}
              {detail === 'fat' && (
                <>
                  A meta diária é a média de faturamento concluído dos últimos dias (exceto hoje), com piso mínimo para
                  evitar divisão por zero. O anel mostra quanto do objetivo já foi atingido.
                </>
              )}
              {detail === 'atend' && (
                <>
                  Meta baseada na média de atendimentos concluídos por dia nos últimos 14 dias (exceto hoje), com folga
                  de 5% para crescimento leve.
                </>
              )}
              {detail === 'vendas' && (
                <>
                  Soma das quantidades vendidas em comandas fechadas hoje (linhas de produto). A variação compara com o
                  mesmo dia da semana anterior.
                </>
              )}
            </DrawerDescription>
          </DrawerHeader>
          <div className="text-foreground space-y-3 px-4 pb-2 text-sm">
            {detail === 'loja' && status && (
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Estado: {status.lojaAberta ? 'Aberto para clientes' : 'Fora do horário cadastrado'}</li>
                <li>{status.lojaDetalhe}</li>
              </ul>
            )}
            {detail === 'equipe' && status && (
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>
                  Na escala hoje: {status.barbeirosEscalados} de {status.barbeirosAtivos}
                </li>
                <li>{folgaLabel}</li>
              </ul>
            )}
            {detail === 'espera' && status && (
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Valor exibido: {tempoTexto}</li>
                <li>Leitura: {status.tempoEsperaLegenda}</li>
              </ul>
            )}
            {detail === 'fat' && status && (
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Hoje: {formatCurrency(status.faturamentoHoje)}</li>
                <li>Meta estimada: {formatCurrency(status.metaFaturamento)}</li>
                <li>Progresso: {pctFat}%</li>
              </ul>
            )}
            {detail === 'atend' && status && (
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Concluídos hoje: {status.atendimentosConcluidos}</li>
                <li>Meta estimada: {status.metaAtendimentos}</li>
                <li>Progresso: {pctAt}%</li>
              </ul>
            )}
            {detail === 'vendas' && status && (
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Unidades vendidas hoje: {status.vendasProdutosUnidades}</li>
                <li>Mesmo dia semana anterior: {status.vendasSemanaAnterior}</li>
                <li>{vendasVarLabel}</li>
              </ul>
            )}
          </div>
          <DrawerFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {detail === 'loja' && (
              <Button asChild>
                <Link href={`${base}/configuracoes`}>Horários da barbearia</Link>
              </Button>
            )}
            {detail === 'equipe' && operacaoLiberada && (
              <Button asChild>
                <Link href={`${base}/equipe`}>Ver equipe</Link>
              </Button>
            )}
            {detail === 'equipe' && !operacaoLiberada && (
              <Button asChild>
                <Link href={`${base}/assinatura`}>Ver assinatura</Link>
              </Button>
            )}
            {detail === 'espera' && operacaoLiberada && (
              <Button asChild>
                <Link href={`${base}/agendamentos`}>Ver agendamentos</Link>
              </Button>
            )}
            {detail === 'espera' && !operacaoLiberada && (
              <Button asChild>
                <Link href={`${base}/assinatura`}>Ver assinatura</Link>
              </Button>
            )}
            {detail === 'fat' && operacaoLiberada && (
              <Button asChild>
                <Link href={`${base}/financeiro`}>Ver financeiro</Link>
              </Button>
            )}
            {detail === 'fat' && !operacaoLiberada && (
              <Button asChild>
                <Link href={`${base}/assinatura`}>Ver assinatura</Link>
              </Button>
            )}
            {detail === 'atend' && operacaoLiberada && (
              <Button asChild>
                <Link href={`${base}/agendamentos`}>Ver agendamentos</Link>
              </Button>
            )}
            {detail === 'atend' && !operacaoLiberada && (
              <Button asChild>
                <Link href={`${base}/assinatura`}>Ver assinatura</Link>
              </Button>
            )}
            {detail === 'vendas' && operacaoLiberada && (
              <Button asChild>
                <Link href={`${base}/estoque`}>Ver estoque</Link>
              </Button>
            )}
            {detail === 'vendas' && !operacaoLiberada && (
              <Button asChild>
                <Link href={`${base}/assinatura`}>Ver assinatura</Link>
              </Button>
            )}
            <DrawerClose asChild>
              <Button variant="outline">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
