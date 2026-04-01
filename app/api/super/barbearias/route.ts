import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

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
