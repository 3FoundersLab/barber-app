/** Curva premium: suave, sem “bounce” genérico. */
export const LANDING_EASE = [0.22, 1, 0.36, 1] as const

/** Uma vez por seção; margem evita disparo ao rolar rápido demais. */
export const LANDING_VIEWPORT = { once: true, margin: '-70px 0px', amount: 0.12 } as const

export const fadeUpHidden = { opacity: 0, y: 26 }
export const fadeUpVisible = {
  opacity: 1,
  y: 0,
  transition: { duration: 0.58, ease: LANDING_EASE },
}

/** Container com cascata para listas de cards. */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.085, delayChildren: 0.05 },
  },
} as const

export const staggerItem = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.52, ease: LANDING_EASE },
  },
} as const

/** Bloco de texto do hero (carregamento inicial). */
export const heroStaggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.11, delayChildren: 0.06 },
  },
} as const

export const heroStaggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: LANDING_EASE },
  },
} as const

/** Foto / mockup, discreto. */
export const heroImageReveal = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.72, ease: LANDING_EASE, delay: 0.12 },
  },
} as const
