import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type Metrics = {
  businessId?: string
  businessName?: string
  period?: string
  revenue?: number
  expenses?: number
  netProfit?: number
  totalDebt?: number
  debtRatioPct?: number
  stockCostValue?: number
  stockRetailValue?: number
  cashAtHand?: number
  salesCount?: number
  lowStock?: { name: string; stock: number }[]
  bestMarginProduct?: { name: string; margin: number } | null
}

const cfa = (n: number) => `${Math.round(Number(n || 0)).toLocaleString('fr-FR')} CFA`

function buildPrompt(m: Metrics): string {
  const low = (m.lowStock || []).slice(0, 10).map((p) => `- ${p.name} (stock: ${p.stock})`).join('\n') || 'Aucun'
  return [
    `Tu es un conseiller d'affaires expert pour les petits commerçants en Afrique de l'Ouest (Sénégal).`,
    `Analyse les données de la boutique "${m.businessName || 'la boutique'}" pour la période : ${m.period || 'ce mois'}.`,
    `Réponds UNIQUEMENT en français, de manière concrète, chaleureuse et actionnable.`,
    `Donne 3 à 5 recommandations prioritaires, chacune en 1-2 phrases, sous forme de liste à puces.`,
    `Termine par une phrase d'encouragement.`,
    ``,
    `Données :`,
    `- Chiffre d'affaires : ${cfa(m.revenue || 0)} (${m.salesCount || 0} ventes)`,
    `- Dépenses : ${cfa(m.expenses || 0)}`,
    `- Bénéfice net : ${cfa(m.netProfit || 0)}`,
    `- Dettes clients : ${cfa(m.totalDebt || 0)} (${m.debtRatioPct || 0}% du chiffre d'affaires)`,
    `- Valeur du stock (coût d'achat) : ${cfa(m.stockCostValue || 0)}`,
    `- Valeur du stock (prix de vente estimé) : ${cfa(m.stockRetailValue || 0)}`,
    `- Cash en caisse : ${cfa(m.cashAtHand || 0)}`,
    m.bestMarginProduct ? `- Produit à meilleure marge : ${m.bestMarginProduct.name} (${cfa(m.bestMarginProduct.margin)}/unité)` : ``,
    `- Produits en stock bas :`,
    low,
  ].filter(Boolean).join('\n')
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Le Coach IA n\'est pas encore configuré (clé API manquante).' }, { status: 503 })
  }

  let metrics: Metrics
  try {
    metrics = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  // Authenticate and confirm Premium BEFORE any Anthropic call — the Coach IA is
  // Premium-only, so non-premium plans never incur API cost even if the endpoint
  // is hit directly.
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const businessId = metrics.businessId
  if (!token) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!businessId) return NextResponse.json({ error: 'Boutique manquante.' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 })

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .maybeSingle()
  if (!membership) return NextResponse.json({ error: 'Accès refusé à cette boutique.' }, { status: 403 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if ((sub?.plan || 'free') !== 'premium') {
    return NextResponse.json(
      { error: 'Le Coach IA est réservé aux abonnés Premium.', upgrade: true },
      { status: 402 }
    )
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: buildPrompt(metrics) }],
      }),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      return NextResponse.json({ error: 'Le Coach IA est momentanément indisponible.', detail: detail.slice(0, 300) }, { status: 502 })
    }

    const data = await response.json()
    const advice = data?.content?.[0]?.text || ''
    return NextResponse.json({ advice })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur lors de l\'analyse.' }, { status: 500 })
  }
}
