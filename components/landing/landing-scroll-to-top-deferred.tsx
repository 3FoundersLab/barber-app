'use client'

import dynamic from 'next/dynamic'

/** Carrega só no cliente: não bloqueia SSR nem o bundle inicial da home. */
export const LandingScrollToTopDeferred = dynamic(
  () => import('./landing-scroll-to-top').then((m) => ({ default: m.LandingScrollToTop })),
  { ssr: false },
)
