'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type RegisteredPageHeading = {
  title: string
  subtitle?: ReactNode
  /** À direita do título (ex.: botão primário da página). */
  actions?: ReactNode
}

type CtxValue = {
  heading: RegisteredPageHeading | null
  setHeading: (h: RegisteredPageHeading | null) => void
}

const AppPageHeadingContext = createContext<CtxValue | null>(null)

export function AppPageHeadingProvider({ children }: { children: ReactNode }) {
  const [heading, setHeadingState] = useState<RegisteredPageHeading | null>(null)
  const setHeading = useCallback((h: RegisteredPageHeading | null) => {
    setHeadingState(h)
  }, [])
  const value = useMemo(() => ({ heading, setHeading }), [heading, setHeading])
  return (
    <AppPageHeadingContext.Provider value={value}>{children}</AppPageHeadingContext.Provider>
  )
}

export function useOptionalAppPageHeading() {
  return useContext(AppPageHeadingContext)
}
