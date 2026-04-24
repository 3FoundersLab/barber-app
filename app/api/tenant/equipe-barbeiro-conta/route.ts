import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'

async function requireTenantBarbeariaAdmin(barbeariaId: string, slug: string | undefined) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }
  const resolved = await resolveAdminBarbeariaId(supabase, user.id, slug ? { slug } : undefined)
  if (!resolved || resolved !== barbeariaId) {
    return { response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }
  }
  return { user }
}

function getServiceAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function normalizeEmail(v: string) {
  return v.trim().toLowerCase()
}

/**
 * Cria conta Supabase (login) para um membro da equipe já salvo em `barbeiros`,
 * vincula `barbeiros.user_id` e insere `barbearia_users` (papel barbeiro).
 */
export async function POST(request: NextRequest) {
  const admin = getServiceAdmin()
  if (!admin) {
    return NextResponse.json(
      {
        error:
          'Configure SUPABASE_SERVICE_ROLE_KEY no servidor para permitir criar login de profissionais.',
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

  const barbeariaId = String(body.barbearia_id ?? '').trim()
  const slug = typeof body.slug === 'string' ? body.slug.trim() || undefined : undefined
  const barbeiroId = String(body.barbeiro_id ?? '').trim()
  const password = String(body.password ?? '')
  const nome = String(body.nome ?? '').trim()
  const emailRaw = String(body.email ?? '').trim()
  const email = normalizeEmail(emailRaw)

  if (!barbeariaId || !barbeiroId) {
    return NextResponse.json({ error: 'barbearia_id e barbeiro_id são obrigatórios.' }, { status: 400 })
  }
  if (!nome) {
    return NextResponse.json({ error: 'Informe o nome do membro.' }, { status: 400 })
  }
  if (!email) {
    return NextResponse.json({ error: 'Informe o e-mail do membro para criar o login.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
  }

  const gate = await requireTenantBarbeariaAdmin(barbeariaId, slug)
  if ('response' in gate) return gate.response

  const { data: row, error: rowErr } = await admin
    .from('barbeiros')
    .select('id, barbearia_id, user_id, nome, email')
    .eq('id', barbeiroId)
    .maybeSingle()

  if (rowErr || !row) {
    return NextResponse.json({ error: 'Membro da equipe não encontrado.' }, { status: 404 })
  }
  if (row.barbearia_id !== barbeariaId) {
    return NextResponse.json({ error: 'Acesso negado a este membro.' }, { status: 403 })
  }
  if (row.user_id) {
    return NextResponse.json({ error: 'Este membro já possui conta de login vinculada.' }, { status: 409 })
  }

  const rowEmail = normalizeEmail(String(row.email ?? ''))
  if (!rowEmail || rowEmail !== email) {
    return NextResponse.json(
      { error: 'Salve o membro com o mesmo e-mail informado antes de criar o login, ou confira o campo e-mail.' },
      { status: 400 },
    )
  }

  let userId: string | null = null
  let createdNewUser = false

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nome,
      role: 'barbeiro',
    },
  })

  if (!createError && created.user) {
    userId = created.user.id
    createdNewUser = true
  } else {
    const msg = (createError?.message ?? '').toLowerCase()
    if (msg.includes('already been registered') || msg.includes('already registered')) {
      const { data: existingProfile, error: existingProfileErr } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingProfileErr) {
        return NextResponse.json(
          { error: existingProfileErr.message ?? 'Não foi possível localizar a conta existente por e-mail.' },
          { status: 500 },
        )
      }

      if (!existingProfile?.id) {
        return NextResponse.json(
          { error: 'Já existe uma conta com este e-mail, mas não foi possível localizar o perfil para vincular.' },
          { status: 409 },
        )
      }

      userId = existingProfile.id
    } else {
      return NextResponse.json(
        { error: createError?.message ?? 'Não foi possível criar o usuário.' },
        { status: 400 },
      )
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Não foi possível resolver a conta do usuário.' }, { status: 500 })
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ nome, email, role: 'barbeiro' })
    .eq('id', userId)

  if (profileError) {
    if (createdNewUser) {
      await admin.auth.admin.deleteUser(userId)
    }
    return NextResponse.json(
      { error: 'Não foi possível sincronizar o perfil do novo usuário.' },
      { status: 500 },
    )
  }

  const { error: linkBarbeiroErr } = await admin.from('barbeiros').update({ user_id: userId }).eq('id', barbeiroId)

  if (linkBarbeiroErr) {
    if (createdNewUser) {
      await admin.auth.admin.deleteUser(userId)
    }
    return NextResponse.json(
      { error: linkBarbeiroErr.message ?? 'Não foi possível vincular a conta ao membro.' },
      { status: 500 },
    )
  }

  const { data: existingBu, error: selBuErr } = await admin
    .from('barbearia_users')
    .select('id')
    .eq('barbearia_id', barbeariaId)
    .eq('user_id', userId)
    .maybeSingle()

  if (selBuErr) {
    await admin.from('barbeiros').update({ user_id: null }).eq('id', barbeiroId)
    if (createdNewUser) {
      await admin.auth.admin.deleteUser(userId)
    }
    return NextResponse.json(
      { error: selBuErr.message ?? 'Não foi possível verificar o vínculo com a barbearia.' },
      { status: 500 },
    )
  }

  if (!existingBu?.id) {
    const { error: buErr } = await admin.from('barbearia_users').insert({
      barbearia_id: barbeariaId,
      user_id: userId,
      role: 'barbeiro',
    })
    if (buErr) {
      const msg = buErr.message ?? ''
      if (buErr.code !== '23505' && !msg.toLowerCase().includes('duplicate')) {
        await admin.from('barbeiros').update({ user_id: null }).eq('id', barbeiroId)
        if (createdNewUser) {
          await admin.auth.admin.deleteUser(userId)
        }
        return NextResponse.json(
          { error: buErr.message ?? 'Não foi possível vincular o profissional à barbearia.' },
          { status: 500 },
        )
      }
    }
  }

  const { data: prof } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle()
  if (prof?.role === 'cliente') {
    await admin.from('profiles').update({ role: 'barbeiro' }).eq('id', userId)
  }

  return NextResponse.json({ ok: true, user_id: userId })
}

/** Atualiza a senha de um membro que já tem `user_id` vinculado. */
export async function PATCH(request: NextRequest) {
  const admin = getServiceAdmin()
  if (!admin) {
    return NextResponse.json(
      {
        error:
          'Configure SUPABASE_SERVICE_ROLE_KEY no servidor para permitir alterar senha de profissionais.',
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

  const barbeariaId = String(body.barbearia_id ?? '').trim()
  const slug = typeof body.slug === 'string' ? body.slug.trim() || undefined : undefined
  const barbeiroId = String(body.barbeiro_id ?? '').trim()
  const newPassword = String(body.new_password ?? '')

  if (!barbeariaId || !barbeiroId) {
    return NextResponse.json({ error: 'barbearia_id e barbeiro_id são obrigatórios.' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
  }

  const gate = await requireTenantBarbeariaAdmin(barbeariaId, slug)
  if ('response' in gate) return gate.response

  const { data: row, error: rowErr } = await admin
    .from('barbeiros')
    .select('id, barbearia_id, user_id')
    .eq('id', barbeiroId)
    .maybeSingle()

  if (rowErr || !row) {
    return NextResponse.json({ error: 'Membro da equipe não encontrado.' }, { status: 404 })
  }
  if (row.barbearia_id !== barbeariaId) {
    return NextResponse.json({ error: 'Acesso negado a este membro.' }, { status: 403 })
  }
  if (!row.user_id) {
    return NextResponse.json({ error: 'Este membro ainda não tem conta de login vinculada.' }, { status: 400 })
  }

  const { error: updErr } = await admin.auth.admin.updateUserById(row.user_id, { password: newPassword })
  if (updErr) {
    return NextResponse.json({ error: updErr.message ?? 'Não foi possível atualizar a senha.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
