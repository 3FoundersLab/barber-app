'use client'

import { useEffect, useState } from 'react'
import { PageHeader, PageTitle } from '@/components/shared/page-container'
import { UserHeaderMenu } from '@/components/shared/user-header-menu'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { cn } from '@/lib/utils'

const MOBILE_DRAWER_PADDING = 'pl-16 md:pl-6'

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
  leading?: never
  renderTitle?: never
}

type LeadingVariant = BaseAppPageHeaderProps & {
  leading: React.ReactNode
  title?: never
  subtitle?: never
  renderTitle?: never
}

type RenderTitleVariant = BaseAppPageHeaderProps & {
  renderTitle: (profile: Profile | null) => React.ReactNode
  title?: never
  subtitle?: never
  leading?: never
}

export type AppPageHeaderProps = TitleVariant | LeadingVariant | RenderTitleVariant

export function AppPageHeader(props: AppPageHeaderProps) {
  const {
    profileHref,
    className,
    profile: profileFromParent,
    actions,
    avatarFallback = 'U',
  } = props

  const [internalProfile, setInternalProfile] = useState<Profile | null>(null)
  const shouldFetch = profileFromParent === undefined
  const effectiveProfile = shouldFetch ? internalProfile : profileFromParent

  useEffect(() => {
    if (!shouldFetch) return
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!cancelled && data) setInternalProfile(data)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [shouldFetch])

  let left: React.ReactNode
  if ('leading' in props && props.leading != null) {
    left = props.leading
  } else if ('renderTitle' in props && props.renderTitle) {
    left = <div className="min-w-0">{props.renderTitle(effectiveProfile)}</div>
  } else if ('title' in props && props.title != null) {
    left = (
      <div className="min-w-0">
        {props.subtitle != null &&
          (typeof props.subtitle === 'string' ? (
            <p className="text-sm text-muted-foreground">{props.subtitle}</p>
          ) : (
            props.subtitle
          ))}
        <PageTitle>{props.title}</PageTitle>
      </div>
    )
  } else {
    left = <div className="min-w-0" />
  }

  const fallbackLetter =
    effectiveProfile?.nome?.charAt(0).toUpperCase() || avatarFallback

  return (
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
  )
}
