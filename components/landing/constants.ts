/** Âncoras da landing (scroll suave). */
export const LANDING_SECTIONS = {
  top: 'inicio',
  desafios: 'desafios',
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

/** Copy dos CTAs — tom de bancada; alinhar à oferta real (trial, cartão, etc.). */
export const LANDING_CTA = {
  primary: 'Abrir minha conta agora',
  /** Atalho no header (pílula, estilo SaaS). */
  navPrimary: 'Começar grátis',
  navSecondary: 'Já sou cliente',
  trial: 'Testar 7 dias grátis',
  urgency: 'Só cadastro · em dois minutos você já marca horário',
  urgencyBanner: 'Quem entra agora monta a grade antes do fim do mês',
} as const
