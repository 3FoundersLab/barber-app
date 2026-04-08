'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

type CarouselUiContextValue = {
  selectedIndex: number
  slideCount: number
}

const CarouselUiContext = createContext<CarouselUiContextValue | null>(null)

/** Indica se o slide no índice dado está selecionado (snap ativo). */
export function useLandingCarouselSlideActive(slideIndex: number) {
  const ctx = useContext(CarouselUiContext)
  if (!ctx) return false
  return ctx.selectedIndex === slideIndex
}

type LandingPremiumCarouselProps = {
  children: ReactNode
  className?: string
  /** Carrossel escuro (benefícios / hero-adjacente). */
  theme?: 'dark'
  /** Repete do primeiro após o último. */
  loop?: boolean
  /** Duração relativa do scroll (Embla; maior = mais lento). */
  scrollDuration?: number
  /** Nome acessível: use o id do título da seção quando existir. */
  labelledBy?: string
}

/**
 * Carrossel horizontal com Embla: arraste (mouse/touch), setas, dots, contador e teclado (foco no bloco).
 */
export function LandingPremiumCarousel({
  children,
  className,
  theme = 'dark',
  loop = false,
  scrollDuration = 32,
  labelledBy,
}: LandingPremiumCarouselProps) {
  const id = useId()
  const fallbackLabelId = `${id}-carousel-hint`
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop,
    align: 'start',
    duration: scrollDuration,
    dragFree: false,
    skipSnaps: false,
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [snapCount, setSnapCount] = useState(0)

  const updateState = useCallback((api: NonNullable<typeof emblaApi>) => {
    setSelectedIndex(api.selectedScrollSnap())
    setSnapCount(api.scrollSnapList().length)
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    updateState(emblaApi)
    const onSelect = () => updateState(emblaApi)
    const onReInit = () => updateState(emblaApi)
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onReInit)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onReInit)
    }
  }, [emblaApi, updateState])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  const canPrev = emblaApi?.canScrollPrev() ?? false
  const canNext = emblaApi?.canScrollNext() ?? false

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        scrollPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        scrollNext()
      } else if (e.key === 'Home') {
        e.preventDefault()
        scrollTo(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        scrollTo(Math.max(0, snapCount - 1))
      }
    },
    [scrollPrev, scrollNext, scrollTo, snapCount],
  )

  const isDark = theme === 'dark'
  const arrowBtn = cn(
    'inline-flex size-11 shrink-0 items-center justify-center rounded-full border transition-[border-color,background-color,box-shadow,transform,color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:size-12',
    isDark
      ? 'border-white/16 bg-white/[0.06] text-white shadow-sm shadow-black/20 backdrop-blur-sm hover:border-white/26 hover:bg-white/12 hover:shadow-md disabled:pointer-events-none disabled:opacity-35'
      : 'border-zinc-200 bg-white text-zinc-900 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-35',
  )

  const slideItems = Children.toArray(children).filter(isValidElement)
  const regionLabelledBy = labelledBy ?? fallbackLabelId

  return (
    <CarouselUiContext.Provider value={{ selectedIndex, slideCount: snapCount }}>
      <div
        className={cn('relative', className)}
        role="region"
        aria-roledescription="carrossel"
        aria-labelledby={regionLabelledBy}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {!labelledBy ? (
          <p id={fallbackLabelId} className="sr-only">
            Use as setas para navegar entre os slides, ou arraste horizontalmente. Teclas: setas esquerda e direita, Início e
            Fim.
          </p>
        ) : null}

        <div className="relative px-10 sm:px-12 lg:px-14">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex [touch-action:pan-y_pinch-zoom]">
              {slideItems.map((child, i) => (
                <div
                  key={child.key ?? `slide-${i}`}
                  className="min-w-0 flex-[0_0_100%]"
                  aria-hidden={selectedIndex !== i}
                  {...(selectedIndex !== i ? ({ inert: true } as const) : {})}
                >
                  {child}
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between sm:left-0 sm:right-0 lg:-left-2 lg:-right-2">
            <button
              type="button"
              className={cn(arrowBtn, 'pointer-events-auto ml-0 sm:-ml-1')}
              onClick={scrollPrev}
              disabled={!canPrev}
              aria-label="Slide anterior"
            >
              <ChevronLeft className="size-5 sm:size-6" aria-hidden />
            </button>
            <button
              type="button"
              className={cn(arrowBtn, 'pointer-events-auto mr-0 sm:-mr-1')}
              onClick={scrollNext}
              disabled={!canNext}
              aria-label="Próximo slide"
            >
              <ChevronRight className="size-5 sm:size-6" aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:mt-12" role="group" aria-label="Indicadores do carrossel">
          {Array.from({ length: snapCount }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-current={selectedIndex === i ? 'true' : undefined}
              aria-label={`Ir para o slide ${i + 1}`}
              className={cn(
                'h-2 rounded-full transition-[width,background-color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                selectedIndex === i
                  ? isDark
                    ? 'w-8 bg-cyan-400/90'
                    : 'w-8 bg-zinc-900'
                  : isDark
                    ? 'w-2 bg-white/20 hover:bg-white/35'
                    : 'w-2 bg-zinc-300 hover:bg-zinc-400',
              )}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      </div>
    </CarouselUiContext.Provider>
  )
}
