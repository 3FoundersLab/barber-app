import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

const ROLES: UserRole[] = ['super_admin', 'admin', 'barbeiro', 'cliente']

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

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if ('response' in auth) return auth.response

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json(
      {
        error:
          'Configure SUPABASE_SERVICE_ROLE_KEY no servidor para permitir cadastro de usuários pelo painel.',
      },
      { status: 503 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const nome = String(body.nome ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const role = body.role as UserRole
  const barbearia_id = body.barbearia_id ? String(body.barbearia_id) : null

  if (!nome || !email || password.length < 6) {
    return NextResponse.json(
      { error: 'Informe nome, email e senha com pelo menos 6 caracteres.' },
      { status: 400 },
    )
  }
  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: 'Papel inválido.' }, { status: 400 })
  }
  if ((role === 'admin' || role === 'barbeiro') && !barbearia_id) {
    return NextResponse.json(
      { error: 'Administrador e barbeiro precisam de uma barbearia vinculada.' },
      { status: 400 },
    )
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nome,
      role,
    },
  })

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? 'Não foi possível criar o usuário.' },
      { status: 400 },
    )
  }

  const userId = created.user.id

  const { error: profileError } = await admin
    .from('profiles')
    .update({ nome, email, role })
    .eq('id', userId)

  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Não foi possível sincronizar o perfil.' }, { status: 500 })
  }

  if (barbearia_id && (role === 'admin' || role === 'barbeiro')) {
    const { error: linkError } = await admin.from('barbearia_users').insert({
      barbearia_id,
      user_id: userId,
      role,
    })
    if (linkError) {
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Não foi possível vincular o usuário à barbearia.' },
        { status: 400 },
      )
    }
  }

  return NextResponse.json({ id: userId, email })
}
