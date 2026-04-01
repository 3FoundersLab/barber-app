import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

type LinkRow = {
  id: string
  user_id: string
  role: UserRole
  barbearia_id: string
  barbearia: { id: string; nome: string } | { id: string; nome: string }[] | null
}

async function requireSuperAdmin() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') {
    return { response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }
  }
  return { user }
}

function normalizeBarbearia(
  raw: LinkRow['barbearia'],
): { id: string; nome: string } | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

/**
 * Lista vínculos barbearia_users para gestão no painel super.
 * Usa service role para não depender de RLS (sem a política 009, o cliente não enxerga vínculos de outros usuários).
 */
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if ('response' in auth) return auth.response

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !url) {
    return NextResponse.json(
      {
        error:
          'Configure SUPABASE_SERVICE_ROLE_KEY para carregar vínculos entre usuários e barbearias.',
        links: [],
      },
      { status: 503 },
    )
  }

  const idsParam = request.nextUrl.searchParams.get('user_ids')?.trim() ?? ''
  if (!idsParam) {
    return NextResponse.json({ links: [] })
  }

  const userIds = idsParam
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  if (userIds.length === 0) {
    return NextResponse.json({ links: [] })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: rows, error } = await admin
    .from('barbearia_users')
    .select('id, user_id, role, barbearia_id, barbearia:barbearias(id, nome)')
    .in('user_id', userIds)

  if (error) {
    return NextResponse.json({ error: error.message, links: [] }, { status: 500 })
  }

  const links = (rows || []).map((row) => {
    const r = row as unknown as LinkRow
    const barbearia = normalizeBarbearia(r.barbearia)
    return {
      id: r.id,
      user_id: r.user_id,
      role: r.role,
      barbearia: barbearia ? { id: barbearia.id, nome: barbearia.nome } : null,
    }
  })

  return NextResponse.json({ links })
}
