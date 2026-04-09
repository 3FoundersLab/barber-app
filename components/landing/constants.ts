/** Âncoras da landing (scroll suave), ordem tipo sales page. */
export const LANDING_SECTIONS = {
  top: 'inicio',
  problema: 'problema',
  solucao: 'solucao',
  beneficios: 'beneficios',
  funcionalidades: 'funcionalidades',
  provaSocial: 'prova-social',
  comoFunciona: 'como-funciona',
  planos: 'planos',
} as const

export const LANDING_LINKS = {
  cadastro: '/cadastro/barbearia',
  login: '/login',
} as const

/** Copy dos CTAs: conversão e clareza. */
export const LANDING_CTA = {
  primary: 'Começar gratuitamente',
  navPrimary: 'Começar grátis',
  navSecondary: 'Já sou cliente',
  trial: 'Testar 7 dias grátis',
  urgency: 'Cadastro rápido: em poucos minutos você já usa na bancada',
  urgencyBanner: 'Quem entra agora organiza a grade antes do fim do mês',
} as const

/** SEO / meta: palavras-chave usadas de forma natural no corpo da página. */
export const LANDING_SEO = {
  siteName: 'BarberTool',
  title: 'BarberTool, software para barbearia | Agenda, clientes e caixa',
  description:
    'Software para barbearia com agendamento online, gestão da equipe e controle financeiro. Menos caos no WhatsApp, mais horários preenchidos e caixa claro. Teste grátis.',
  keywords: [
    'software para barbearia',
    'sistema de agendamento para barbearia',
    'gestão de barbearia',
    'agenda barbearia online',
    'app barbearia',
    'controle financeiro barbearia',
  ],
} as const
