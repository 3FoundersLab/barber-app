import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://barberapp.com.br'),
  title: {
    default: 'BarberApp, software para barbearia | Agenda, clientes e caixa',
    template: '%s | BarberApp',
  },
  description:
    'Software para barbearia com agendamento online, equipe alinhada e controle financeiro. Menos caos no WhatsApp, mais horários preenchidos. Teste grátis.',
  keywords: [
    'software para barbearia',
    'sistema de agendamento para barbearia',
    'gestão de barbearia',
    'agenda barbearia online',
    'app barbearia',
    'controle financeiro barbearia',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'BarberApp',
    title: 'BarberApp, software para barbearia',
    description:
      'Agenda, clientes e caixa na mesma tela. Sistema de gestão feito para donos e barbeiros. Comece grátis.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BarberApp, software para barbearia',
    description: 'Agenda cheia, equipe organizada e caixa claro. Teste grátis.',
  },
  robots: { index: true, follow: true },
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="barber-app-theme"
          disableTransitionOnChange={false}
        >
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
