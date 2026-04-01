'use client'

import { Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  debounceMs?: number
  className?: string
}

export function SearchInput({
  placeholder = 'Buscar...',
  value: controlledValue,
  onChange,
  onSearch,
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const value = controlledValue !== undefined ? controlledValue : internalValue

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value

      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }

      onChange?.(newValue)

      if (!onSearch) return

      if (debounceMs > 0) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          debounceRef.current = null
          startTransition(() => {
            onSearch(newValue)
          })
        }, debounceMs)
      } else {
        startTransition(() => {
          onSearch(newValue)
        })
      }
    },
    [controlledValue, onChange, onSearch, debounceMs, startTransition]
  )

  const handleClear = useCallback(() => {
    if (controlledValue === undefined) {
      setInternalValue('')
    }
    onChange?.('')
    onSearch?.('')
  }, [controlledValue, onChange, onSearch])

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="pl-9 pr-9"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Limpar busca</span>
        </Button>
      )}
      {isPending && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  )
}
