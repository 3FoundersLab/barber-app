import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

const ALLOWED_CATEGORIES = new Set(['analytics'])

function resolveIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded
  return null
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const category = String(body.category ?? '').trim()
  const policyVersion = String(body.policyVersion ?? '').trim()
  const granted = body.granted === true

  if (!ALLOWED_CATEGORIES.has(category) || !policyVersion) {
    return NextResponse.json({ error: 'Payload de consentimento inválido.' }, { status: 400 })
  }

  const serverSupabase = await createServerSupabase()
  const {
    data: { user },
  } = await serverSupabase.auth.getUser()

  const payload = {
    user_id: user?.id ?? null,
    finalidade: category,
    base_legal: 'consentimento_art7_I',
    versao_politica: policyVersion,
    aceito: granted,
    ip: resolveIp(request),
    user_agent: request.headers.get('user-agent')?.slice(0, 512) ?? null,
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (serviceKey && supabaseUrl) {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error } = await admin.from('consentimentos').insert(payload)
    if (error) {
      return NextResponse.json({ error: 'Não foi possível registrar o consentimento.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  const { error } = await serverSupabase.from('consentimentos').insert(payload)
  if (error) {
    return NextResponse.json({ error: 'Não foi possível registrar o consentimento.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
