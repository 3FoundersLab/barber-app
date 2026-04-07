import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { telefoneDigits } from '@/lib/format-contato'
import type { Profile } from '@/types'

async function requireSuperAdminSession() {
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

/**
 * Atualiza o próprio perfil do super admin (nome, telefone, avatar).
 * Usa service role para evitar falhas intermitentes de RLS no update + returning do cliente.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireSuperAdminSession()
  if ('response' in auth) return auth.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const nome = String(body.nome ?? '').trim()
  if (!nome) {
    return NextResponse.json({ error: 'Informe seu nome.' }, { status: 400 })
  }

  const digits = telefoneDigits(String(body.telefone ?? ''))
  const telefone = digits.length > 0 ? digits : null

  const avatarRaw = String(body.avatar ?? '').trim()
  const avatar = avatarRaw || null

  const payload = { nome, telefone, avatar }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (serviceKey && supabaseUrl) {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: updated, error } = await admin
      .from('profiles')
      .update(payload)
      .eq('id', auth.user.id)
      .select('*')
      .single()

    if (error || !updated) {
      return NextResponse.json(
        { error: error?.message ?? 'Não foi possível salvar o perfil.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ profile: updated as Profile })
  }

  const supabase = await createServerSupabase()
  const { data: updated, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', auth.user.id)
    .select('*')
    .single()

  if (error || !updated) {
    return NextResponse.json(
      {
        error:
          error?.message ??
          'Não foi possível salvar o perfil. Em produção, defina SUPABASE_SERVICE_ROLE_KEY no servidor.',
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ profile: updated as Profile })
}
