import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

/** Papéis permitidos na tabela `barbearia_users` ao vincular por e-mail */
const LINK_BARBEARIA_ROLES: UserRole[] = ['admin', 'barbeiro', 'cliente']

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

/**
 * Vincula um usuário existente (ou novo, se `create_if_missing`) a uma barbearia pelo e-mail do perfil.
 * - Evita duplicata: se o vínculo já existir, responde 200 com `already_linked`.
 * - Sem `create_if_missing`, e-mail inexistente → 404.
 */
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if ('response' in auth) return auth.response

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !url) {
    return NextResponse.json(
      {
        error:
          'Configure SUPABASE_SERVICE_ROLE_KEY no servidor para vincular usuários às barbearias.',
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

  const barbearia_id = String(body.barbearia_id ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const role = (body.role as UserRole) ?? 'admin'
  const create_if_missing = body.create_if_missing === true

  if (!barbearia_id || !email) {
    return NextResponse.json(
      { error: 'Informe barbearia_id e email.', code: 'validation' },
      { status: 400 },
    )
  }
  if (!LINK_BARBEARIA_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Papel na barbearia inválido.', code: 'validation' }, { status: 400 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: barbeariaRow, error: barErr } = await admin
    .from('barbearias')
    .select('id')
    .eq('id', barbearia_id)
    .maybeSingle()

  if (barErr) {
    return NextResponse.json(
      { error: barErr.message ?? 'Não foi possível validar a barbearia.' },
      { status: 500 },
    )
  }
  if (!barbeariaRow) {
    return NextResponse.json({ error: 'Barbearia não encontrada.', code: 'barbearia_not_found' }, { status: 404 })
  }

  const { data: matches, error: profErr } = await admin
    .from('profiles')
    .select('id, role')
    .eq('email', email)
    .limit(3)

  if (profErr) {
    return NextResponse.json(
      { error: profErr.message ?? 'Não foi possível buscar o usuário pelo e-mail.' },
      { status: 500 },
    )
  }

  const rows = matches ?? []
  if (rows.length > 1) {
    return NextResponse.json(
      {
        error:
          'Existem vários perfis com este e-mail. Corrija os dados no banco antes de vincular.',
        code: 'ambiguous_email',
      },
      { status: 409 },
    )
  }

  let userId: string
  let created_user = false

  if (rows.length === 1) {
    userId = rows[0].id
    const { data: authRow, error: authErr } = await admin.auth.admin.getUserById(userId)
    if (authErr || !authRow.user) {
      return NextResponse.json(
        {
          error: 'Perfil encontrado, mas não há conta de autenticação correspondente.',
          code: 'auth_missing',
        },
        { status: 422 },
      )
    }
  } else {
    if (!create_if_missing) {
      return NextResponse.json(
        {
          error: 'Nenhum usuário cadastrado com este e-mail.',
          code: 'user_not_found',
        },
        { status: 404 },
      )
    }

    const nome = String(body.nome ?? '').trim()
    const password = String(body.password ?? '')
    if (!nome || password.length < 6) {
      return NextResponse.json(
        {
          error:
            'Para criar uma nova conta, informe nome e senha com pelo menos 6 caracteres, ou desmarque a opção de criar usuário.',
          code: 'validation',
        },
        { status: 400 },
      )
    }

    const profileRole: UserRole =
      role === 'admin' ? 'admin' : role === 'barbeiro' ? 'barbeiro' : 'cliente'

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome,
        role: profileRole,
      },
    })

    if (createError || !created.user) {
      return NextResponse.json(
        {
          error: createError?.message ?? 'Não foi possível criar o usuário.',
          code: 'create_failed',
        },
        { status: 400 },
      )
    }

    userId = created.user.id
    created_user = true

    const { error: profileError } = await admin
      .from('profiles')
      .update({ nome, email, role: profileRole })
      .eq('id', userId)

    if (profileError) {
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Não foi possível sincronizar o perfil do novo usuário.', code: 'profile_sync' },
        { status: 500 },
      )
    }
  }

  const { data: existingLink, error: selLinkErr } = await admin
    .from('barbearia_users')
    .select('id')
    .eq('barbearia_id', barbearia_id)
    .eq('user_id', userId)
    .maybeSingle()

  if (selLinkErr) {
    return NextResponse.json(
      { error: selLinkErr.message ?? 'Não foi possível verificar o vínculo existente.' },
      { status: 500 },
    )
  }

  if (existingLink?.id) {
    return NextResponse.json({
      ok: true,
      already_linked: true,
      link_id: existingLink.id,
      user_id: userId,
      created_user,
    })
  }

  const { error: insertErr } = await admin.from('barbearia_users').insert({
    barbearia_id,
    user_id: userId,
    role,
  })

  if (insertErr) {
    const msg = insertErr.message ?? ''
    if (insertErr.code === '23505' || msg.toLowerCase().includes('duplicate')) {
      return NextResponse.json(
        { error: 'Este usuário já está vinculado a esta barbearia.', code: 'duplicate_link' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: insertErr.message ?? 'Não foi possível criar o vínculo.' },
      { status: 400 },
    )
  }

  if (role === 'admin') {
    const { data: prof } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle()
    if (prof && prof.role !== 'super_admin' && prof.role !== 'admin') {
      await admin.from('profiles').update({ role: 'admin' }).eq('id', userId)
    }
  } else if (role === 'barbeiro') {
    const { data: prof } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle()
    if (prof?.role === 'cliente') {
      await admin.from('profiles').update({ role: 'barbeiro' }).eq('id', userId)
    }
  }

  return NextResponse.json({
    ok: true,
    already_linked: false,
    user_id: userId,
    created_user,
  })
}

/**
 * Remove vínculo barbearia_users (super admin). Usa service role para não depender de RLS no cliente.
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if ('response' in auth) return auth.response

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !url) {
    return NextResponse.json(
      {
        error:
          'Configure SUPABASE_SERVICE_ROLE_KEY no servidor para revogar vínculos entre usuários e barbearias.',
      },
      { status: 503 },
    )
  }

  const id = request.nextUrl.searchParams.get('id')?.trim()
  if (!id) {
    return NextResponse.json({ error: 'Parâmetro id é obrigatório.' }, { status: 400 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await admin.from('barbearia_users').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
