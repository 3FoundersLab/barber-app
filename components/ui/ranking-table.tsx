'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type RankingTableBaseRow = {
  id: string
  name: string
  value: number
  avatarUrl?: string | null
}

export type RankingTableProps<T extends RankingTableBaseRow> = {
  rows: T[]
  /** Cabeçalho da coluna numérica (ordenável). */
  valueHeader?: string
  formatValue?: (n: number) => string
  pageSize?: number
  exportFileName?: string
  /** Cabeçalhos completos do CSV (deve alinhar com `toCsvCells`). */
  csvHeaders?: string[]
  /** Células por linha, na mesma ordem de `csvHeaders` (ou padrão). */
  toCsvCells?: (row: T, rank: number) => (string | number)[]
  className?: string
}

type SortKey = 'value' | 'name'
type SortDir = 'asc' | 'desc'

function medalLabel(zeroBasedIndex: number): string {
  if (zeroBasedIndex === 0) return '🥇'
  if (zeroBasedIndex === 1) return '🥈'
  if (zeroBasedIndex === 2) return '🥉'
  return `${zeroBasedIndex + 1}º`
}

function escapeCsvCell(v: string | number): string {
  const s = String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCsv(filename: string, headers: string[], lines: (string | number)[][]) {
  const body = [headers.join(','), ...lines.map((line) => line.map(escapeCsvCell).join(','))].join('\r\n')
  const blob = new Blob(['\ufeff', body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase()
}

export function RankingTable<T extends RankingTableBaseRow>({
  rows,
  valueHeader = 'Valor',
  formatValue = (n) => String(n),
  pageSize = 10,
  exportFileName = 'ranking.csv',
  csvHeaders,
  toCsvCells,
  className,
}: RankingTableProps<T>) {
  const [sortKey, setSortKey] = useState<SortKey>('value')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, pageCount - 1)))
  }, [pageCount])

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      if (sortKey === 'name') {
        const c = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
        return sortDir === 'asc' ? c : -c
      }
      const d = a.value - b.value
      return sortDir === 'asc' ? d : -d
    })
    return copy
  }, [rows, sortKey, sortDir])

  const maxValue = useMemo(() => Math.max(1, ...sorted.map((r) => r.value)), [sorted])

  const safePage = Math.min(page, pageCount - 1)
  const pageRows = useMemo(() => {
    const start = safePage * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, safePage, pageSize])

  const toggleSort = useCallback((key: SortKey) => {
    setPage(0)
    setSortKey((prevKey) => {
      if (prevKey !== key) {
        setSortDir(key === 'value' ? 'desc' : 'asc')
        return key
      }
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return prevKey
    })
  }, [])

  const exportCsv = useCallback(() => {
    const headers = csvHeaders ?? ['Posição', 'Nome', valueHeader]
    const lines: (string | number)[][] = sorted.map((row, i) => {
      if (toCsvCells) return toCsvCells(row, i + 1)
      return [i + 1, row.name, row.value]
    })
    downloadCsv(exportFileName, headers, lines)
  }, [csvHeaders, exportFileName, sorted, toCsvCells, valueHeader])

  const SortHint = ({ active, dir }: { active: boolean; dir: SortDir }) =>
    active ? (
      dir === 'asc' ? (
        <ArrowUp className="size-3.5 shrink-0 opacity-70" aria-hidden />
      ) : (
        <ArrowDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
      )
    ) : null

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
          <Download className="size-3.5" aria-hidden />
          Exportar CSV
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                onClick={() => toggleSort('name')}
              >
                Barbeiro
                <SortHint active={sortKey === 'name'} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="hidden w-[min(12rem,28vw)] sm:table-cell">Comparativo</TableHead>
            <TableHead className="text-right">
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1 font-medium hover:text-foreground"
                onClick={() => toggleSort('value')}
              >
                {valueHeader}
                <SortHint active={sortKey === 'value'} dir={sortDir} />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((row) => {
            const globalIndex = sorted.indexOf(row)
            const pct = Math.round((row.value / maxValue) * 1000) / 10
            return (
              <TableRow key={row.id}>
                <TableCell className="text-center text-base tabular-nums">{medalLabel(globalIndex)}</TableCell>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-8">
                      {row.avatarUrl ? <AvatarImage src={row.avatarUrl} alt="" /> : null}
                      <AvatarFallback className="text-[10px] font-medium">{initials(row.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium">{row.name}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Progress value={pct} className="h-2 max-w-[12rem]" aria-label={`${pct}% do líder`} />
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatValue(row.value)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={safePage <= 0}
            onClick={() => safePage > 0 && setPage(safePage - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            Página {safePage + 1} de {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={safePage >= pageCount - 1}
            onClick={() => safePage < pageCount - 1 && setPage(safePage + 1)}
            aria-label="Próxima página"
          >
            Próxima
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
