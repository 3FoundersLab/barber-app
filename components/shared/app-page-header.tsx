'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { PageHeader } from '@/components/shared/page-container'
import { useOptionalAppPageHeading } from '@/components/shared/app-page-heading-context'
import { UserHeaderMenu } from '@/components/shared/user-header-menu'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserSafe } from '@/lib/supabase/get-auth-user-safe'
import {
  clearProfileCache,
  getStoredProfileCache,
  setProfileCache,
} from '@/lib/profile-cache'
import type { Profile } from '@/types'
import { cn } from '@/lib/utils'

/** Espaço para o botão fixo do drawer (`md:hidden`); em desktop o padding horizontal vem do `PageHeader`. */
const MOBILE_DRAWER_PADDING = 'max-md:pl-16'

function greetingFromProfile(profile: Profile | null) {
  const nome = profile?.nome?.trim()
  return nome ? `Olá, ${nome}` : 'Olá'
}

function RegisterPageHeading({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  const setHeading = useOptionalAppPageHeading()?.setHeading
  useEffect(() => {
    if (!setHeading) return
    setHeading({ title, subtitle, actions })
    return () => setHeading(null)
  }, [title, subtitle, actions, setHeading])
  return null
}

type BaseAppPageHeaderProps = {
  profileHref: string
  className?: string
  /** Quando definido (incluindo `null`), desativa o fetch interno do perfil. */
  profile?: Profile | null
  actions?: React.ReactNode
  /** Letra do avatar quando ainda não há nome no perfil */
  avatarFallback?: string
}

type TitleVariant = BaseAppPageHeaderProps & {
  title: string
  subtitle?: React.ReactNode
  /** Exibido ao lado do título no `PageContent` (não confundir com `actions` do header superior). */
  headingActions?: React.ReactNode
  leading?: never
  greetingOnly?: never
  contentTitle?: never
}

type LeadingVariant = BaseAppPageHeaderProps & {
  leading: React.ReactNode
  /** Título da página (h1) — renderizado em `PageContent`, não no header */
  contentTitle: string
  contentSubtitle?: React.ReactNode
  title?: never
  subtitle?: never
  greetingOnly?: never
}

/** Dashboard / home: só a saudação no header (como o texto acima do título nas demais telas), sem h1 extra no conteúdo. */
type GreetingOnlyVariant = BaseAppPageHeaderProps & {
  greetingOnly: true
  /** Quando true, omite a linha de saudação (ex.: dashboard com hero próprio no conteúdo). */
  hideGreeting?: boolean
  title?: never
  subtitle?: never
  leading?: never
  contentTitle?: never
}

export type AppPageHeaderProps = TitleVariant | LeadingVariant | GreetingOnlyVariant

export function AppPageHeader(props: AppPageHeaderProps) {
  const {
    profileHref,
    className,
    profile: profileFromParent,
    actions,
    avatarFallback = 'U',
  } = props

  const shouldFetch = profileFromParent === undefined
  const [internalProfile, setInternalProfile] = useState<Profile | null>(null)
  const effectiveProfile = shouldFetch ? internalProfile : profileFromParent

  useEffect(() => {
    if (!shouldFetch) return
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const user = await getAuthUserSafe(supabase)
      if (!user) {
        if (!cancelled) {
          clearProfileCache()
          setInternalProfile(null)
        }
        return
      }
      if (cancelled) return

      const stored = getStoredProfileCache()
      if (!stored || stored.userId !== user.id) {
        clearProfileCache()
        if (!cancelled) setInternalProfile(null)
      } else if (!cancelled) {
        setInternalProfile(stored.profile)
      }

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (cancelled) return
      if (data) {
        setProfileCache(user.id, data)
        setInternalProfile(data)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [shouldFetch])

  const greeting = greetingFromProfile(effectiveProfile)
  const greetingMuted = (
    <p className="text-sm text-muted-foreground">
      {greeting} <span className="align-middle text-lg leading-none">👋</span>
    </p>
  )

  let left: React.ReactNode
  let headingSync: React.ReactNode = null

  if ('greetingOnly' in props && props.greetingOnly) {
    left = props.hideGreeting ? (
      <div className="min-w-0 flex-1" />
    ) : (
      <div className="min-w-0 flex-1">{greetingMuted}</div>
    )
  } else if ('leading' in props && props.leading != null) {
    headingSync = (
      <RegisterPageHeading
        title={props.contentTitle}
        subtitle={props.contentSubtitle}
      />
    )
    left = (
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {greetingMuted}
        <div className="flex min-w-0 items-center gap-3">{props.leading}</div>
      </div>
    )
  } else if ('title' in props && props.title != null) {
    headingSync = (
      <RegisterPageHeading
        title={props.title}
        subtitle={props.subtitle}
        actions={'headingActions' in props ? props.headingActions : undefined}
      />
    )
    left = <div className="min-w-0 flex-1">{greetingMuted}</div>
  } else {
    left = <div className="min-w-0 flex-1" />
  }

  const fallbackLetter =
    effectiveProfile?.nome?.charAt(0).toUpperCase() || avatarFallback

  return (
    <>
      {headingSync}
      <PageHeader className={cn(MOBILE_DRAWER_PADDING, className)}>
        <div className="flex min-w-0 flex-1 items-center gap-3">{left}</div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <UserHeaderMenu
            avatarSrc={effectiveProfile?.avatar}
            fallback={fallbackLetter}
            profileHref={profileHref}
          />
        </div>
      </PageHeader>
    </>
  )
}
