import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

/** Papéis que o painel super pode criar/editar nesta rota */
const SUPER_PANEL_ROLES: UserRole[] = ['super_admin', 'admin']

function parseBarbeariaIds(body: Record<string, unknown>): string[] {
  if (Array.isArray(body.barbearia_ids)) {
    const raw = body.barbearia_ids
      .map((x) => String(x ?? '').trim())
      .filter((x) => x.length > 0)
    return [...new Set(raw)]
  }
  const single = body.barbearia_id != null && String(body.barbearia_id).trim() !== ''
    ? String(body.barbearia_id).trim()
    : ''
  return single ? [single] : []
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
  const barbeariaIds = parseBarbeariaIds(body)

  if (!nome || !email || password.length < 6) {
    return NextResponse.json(
      { error: 'Informe nome, email e senha com pelo menos 6 caracteres.' },
      { status: 400 },
    )
  }
  if (!SUPER_PANEL_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Papel inválido.' }, { status: 400 })
  }
  if (role === 'admin' && barbeariaIds.length === 0) {
    return NextResponse.json(
      { error: 'Administrador precisa de pelo menos uma barbearia vinculada.' },
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

  if (role === 'admin' && barbeariaIds.length > 0) {
    const rows = barbeariaIds.map((barbearia_id) => ({
      barbearia_id,
      user_id: userId,
      role: 'admin' as const,
    }))
    const { error: linkError } = await admin.from('barbearia_users').insert(rows)
    if (linkError) {
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Não foi possível vincular o usuário às barbearias.' },
        { status: 400 },
      )
    }
  }

  return NextResponse.json({ id: userId, email })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if ('response' in auth) return auth.response

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json(
      {
        error:
          'Configure SUPABASE_SERVICE_ROLE_KEY no servidor para permitir edição de usuários pelo painel.',
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

  const userId = String(body.user_id ?? '').trim()
  const nome = String(body.nome ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const role = body.role as UserRole
  const barbeariaIds = parseBarbeariaIds(body)

  if (!userId) {
    return NextResponse.json({ error: 'user_id é obrigatório.' }, { status: 400 })
  }

  const ativoOnly =
    typeof body.ativo === 'boolean' &&
    body.nome == null &&
    body.email == null &&
    body.role == null &&
    body.barbearia_id == null &&
    body.barbearia_ids == null

  if (ativoOnly) {
    if (body.ativo === false && userId === auth.user.id) {
      return NextResponse.json(
        { error: 'Não é possível desativar a própria conta por aqui.' },
        { status: 400 },
      )
    }

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error: profileError } = await admin
      .from('profiles')
      .update({ ativo: body.ativo })
      .eq('id', userId)

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message ?? 'Não foi possível atualizar o status do usuário.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true })
  }

  if (!nome || !email) {
    return NextResponse.json({ error: 'Informe nome e email.' }, { status: 400 })
  }
  if (!SUPER_PANEL_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Papel inválido.' }, { status: 400 })
  }
  if (role === 'admin' && barbeariaIds.length === 0) {
    return NextResponse.json(
      { error: 'Administrador precisa de pelo menos uma barbearia vinculada.' },
      { status: 400 },
    )
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: existingUser, error: getUserErr } = await admin.auth.admin.getUserById(userId)
  if (getUserErr || !existingUser.user) {
    return NextResponse.json(
      { error: getUserErr?.message ?? 'Usuário não encontrado.' },
      { status: 404 },
    )
  }

  const prevMeta =
    (existingUser.user.user_metadata as Record<string, unknown> | null | undefined) ?? {}

  const { data: duplicateProfile, error: duplicateProfileErr } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .neq('id', userId)
    .maybeSingle()

  if (duplicateProfileErr) {
    return NextResponse.json(
      { error: duplicateProfileErr.message ?? 'Não foi possível validar o e-mail informado.' },
      { status: 500 },
    )
  }

  if (duplicateProfile?.id) {
    return NextResponse.json({ error: 'Este e-mail já está em uso por outro usuário.' }, { status: 409 })
  }

  const { error: authUpdateErr } = await admin.auth.admin.updateUserById(userId, {
    email,
    email_confirm: true,
    user_metadata: { ...prevMeta, nome, role },
  })

  if (authUpdateErr) {
    return NextResponse.json(
      { error: authUpdateErr.message ?? 'Não foi possível atualizar o login do usuário.' },
      { status: 400 },
    )
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ nome, email, role })
    .eq('id', userId)

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message ?? 'Não foi possível atualizar o perfil.' },
      { status: 500 },
    )
  }

  if (role === 'super_admin') {
    const { error: delAdminLinksErr } = await admin
      .from('barbearia_users')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin')

    if (delAdminLinksErr) {
      return NextResponse.json(
        { error: delAdminLinksErr.message ?? 'Não foi possível atualizar vínculos de administrador.' },
        { status: 500 },
      )
    }
  } else if (role === 'admin') {
    const desired = new Set(barbeariaIds)

    const { data: existingRows, error: selErr } = await admin
      .from('barbearia_users')
      .select('id, barbearia_id, role')
      .eq('user_id', userId)

    if (selErr) {
      return NextResponse.json(
        { error: selErr.message ?? 'Não foi possível ler vínculos com barbearias.' },
        { status: 500 },
      )
    }

    const rows = existingRows ?? []
    const byBarbeariaId = new Map(rows.map((r) => [r.barbearia_id, r]))

    const adminRowIdsToRemove = rows
      .filter((r) => r.role === 'admin' && !desired.has(r.barbearia_id))
      .map((r) => r.id)

    if (adminRowIdsToRemove.length > 0) {
      const { error: delErr } = await admin.from('barbearia_users').delete().in('id', adminRowIdsToRemove)
      if (delErr) {
        return NextResponse.json(
          { error: delErr.message ?? 'Não foi possível atualizar vínculos de administrador.' },
          { status: 500 },
        )
      }
    }

    for (const barbearia_id of barbeariaIds) {
      const existing = byBarbeariaId.get(barbearia_id)
      if (existing) {
        if (existing.role !== 'admin') {
          const { error: upErr } = await admin
            .from('barbearia_users')
            .update({ role: 'admin' })
            .eq('id', existing.id)
          if (upErr) {
            return NextResponse.json(
              { error: upErr.message ?? 'Não foi possível definir administrador na barbearia.' },
              { status: 400 },
            )
          }
        }
      } else {
        const { error: insErr } = await admin.from('barbearia_users').insert({
          barbearia_id,
          user_id: userId,
          role: 'admin' as const,
        })
        if (insErr) {
          return NextResponse.json(
            { error: insErr.message ?? 'Não foi possível vincular às barbearias.' },
            { status: 400 },
          )
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
