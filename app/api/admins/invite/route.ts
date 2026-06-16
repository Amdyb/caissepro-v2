import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { render } from '@react-email/components'
import React from 'react'
import { getResend } from '@/lib/email'
import AdminInviteEmail from '@/lib/emails/admin-invite'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://caissepro.app'
const FOUNDER_EMAILS = ['infos@dakarvapes.com', 'azzideejay@gmail.com']
const PLATFORM_WHATSAPP = '+221784581111'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  analyst: 'Analyste',
  agent_manager: 'Agent Manager',
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function genPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz'
  let out = ''
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

// Only founders may invite admins.
async function authorizeFounder(req: NextRequest): Promise<boolean> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return false
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return false
  return FOUNDER_EMAILS.includes((data.user.email || '').toLowerCase())
}

export async function POST(req: NextRequest) {
  if (!(await authorizeFounder(req))) {
    return NextResponse.json({ error: 'Réservé aux founders.' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const email = ((body.email as string) || '').toLowerCase().trim()
  const name = ((body.name as string) || '').trim() || null
  const role = (body.role as string) || 'admin'
  const invitedBy = (body.invitedBy as string) || null

  if (!email) {
    return NextResponse.json({ error: 'Email requis.' }, { status: 400 })
  }

  const supabase = adminClient()

  // Reject duplicates.
  const { data: existingAdmin } = await supabase
    .from('admin_users')
    .select('id')
    .ilike('email', email)
    .maybeSingle()
  if (existingAdmin) {
    return NextResponse.json({ error: 'Cet email est déjà admin.' }, { status: 409 })
  }

  // Provision an auth account (or reuse one that already exists for this email).
  const tempPassword = genPassword()
  let authUserId: string | null = null

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role, full_name: name },
  })

  if (createErr) {
    const { data: list } = await supabase.auth.admin.listUsers()
    const existing = list?.users?.find((u) => (u.email || '').toLowerCase() === email)
    if (existing) {
      authUserId = existing.id
      await supabase.auth.admin.updateUserById(existing.id, { password: tempPassword })
    } else {
      return NextResponse.json(
        { error: `Création du compte échouée: ${createErr.message}` },
        { status: 500 }
      )
    }
  } else {
    authUserId = created.user?.id || null
  }

  const { error: insertErr } = await supabase.from('admin_users').insert({
    email,
    name,
    role,
    status: 'active',
    user_id: authUserId,
    invited_by: invitedBy,
  })

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  const roleLabel = ROLE_LABEL[role] || role
  const loginUrl = `${APP_URL}/login`

  // Email credentials (non-blocking).
  try {
    const resend = getResend()
    const html = await render(
      React.createElement(AdminInviteEmail, { name: name || undefined, email, tempPassword, roleLabel, loginUrl })
    )
    await resend.emails.send({
      from: 'CaissePro <noreply@caissepro.app>',
      to: email,
      subject: "Vous avez été ajouté à l'équipe admin CaissePro",
      html,
    })
  } catch (err) {
    console.error('[admins/invite] email error:', err)
  }

  // WhatsApp ping to the platform line (non-blocking).
  await fetch(`${APP_URL}/api/whatsapp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: PLATFORM_WHATSAPP,
      body: `NOUVEL ADMIN\n${name || email}\nEmail: ${email}\nRôle: ${roleLabel}\nIdentifiants envoyés par email.`,
    }),
  }).catch(() => null)

  return NextResponse.json({ success: true })
}
