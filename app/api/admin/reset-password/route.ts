import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const FOUNDER_EMAILS = ['infos@dakarvapes.com', 'azzideejay@gmail.com']

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function genPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz'
  let out = ''
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

// Caller must be a founder or an active admin_users row.
async function authorizeCaller(req: NextRequest): Promise<boolean> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return false
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data, error } = await anon.auth.getUser(token)
  if (error || !data.user) return false
  const email = (data.user.email || '').toLowerCase()
  if (FOUNDER_EMAILS.includes(email)) return true
  const admin = adminClient()
  const { data: row } = await admin
    .from('admin_users')
    .select('id')
    .or(`user_id.eq.${data.user.id},email.ilike.${email}`)
    .eq('status', 'active')
    .maybeSingle()
  return !!row
}

async function findUserIdByEmail(supabase: ReturnType<typeof adminClient>, email: string): Promise<string | null> {
  // Prefer our own linkage tables, then fall back to scanning auth users.
  const lookups: { table: string; col: string }[] = [
    { table: 'admin_users', col: 'user_id' },
    { table: 'agents', col: 'auth_user_id' },
    { table: 'business_members', col: 'user_id' },
  ]
  for (const { table, col } of lookups) {
    const { data } = await supabase.from(table).select(col).ilike('email', email).not(col, 'is', null).maybeSingle()
    const id = (data as any)?.[col]
    if (id) return id as string
  }
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const found = list?.users?.find((u) => (u.email || '').toLowerCase() === email)
  return found?.id || null
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[admin/reset-password] Service role key not configured')
    return NextResponse.json(
      { error: "Configuration serveur manquante : clé de service Supabase (SUPABASE_SERVICE_ROLE_KEY) absente." },
      { status: 500 }
    )
  }

  if (!(await authorizeCaller(req))) {
    return NextResponse.json({ error: 'Réservé aux administrateurs.' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  let email = ((body.email as string) || '').toLowerCase().trim()
  const businessId = (body.businessId as string) || ''

  const supabase = adminClient()

  // For a business, resolve the owner's account.
  if (!email && businessId) {
    const { data: members } = await supabase
      .from('business_members')
      .select('user_id, email, role')
      .eq('business_id', businessId)
    const owner = (members || []).find((m) => m.role === 'owner') || (members || [])[0]
    if (owner?.email) email = (owner.email as string).toLowerCase()
    if (!email && owner?.user_id) {
      const { data: u } = await supabase.auth.admin.getUserById(owner.user_id as string)
      email = (u.user?.email || '').toLowerCase()
    }
  }

  if (!email) {
    return NextResponse.json({ error: 'Utilisateur introuvable (email manquant).' }, { status: 400 })
  }

  const tempPassword = genPassword()

  // Find or create the auth user.
  let userId = await findUserIdByEmail(supabase, email)
  if (userId) {
    const { error: updErr } = await supabase.auth.admin.updateUserById(userId, { password: tempPassword })
    if (updErr) {
      return NextResponse.json({ error: `Échec de la réinitialisation: ${updErr.message}` }, { status: 500 })
    }
  } else {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })
    if (createErr || !created.user) {
      return NextResponse.json({ error: `Compte introuvable et création impossible: ${createErr?.message || ''}` }, { status: 500 })
    }
    userId = created.user.id
  }

  // Force a password change + ensure linkage on whichever tables match.
  await Promise.all([
    supabase.from('admin_users').update({ must_change_password: true, user_id: userId }).ilike('email', email),
    supabase.from('agents').update({ must_change_password: true, auth_user_id: userId }).ilike('email', email),
    supabase.from('business_members').update({ must_change_password: true, user_id: userId }).ilike('email', email),
  ])

  return NextResponse.json({ success: true, email, tempPassword })
}
