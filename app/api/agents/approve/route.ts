import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { render } from '@react-email/components'
import React from 'react'
import { getResend } from '@/lib/email'
import AgentApprovedEmail from '@/lib/emails/agent-approved'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://caissepro.app'
const FOUNDER_EMAILS = ['infos@dakarvapes.com', 'azzideejay@gmail.com']

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function genPassword(): string {
  // 8-character temporary password (no ambiguous chars)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz'
  let out = ''
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function genInviteCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

// Verify the caller is a founder or an active admin before allowing this
// privileged (service-role) action.
async function authorizeCaller(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return false

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return false

  const email = (data.user.email || '').toLowerCase()
  if (FOUNDER_EMAILS.includes(email)) return true

  const admin = adminClient()
  const { data: row } = await admin
    .from('admin_users')
    .select('id')
    .ilike('email', email)
    .eq('status', 'active')
    .maybeSingle()
  return !!row
}

export async function POST(req: NextRequest) {
  if (!(await authorizeCaller(req))) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const agentId = body.agentId as string | undefined
  if (!agentId) {
    return NextResponse.json({ error: 'agentId requis.' }, { status: 400 })
  }

  const supabase = adminClient()

  const { data: agent, error: agentErr } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .maybeSingle()

  if (agentErr || !agent) {
    return NextResponse.json({ error: 'Agent introuvable.' }, { status: 404 })
  }

  const email = (agent.email || '').toLowerCase().trim()
  if (!email) {
    return NextResponse.json({ error: "L'agent n'a pas d'email." }, { status: 400 })
  }

  // Ensure the agent has an invite code.
  let inviteCode = agent.invite_code as string | null
  if (!inviteCode) {
    inviteCode = genInviteCode()
  }

  let tempPassword: string | null = null
  let authUserId = agent.auth_user_id as string | null
  let credentialsCreated = false

  // Only provision an auth account if the agent doesn't already have one.
  if (!authUserId) {
    tempPassword = genPassword()
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: 'agent', full_name: agent.full_name },
    })

    if (createErr) {
      // The email may already belong to an existing auth user — reuse it and
      // reset its password so the credentials we send are valid.
      const { data: list } = await supabase.auth.admin.listUsers()
      const existing = list?.users?.find(
        (u) => (u.email || '').toLowerCase() === email
      )
      if (existing) {
        authUserId = existing.id
        await supabase.auth.admin.updateUserById(existing.id, { password: tempPassword })
        credentialsCreated = true
      } else {
        return NextResponse.json(
          { error: `Création du compte échouée: ${createErr.message}` },
          { status: 500 }
        )
      }
    } else {
      authUserId = created.user?.id || null
      credentialsCreated = true
    }
  }

  const { error: updateErr } = await supabase
    .from('agents')
    .update({
      status: 'active',
      auth_user_id: authUserId,
      invite_code: inviteCode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', agentId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  const loginUrl = `${APP_URL}/agents/login`
  const phone = agent.whatsapp || agent.phone

  // Send credentials by email (Resend) — non-blocking on failure.
  if (credentialsCreated && tempPassword) {
    try {
      const resend = getResend()
      const html = await render(
        React.createElement(AgentApprovedEmail, {
          fullName: agent.full_name,
          email,
          tempPassword,
          inviteCode,
          loginUrl,
        })
      )
      await resend.emails.send({
        from: 'CaissePro <noreply@caissepro.app>',
        to: email,
        subject: 'Votre compte agent CaissePro est activé',
        html,
      })
    } catch (err) {
      console.error('[agents/approve] email error:', err)
    }
  }

  // Send credentials by WhatsApp — non-blocking on failure.
  if (phone) {
    const waBody = credentialsCreated && tempPassword
      ? `Félicitations ${agent.full_name}! Votre compte agent CaissePro est activé.\n\nConnectez-vous sur ${loginUrl}\nEmail: ${email}\nMot de passe temporaire: ${tempPassword}\nVotre code agent: ${inviteCode}\n\nChangez votre mot de passe après la première connexion.`
      : `Félicitations ${agent.full_name}! Votre compte agent CaissePro est réactivé. Connectez-vous sur ${loginUrl} avec vos identifiants. Votre code agent: ${inviteCode}`
    await fetch(`${APP_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phone, body: waBody }),
    }).catch(() => null)
  }

  return NextResponse.json({ success: true, credentialsCreated, inviteCode })
}
