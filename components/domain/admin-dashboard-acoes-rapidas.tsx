'use client'

import Link from 'next/link'
import {
  Banknote,
  BarChart3,
  CalendarPlus,
  LayoutGrid,
  MessageSquare,
  Scissors,
  UserPlus,
  Wallet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const tileClass =
  'border-border/80 bg-card text-card-foreground flex min-h-[118px] flex-col items-center justify-center gap-2 rounded-xl border p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/90 hover:shadow-md dark:hover:border-orange-900/40 dark:hover:bg-orange-950/25'

export function AdminDashboardAcoesRapidas(props: { base: string; operacaoLiberada: boolean }) {
  const { base, operacaoLiberada } = props

  const items = operacaoLiberada
    ? [
        { href: `${base}/agendamentos`, icon: CalendarPlus, line1: 'Novo', line2: 'agendamento' },
        { href: `${base}/comandas`, icon: Scissors, line1: 'Novo', line2: 'atendimento' },
        { href: `${base}/clientes`, icon: UserPlus, line1: 'Cadastrar', line2: 'cliente' },
        { href: `${base}/comandas`, icon: Banknote, line1: 'Venda', line2: 'rápida' },
        { href: `${base}/clientes`, icon: MessageSquare, line1: 'Enviar', line2: 'mensagem' },
        { href: `${base}/relatorios`, icon: BarChart3, line1: 'Ver', line2: 'relatórios' },
      ]
    : [
        { href: `${base}/assinatura`, icon: Wallet, line1: 'Ver', line2: 'assinatura' },
        { href: `${base}/configuracoes`, icon: LayoutGrid, line1: 'Configurações', line2: '' },
      ]

  return (
    <Card className="border-border/80 rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold tracking-tight text-gray-900 dark:text-foreground">
          Ações rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className={cn(
            'grid gap-3',
            operacaoLiberada ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 max-w-md',
          )}
        >
          {items.map((item, index) => {
            const I = item.icon
            return (
              <Link
                key={`${item.href}-${item.line1}-${item.line2}-${index}`}
                href={item.href}
                className={tileClass}
              >
                <I className="size-9 shrink-0 text-orange-600 dark:text-orange-500" strokeWidth={1.75} aria-hidden />
                <span className="text-muted-foreground max-w-[6.5rem] text-xs font-medium leading-tight">
                  <span className="block">{item.line1}</span>
                  {item.line2 ? <span className="block">{item.line2}</span> : null}
                </span>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
