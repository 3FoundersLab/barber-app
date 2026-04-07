'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 280

export type BarbeariaOption = { id: string; nome: string }

type BarbeariasMultiSelectProps = {
  id?: string
  label?: string
  options: BarbeariaOption[]
  value: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
  /** Incrementar ao abrir o diálogo para limpar o texto de busca */
  resetSearchToken?: number
  className?: string
}

export function BarbeariasMultiSelect({
  id,
  label = 'Barbearias',
  options,
  value,
  onChange,
  disabled,
  resetSearchToken = 0,
  className,
}: BarbeariasMultiSelectProps) {
  const [search, setSearch] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(search.trim()), DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setSearch('')
  }, [resetSearchToken])

  const selectedSet = useMemo(() => new Set(value), [value])

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase()
    if (!q) return options
    return options.filter((b) => b.nome.toLowerCase().includes(q))
  }, [options, debouncedQuery])

  function toggle(barId: string, checked: boolean) {
    if (checked) {
      if (!selectedSet.has(barId)) onChange([...value, barId])
    } else {
      onChange(value.filter((x) => x !== barId))
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <Label htmlFor={id} className={cn(disabled && 'text-muted-foreground')}>
          {label}
        </Label>
      ) : null}
      <div
        className={cn(
          'rounded-md border bg-background',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        <div className="relative border-b p-2">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={id}
            type="search"
            autoComplete="off"
            placeholder="Buscar barbearia por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={disabled}
            className="h-9 pl-9"
          />
        </div>
        <div
          className="max-h-52 overflow-y-auto p-2"
          role="listbox"
          aria-label={label}
          aria-multiselectable="true"
        >
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma barbearia encontrada
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((b) => {
                const checked = selectedSet.has(b.id)
                return (
                  <li key={b.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/60',
                        checked && 'bg-muted/50',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => toggle(b.id, c === true)}
                        disabled={disabled}
                        aria-label={b.nome}
                      />
                      <span className="min-w-0 flex-1 truncate">{b.nome}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        {value.length > 0 ? (
          <p className="border-t px-3 py-2 text-xs text-muted-foreground">
            {value.length === 1
              ? '1 barbearia selecionada'
              : `${value.length} barbearias selecionadas`}
          </p>
        ) : null}
      </div>
    </div>
  )
}
