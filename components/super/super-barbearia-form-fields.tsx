'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { BarbeariaEnderecoFields } from '@/components/shared/barbearia-endereco-fields'
import { maskTelefoneBr, normalizeEmailInput } from '@/lib/format-contato'
import { slugifyBarbeariaSlug, type SuperBarbeariaFormState } from '@/lib/super-barbearia-form'

type Props = {
  value: SuperBarbeariaFormState
  onChange: (next: SuperBarbeariaFormState) => void
  slugAutofill: boolean
  onSlugAutofillChange: (autofill: boolean) => void
  showAtivo: boolean
  idPrefix: string
  disabled?: boolean
}

export function SuperBarbeariaFormFields({
  value,
  onChange,
  slugAutofill,
  onSlugAutofillChange,
  showAtivo,
  idPrefix,
  disabled,
}: Props) {
  return (
    <div className="min-w-0 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`${idPrefix}-nome`} required>
            Nome
          </Label>
          <Input
            id={`${idPrefix}-nome`}
            value={value.nome}
            disabled={disabled}
            aria-required="true"
            onChange={(e) => {
              const nome = e.target.value
              onChange({
                ...value,
                nome,
                ...(slugAutofill ? { slug: slugifyBarbeariaSlug(nome) } : {}),
              })
            }}
          />
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`${idPrefix}-slug`} required>
            Slug
          </Label>
          <Input
            id={`${idPrefix}-slug`}
            value={value.slug}
            disabled={disabled}
            aria-required="true"
            onChange={(e) => {
              onSlugAutofillChange(false)
              onChange({ ...value, slug: slugifyBarbeariaSlug(e.target.value) })
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`${idPrefix}-telefone`}>Telefone</Label>
          <Input
            id={`${idPrefix}-telefone`}
            value={value.telefone}
            disabled={disabled}
            autoComplete="tel"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            onChange={(e) => onChange({ ...value, telefone: maskTelefoneBr(e.target.value) })}
          />
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`${idPrefix}-email`}>Email</Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            value={value.email}
            disabled={disabled}
            autoComplete="email"
            inputMode="email"
            placeholder="contato@exemplo.com"
            onChange={(e) => onChange({ ...value, email: normalizeEmailInput(e.target.value) })}
          />
        </div>
      </div>
      <BarbeariaEnderecoFields
        idPrefix={`${idPrefix}-endereco`}
        value={value.enderecoParts}
        onChange={(enderecoParts) => onChange({ ...value, enderecoParts })}
        disabled={disabled}
      />
      {showAtivo ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-3">
          <div className="space-y-0.5">
            <Label htmlFor={`${idPrefix}-ativo`} className="text-sm font-medium">
              Barbearia ativa
            </Label>
            <p className="text-xs text-muted-foreground">
              Inativas permanecem no sistema, mas ficam marcadas como inativas.
            </p>
          </div>
          <Switch
            id={`${idPrefix}-ativo`}
            checked={value.ativo}
            disabled={disabled}
            onCheckedChange={(checked) => onChange({ ...value, ativo: checked })}
          />
        </div>
      ) : null}
    </div>
  )
}
