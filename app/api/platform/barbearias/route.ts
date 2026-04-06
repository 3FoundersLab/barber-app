import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

async function requireSuperAdmin() {
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user) {
      return { response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
    }
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (profileErr) {
      console.error('[api/super/barbearias] profiles:', profileErr.message)
      return {
        response: NextResponse.json(
          { error: 'Não foi possível validar o perfil. Verifique sessão e políticas RLS em profiles.' },
          { status: 500 },
        ),
      }
    }
    if (profile?.role !== 'super_admin') {
      return { response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }
    }
    return { user }
  } catch (e) {
    console.error('[api/super/barbearias] requireSuperAdmin:', e)
    return {
      response: NextResponse.json(
        { error: e instanceof Error ? e.message : 'Erro interno ao validar sessão.' },
        { status: 500 },
      ),
    }
  }
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/**
 * Atualiza barbearia pelo painel super (bypass RLS via service role).
 * Exige o mesmo papel que /api/super/users.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if ('response' in auth) return auth.response

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json(
      {
        error:
          'Configure SUPABASE_SERVICE_ROLE_KEY no servidor para permitir edição de barbearias pelo painel super.',
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

  const id = String(body.id ?? '').trim()
  const nome = String(body.nome ?? '').trim()
  let slug = String(body.slug ?? '').trim()
  const telefone = body.telefone != null && String(body.telefone).trim() !== '' ? String(body.telefone).trim() : null
  const email = body.email != null && String(body.email).trim() !== '' ? String(body.email).trim().toLowerCase() : null
  const endereco = body.endereco != null && String(body.endereco).trim() !== '' ? String(body.endereco).trim() : null
  const ativo = body.ativo === false ? false : true

  if (!id) {
    return NextResponse.json({ error: 'id da barbearia é obrigatório.' }, { status: 400 })
  }
  if (!nome) {
    return NextResponse.json({ error: 'Informe o nome da barbearia.' }, { status: 400 })
  }
  slug = slugify(slug)
  if (!slug) {
    return NextResponse.json({ error: 'Informe um slug válido.' }, { status: 400 })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin
    .from('barbearias')
    .update({
      nome,
      slug,
      telefone,
      email,
      endereco,
      ativo,
    })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Não foi possível salvar as alterações.' },
      { status: 400 },
    )
  }
  if (!data) {
    return NextResponse.json({ error: 'Barbearia não encontrada.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

/**
 * Vincula o super admin à barbearia como admin (service role, bypass RLS).
 * Necessário para "Acessar barbearia" sem depender de INSERT/UPDATE em políticas RLS no cliente.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin()
    if ('response' in auth) return auth.response

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        {
          error:
            'Configure SUPABASE_SERVICE_ROLE_KEY no servidor para permitir acesso ao painel da barbearia.',
        },
        { status: 503 },
      )
    }

    let body: { barbearia_id?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const barbeariaId = String(body.barbearia_id ?? '').trim()
    if (!barbeariaId) {
      return NextResponse.json({ error: 'barbearia_id é obrigatório.' }, { status: 400 })
    }

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const userId = auth.user.id

    const { data: existing, error: selectErr } = await admin
      .from('barbearia_users')
      .select('id')
      .eq('barbearia_id', barbeariaId)
      .eq('user_id', userId)
      .maybeSingle()

    if (selectErr) {
      console.error('[api/super/barbearias] POST select barbearia_users:', selectErr.message)
      return NextResponse.json(
        { error: selectErr.message ?? 'Não foi possível verificar o vínculo.' },
        { status: 400 },
      )
    }

    if (existing?.id) {
      const { error: updateErr } = await admin
        .from('barbearia_users')
        .update({ role: 'admin' })
        .eq('id', existing.id)
      if (updateErr) {
        console.error('[api/super/barbearias] POST update:', updateErr.message)
        return NextResponse.json(
          { error: updateErr.message ?? 'Não foi possível atualizar o vínculo.' },
          { status: 400 },
        )
      }
    } else {
      const { error: insertErr } = await admin.from('barbearia_users').insert({
        barbearia_id: barbeariaId,
        user_id: userId,
        role: 'admin',
      })
      if (insertErr) {
        console.error('[api/super/barbearias] POST insert:', insertErr.message)
        return NextResponse.json(
          { error: insertErr.message ?? 'Não foi possível vincular o acesso à barbearia.' },
          { status: 400 },
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[api/super/barbearias] POST:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro interno no servidor.' },
      { status: 500 },
    )
  }
}
