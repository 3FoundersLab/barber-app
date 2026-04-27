'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function EstoqueCritico(props: {
  base: string
  estoqueCritico: { nome: string; quantidade: number; minimo: number }[]
  isLoading: boolean
  error: string | null
  operacaoLiberada: boolean
}) {
  const { base, estoqueCritico, isLoading, error, operacaoLiberada } = props
  const nCrit = estoqueCritico.length

  return (
    <Card className="border-border/80 overflow-hidden">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-base font-semibold">Estoque crítico</CardTitle>
        {nCrit > 0 ? (
          <Badge
            variant="secondary"
            className="border border-red-200 bg-red-50 font-semibold text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200"
          >
            {nCrit} {nCrit === 1 ? 'produto' : 'produtos'}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-muted-foreground font-medium">
            OK
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {error || isLoading ? (
          <div className="bg-muted h-32 animate-pulse rounded-md" />
        ) : !operacaoLiberada ? (
          <p className="text-muted-foreground text-sm">
            Disponível após a ativação do plano. Acompanhe produtos abaixo do mínimo e evite ruptura.
          </p>
        ) : nCrit === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum item abaixo do mínimo no momento.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full min-w-[240px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2">Produto</th>
                    <th className="px-3 py-2 text-right">Estoque</th>
                    <th className="px-3 py-2 text-right">Mín.</th>
                  </tr>
                </thead>
                <tbody>
                  {estoqueCritico.map((p) => (
                    <tr key={p.nome} className="border-b border-border/40 last:border-0">
                      <td className="px-3 py-2 font-medium text-red-700 dark:text-red-400">{p.nome}</td>
                      <td className="text-destructive px-3 py-2 text-right font-semibold tabular-nums">
                        {p.quantidade}
                      </td>
                      <td className="text-muted-foreground px-3 py-2 text-right tabular-nums">{p.minimo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              asChild
              className="w-full border-red-200 bg-red-50 font-semibold text-red-800 shadow-sm hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100 dark:hover:bg-red-950/70"
              variant="outline"
            >
              <Link href={`${base}/estoque`} className="inline-flex items-center justify-center gap-2">
                <AlertTriangle className="size-4 shrink-0" aria-hidden />
                Ver estoque completo
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
