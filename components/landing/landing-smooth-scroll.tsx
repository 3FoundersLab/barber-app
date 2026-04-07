'use client'

import { useEffect } from 'react'

export function LandingSmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement
    html.classList.add('scroll-smooth')
    return () => html.classList.remove('scroll-smooth')
  }, [])
  return <>{children}</>
}
