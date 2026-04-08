'use client'

import { motion, useReducedMotion } from 'framer-motion'

type Mote = { x: string; y: string; size: number; duration: number; delay: number; blur: number }

const CTA_MOTES: Mote[] = [
  { x: '8%', y: '22%', size: 3, duration: 5.2, delay: 0, blur: 3 },
  { x: '18%', y: '68%', size: 2, duration: 6.1, delay: 0.6, blur: 2 },
  { x: '42%', y: '14%', size: 2, duration: 4.8, delay: 1.1, blur: 2 },
  { x: '88%', y: '38%', size: 3, duration: 5.6, delay: 0.3, blur: 3 },
  { x: '72%', y: '78%', size: 2, duration: 7, delay: 0.9, blur: 2 },
  { x: '55%', y: '52%', size: 1.5, duration: 5, delay: 1.4, blur: 1 },
]

const FOOTER_MOTES: Mote[] = [
  { x: '6%', y: '12%', size: 2.5, duration: 6, delay: 0, blur: 2 },
  { x: '92%', y: '20%', size: 2, duration: 5.4, delay: 0.5, blur: 2 },
  { x: '78%', y: '55%', size: 2, duration: 6.8, delay: 1, blur: 2 },
  { x: '15%', y: '70%', size: 1.5, duration: 5.2, delay: 0.8, blur: 1 },
]

const LOGIN_MOTES: Mote[] = [
  { x: '12%', y: '18%', size: 2.5, duration: 5.4, delay: 0, blur: 2 },
  { x: '88%', y: '28%', size: 2, duration: 6.2, delay: 0.4, blur: 2 },
  { x: '72%', y: '72%', size: 2.5, duration: 5.8, delay: 0.9, blur: 2 },
  { x: '38%', y: '58%', size: 1.5, duration: 5, delay: 1.2, blur: 1 },
  { x: '52%', y: '12%', size: 2, duration: 6.5, delay: 0.2, blur: 2 },
]

/**
 * Pontos de luz mínimos (só opacity + leve scale): custo baixo, efeito premium.
 */
export function LandingAmbientMotes({ preset }: { preset: 'cta' | 'footer' | 'login' }) {
  const reduceMotion = useReducedMotion() === true
  const motes =
    preset === 'cta' ? CTA_MOTES : preset === 'footer' ? FOOTER_MOTES : LOGIN_MOTES

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {motes.map((m, i) => (
        <motion.div
          key={`${preset}-${i}`}
          className="absolute rounded-full bg-cyan-300/30"
          style={{
            left: m.x,
            top: m.y,
            width: m.size,
            height: m.size,
            filter: `blur(${m.blur}px)`,
            willChange: reduceMotion ? undefined : 'opacity, transform',
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  opacity: [0.12, 0.42, 0.12],
                  scale: [1, 1.35, 1],
                }
          }
          transition={{
            duration: m.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: m.delay,
          }}
        />
      ))}
    </div>
  )
}
