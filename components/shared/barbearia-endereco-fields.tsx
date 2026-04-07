'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BarbeariaEnderecoParts } from '@/lib/barbearia-endereco'
import { cepDigits, fetchViaCep, formatCepMask } from '@/lib/viacep'
import { cn } from '@/lib/utils'

type Props = {
  value: BarbeariaEnderecoParts
  onChange: (next: BarbeariaEnderecoParts) => void
  disabled?: boolean
  idPrefix?: string
  className?: string
  /** Mostra o título da seção (evite confundir com o campo Logradouro). */
  showHeading?: boolean
  /** Mensagens de validação por campo (borda e texto abaixo do input). */
  fieldErrors?: Partial<Record<keyof BarbeariaEnderecoParts, string>>
}

export function BarbeariaEnderecoFields({
  value,
  onChange,
  disabled,
  idPrefix = 'endereco',
  className,
  showHeading = true,
  fieldErrors,
}: Props) {
  const [cepBusy, setCepBusy] = useState(false)
  const [cepMsg, setCepMsg] = useState<string | null>(null)
  const lastAppliedCep = useRef<string | null>(null)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  valueRef.current = value
  onChangeRef.current = onChange

  useEffect(() => {
    const d = cepDigits(value.cep)
    if (d.length !== 8) {
      lastAppliedCep.current = null
      setCepMsg(null)
      return
    }
    if (lastAppliedCep.current === d) return

    const ac = new AbortController()
    setCepBusy(true)
    setCepMsg(null)

    const t = setTimeout(() => {
      void (async () => {
        try {
          const data = await fetchViaCep(d, ac.signal)
          if (ac.signal.aborted) return
          if (!data) {
            setCepMsg('CEP não encontrado.')
            lastAppliedCep.current = null
            return
          }
          lastAppliedCep.current = d
          const cur = valueRef.current
          onChangeRef.current({
            ...cur,
            cep: formatCepMask(data.cep || d),
            logradouro: data.logradouro || cur.logradouro,
            complemento: data.complemento || cur.complemento,
            bairro: data.bairro || cur.bairro,
            cidade: data.localidade || cur.cidade,
            uf: (data.uf || cur.uf).toUpperCase().slice(0, 2),
          })
          setCepMsg(null)
        } catch {
          if (ac.signal.aborted) return
          setCepMsg('Não foi possível buscar o CEP.')
          lastAppliedCep.current = null
        } finally {
          if (!ac.signal.aborted) setCepBusy(false)
        }
      })()
    }, 400)

    return () => {
      clearTimeout(t)
      ac.abort()
    }
  }, [value.cep])

  const set = (patch: Partial<BarbeariaEnderecoParts>) => {
    onChange({ ...value, ...patch })
  }

  const fieldClass = 'w-full min-w-0 space-y-1.5'

  const errBorder = (key: keyof BarbeariaEnderecoParts) =>
    fieldErrors?.[key] ? 'border-destructive focus-visible:ring-destructive/40' : ''

  return (
    <div className={cn('w-full min-w-0 space-y-4', className)}>
      {showHeading ? (
        <div className="flex items-center gap-1.5 text-sm font-medium leading-snug">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          Localização
        </div>
      ) : null}

      <div className={fieldClass}>
        <Label htmlFor={`${idPrefix}-cep`}>CEP</Label>
        <div className="relative max-w-[11rem]">
          <Input
            id={`${idPrefix}-cep`}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={value.cep}
            disabled={disabled}
            aria-invalid={!!fieldErrors?.cep}
            onChange={(e) => {
              setCepMsg(null)
              lastAppliedCep.current = null
              set({ cep: formatCepMask(e.target.value) })
            }}
            className={cn('w-full', cepBusy && 'pr-9', errBorder('cep'))}
          />
          {cepBusy ? (
            <Loader2
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : null}
        </div>
        {fieldErrors?.cep ? <p className="text-xs text-destructive">{fieldErrors.cep}</p> : null}
        {cepMsg && !fieldErrors?.cep ? <p className="text-xs text-destructive">{cepMsg}</p> : null}
        <p className="text-xs text-muted-foreground">
          Ao completar o CEP, rua, bairro e cidade são preenchidos automaticamente.
        </p>
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_5.5rem] sm:items-end">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`${idPrefix}-logradouro`}>Rua</Label>
          <Input
            id={`${idPrefix}-logradouro`}
            autoComplete="street-address"
            placeholder="Rua, avenida…"
            value={value.logradouro}
            disabled={disabled}
            aria-invalid={!!fieldErrors?.logradouro}
            onChange={(e) => set({ logradouro: e.target.value })}
            className={errBorder('logradouro')}
          />
          {fieldErrors?.logradouro ? (
            <p className="text-xs text-destructive">{fieldErrors.logradouro}</p>
          ) : null}
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`${idPrefix}-numero`}>Número</Label>
          <Input
            id={`${idPrefix}-numero`}
            autoComplete="address-line2"
            placeholder="Nº"
            value={value.numero}
            disabled={disabled}
            aria-invalid={!!fieldErrors?.numero}
            className={cn('w-full', errBorder('numero'))}
            onChange={(e) => set({ numero: e.target.value })}
          />
          {fieldErrors?.numero ? <p className="text-xs text-destructive">{fieldErrors.numero}</p> : null}
        </div>
      </div>

      <div className={fieldClass}>
        <Label htmlFor={`${idPrefix}-complemento`}>Complemento</Label>
        <Input
          id={`${idPrefix}-complemento`}
          placeholder="Apto, sala, bloco…"
          value={value.complemento}
          disabled={disabled}
          aria-invalid={!!fieldErrors?.complemento}
          onChange={(e) => set({ complemento: e.target.value })}
          className={errBorder('complemento')}
        />
        {fieldErrors?.complemento ? (
          <p className="text-xs text-destructive">{fieldErrors.complemento}</p>
        ) : null}
      </div>

      <div className="w-full min-w-0 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Bairro · cidade · estado</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
          <div className="min-w-0 space-y-1.5 sm:col-span-5">
            <Label htmlFor={`${idPrefix}-bairro`}>Bairro</Label>
            <Input
              id={`${idPrefix}-bairro`}
              placeholder="Bairro"
              value={value.bairro}
              disabled={disabled}
              aria-invalid={!!fieldErrors?.bairro}
              onChange={(e) => set({ bairro: e.target.value })}
              className={errBorder('bairro')}
            />
            {fieldErrors?.bairro ? <p className="text-xs text-destructive">{fieldErrors.bairro}</p> : null}
          </div>
          <div className="min-w-0 space-y-1.5 sm:col-span-5">
            <Label htmlFor={`${idPrefix}-cidade`}>Cidade</Label>
            <Input
              id={`${idPrefix}-cidade`}
              autoComplete="address-level2"
              placeholder="Cidade"
              value={value.cidade}
              disabled={disabled}
              aria-invalid={!!fieldErrors?.cidade}
              onChange={(e) => set({ cidade: e.target.value })}
              className={errBorder('cidade')}
            />
            {fieldErrors?.cidade ? <p className="text-xs text-destructive">{fieldErrors.cidade}</p> : null}
          </div>
          <div className="min-w-0 space-y-1.5 sm:col-span-2">
            <Label htmlFor={`${idPrefix}-uf`}>UF</Label>
            <Input
              id={`${idPrefix}-uf`}
              autoComplete="address-level1"
              placeholder="SP"
              maxLength={2}
              value={value.uf}
              disabled={disabled}
              aria-invalid={!!fieldErrors?.uf}
              className={cn('w-full uppercase', errBorder('uf'))}
              onChange={(e) => set({ uf: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) })}
            />
            {fieldErrors?.uf ? <p className="text-xs text-destructive">{fieldErrors.uf}</p> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
