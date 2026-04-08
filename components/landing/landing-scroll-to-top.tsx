'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { LANDING_SECTIONS } from '@/components/landing/constants'
import { cn } from '@/lib/utils'

const SHOW_AFTER = 380

export function LandingScrollToTop() {
  const [visible, setVisible] = useState(false)
  const reduceMotion = useReducedMotion() === true

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTop = useCallback(() => {
    const el = document.getElementById(LANDING_SECTIONS.top)
    if (el) {
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    }
  }, [reduceMotion])

  return (
    <AnimatePresence mode="wait">
      {visible ? (
        <motion.button
          key="scroll-top"
          type="button"
          aria-label="Voltar ao topo da página"
          initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.92 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          onClick={scrollTop}
          className={cn(
            'fixed z-[38] flex size-12 items-center justify-center rounded-full',
            'border border-orange-200/80 bg-white/85 text-[#ea580c] shadow-lg shadow-orange-500/10',
            'backdrop-blur-md ring-1 ring-zinc-950/[0.04]',
            'dark:border-amber-500/25 dark:bg-zinc-950/85 dark:text-amber-400 dark:shadow-black/40 dark:ring-white/10',
            'bottom-[5.75rem] right-4 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:bottom-8 sm:right-6 lg:bottom-8',
            'hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/20 active:translate-y-0 active:scale-100 dark:hover:shadow-amber-500/15',
          )}
        >
          <ArrowUp className="size-5" aria-hidden strokeWidth={2.25} />
        </motion.button>
      ) : null}
    </AnimatePresence>
  )
}
