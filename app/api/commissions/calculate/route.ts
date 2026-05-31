import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://caissepro.app'

export async function POST(req: NextRequest) {
  const supabase = adminClient()
  const body = await req.json().catch(() => ({}))
  const targetMonth = body.month || new Date().toISOString().slice(0, 7)

  // Fetch all active agents
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('id, full_name, email, whatsapp, phone, total_commissions_earned')
    .eq('status', 'active')

  if (agentsError) {
    return NextResponse.json({ error: agentsError.message }, { status: 500 })
  }

  const results = []

  for (const agent of agents || []) {
    // Count paid signups this month
    const { count } = await supabase
      .from('agent_leads')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .eq('status', 'paid')
      .gte('paid_at', `${targetMonth}-01`)
      .lt('paid_at', getNextMonth(targetMonth))

    const signupsCount = count || 0
    const targetReached = signupsCount >= 20
    const amount = targetReached ? 50000 : 0

    // Upsert commission record
    const { data: existing } = await supabase
      .from('agent_commissions')
      .select('id, status')
      .eq('agent_id', agent.id)
      .eq('month', targetMonth)
      .maybeSingle()

    const wasAlreadyReached = existing?.status === 'pending' || existing?.status === 'paid'

    const { error: upsertError } = await supabase
      .from('agent_commissions')
      .upsert({
        agent_id: agent.id,
        month: targetMonth,
        signups_count: signupsCount,
        target_reached: targetReached,
        amount,
        status: targetReached ? 'pending' : 'not_reached',
      }, { onConflict: 'agent_id,month', ignoreDuplicates: false })

    if (upsertError) {
      results.push({ agent_id: agent.id, error: upsertError.message })
      continue
    }

    // If target just reached (wasn't before), notify agent via WhatsApp
    if (targetReached && !wasAlreadyReached) {
      const notifyPhone = agent.whatsapp || agent.phone
      if (notifyPhone) {
        await fetch(`${APP_URL}/api/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: notifyPhone,
            body: `Félicitations ${agent.full_name}! 🎉\n\nVous avez atteint votre objectif de 20 abonnés ce mois!\n\nCommission de 50 000 XOF en cours de traitement.\nVous serez payé via Wave ou Orange Money sous 48h.\n\nMerci pour votre contribution CaissePro!`,
          }),
        }).catch(() => null)
      }
    }

    results.push({ agent_id: agent.id, month: targetMonth, signups_count: signupsCount, target_reached: targetReached, amount })
  }

  return NextResponse.json({ month: targetMonth, processed: results.length, results })
}

function getNextMonth(month: string): string {
  const [year, m] = month.split('-').map(Number)
  const next = m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, '0')}`
  return `${next}-01`
}
