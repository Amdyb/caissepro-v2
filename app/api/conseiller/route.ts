import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const SYSTEM_CONTEXT =
  "Tu es le Conseiller Commercial de CaissePro. Tu conseilles des commerçants ouest-africains en français. " +
  "Sois pratique, précis, et adapte tes conseils au type de commerce. Utilise les chiffres réels. " +
  "Ajoute des touches en wolof quand approprié."

// Business-type-specific advisory context (keys match businesses.business_type).
const TYPE_CONTEXT: Record<string, { label: string; context: string }> = {
  retail: {
    label: 'Commerce & Boutique',
    context: "Concentre-toi sur la rotation des stocks, les produits d'appel, les ventes additionnelles, la fidélisation et les promotions ciblées.",
  },
  restaurant: {
    label: 'Restaurant',
    context: "Concentre-toi sur les plats du jour, la réduction des invendus, les heures de pointe, les menus rentables, la livraison et les avis clients.",
  },
  beauty: {
    label: 'Salon & Beauté',
    context: "Concentre-toi sur la prise de rendez-vous, les forfaits, le remplissage des créneaux creux, la fidélité et la vente de produits de soin.",
  },
  pharmacy: {
    label: 'Pharmacie',
    context: "Concentre-toi sur les ruptures de produits essentiels, les dates de péremption, les conseils santé et les services additionnels (tension, etc.). Reste prudent et réglementaire.",
  },
  garage: {
    label: 'Garage & Auto',
    context: "Concentre-toi sur les forfaits d'entretien, les rappels de révision, la gestion des pièces, les devis clairs et la fidélisation.",
  },
  btp: {
    label: 'BTP & Services',
    context: "Concentre-toi sur les devis précis, le suivi de chantier, les acomptes, la trésorerie et les références clients.",
  },
  tontine: {
    label: 'Tontine',
    context: "Concentre-toi sur le suivi des cotisations, les relances, la transparence, la confiance et le calendrier des tours.",
  },
  rental: {
    label: 'Location & Immobilier',
    context: "Concentre-toi sur le taux d'occupation, les contrats, les relances de loyers, l'entretien et la visibilité des annonces.",
  },
  wholesale: {
    label: 'Grossiste',
    context: "Concentre-toi sur les volumes, les marges, le crédit aux revendeurs, la logistique et les remises sur quantité.",
  },
  laundry: {
    label: 'Laverie & Pressing',
    context: "Concentre-toi sur les délais, les abonnements, le service ramassage/livraison, la fidélité et la gestion des créneaux.",
  },
}

const cfa = (n: number) => `${Math.round(Number(n || 0)).toLocaleString('fr-FR')} CFA`
const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Le Conseiller n'est pas encore configuré (clé API manquante)." }, { status: 503 })
  }

  // Authenticate via the caller's Supabase access token (client-side session).
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: { businessId?: string; question?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
  const businessId = body.businessId
  const question = (body.question || '').trim()
  if (!businessId || !question) {
    return NextResponse.json({ error: 'Boutique ou question manquante.' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 })

  // Confirm the user belongs to this business (RLS also enforces this on reads).
  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .maybeSingle()
  if (!membership) return NextResponse.json({ error: 'Accès refusé à cette boutique.' }, { status: 403 })

  // Premium gate (defense in depth): the Conseiller is Premium-only. Reject
  // non-premium plans BEFORE any Anthropic call so they never incur API cost,
  // even if someone hits this endpoint directly.
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
      { error: 'Le Conseiller Commercial est réservé aux abonnés Premium.', upgrade: true },
      { status: 402 }
    )
  }

  const since = new Date(Date.now() - 30 * 86400000).toISOString()

  const [bizRes, prodRes, salesRes, custRes, expRes] = await Promise.all([
    supabase.from('businesses').select('name, business_type').eq('id', businessId).maybeSingle(),
    supabase.from('products').select('id,name,stock,cost_price,sell_price,category').eq('business_id', businessId).is('deleted_at', null),
    supabase.from('sales').select('total,payment_method,created_at').eq('business_id', businessId).gte('created_at', since).limit(3000),
    supabase.from('customers').select('full_name,debt_balance').eq('business_id', businessId),
    supabase.from('expenses').select('amount,category,expense_date').eq('business_id', businessId).gte('expense_date', since.slice(0, 10)).limit(3000),
  ])

  const business = bizRes.data || { name: 'Ma boutique', business_type: 'retail' }
  const products = prodRes.data || []
  const sales = salesRes.data || []
  const customers = custRes.data || []
  const expenses = expRes.data || []

  // Top / slow products via sale_items joined to their sale (last 30 days).
  const soldQty = new Map<string, number>()
  try {
    const { data: items } = await supabase
      .from('sale_items')
      .select('quantity, product_id, product_name, sales!inner(business_id, created_at)')
      .eq('sales.business_id', businessId)
      .gte('sales.created_at', since)
      .limit(8000)
    for (const it of (items || []) as any[]) {
      const key = it.product_id || it.product_name || 'inconnu'
      soldQty.set(key, (soldQty.get(key) || 0) + Number(it.quantity || 0))
    }
  } catch {
    /* sale_items unavailable — top/slow lists simply stay empty */
  }

  const totalRevenue = sales.reduce((s, r: any) => s + Number(r.total || 0), 0)
  const stockValue = products.reduce((s, p: any) => s + Number(p.cost_price || 0) * Number(p.stock || 0), 0)
  const totalDebts = customers.reduce((s, c: any) => s + Number(c.debt_balance || 0), 0)
  const totalExpenses = expenses.reduce((s, e: any) => s + Number(e.amount || 0), 0)
  const expenseRatio = totalRevenue > 0 ? Math.round((totalExpenses / totalRevenue) * 100) : 0

  const nameById = new Map(products.map((p: any) => [p.id, p.name]))
  const topProducts = Array.from(soldQty.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, qty]) => `${nameById.get(key) || key} (${qty} vendus)`)
  const slowProducts = products
    .filter((p: any) => Number(p.stock || 0) > 0 && !soldQty.get(p.id))
    .slice(0, 5)
    .map((p: any) => `${p.name} (stock: ${p.stock})`)

  const byDay = new Array(7).fill(0)
  for (const s of sales as any[]) {
    const d = new Date(s.created_at)
    if (!isNaN(d.getTime())) byDay[d.getDay()] += Number(s.total || 0)
  }
  const peakDays = byDay
    .map((v, i) => ({ day: WEEKDAYS[i], v }))
    .sort((a, b) => b.v - a.v)
    .filter((d) => d.v > 0)
    .slice(0, 2)
    .map((d) => d.day)

  const type = TYPE_CONTEXT[(business as any).business_type] || TYPE_CONTEXT.retail

  const prompt = [
    `Type de commerce : ${type.label}.`,
    `Orientation des conseils pour ce métier : ${type.context}`,
    ``,
    `Données réelles de "${(business as any).name}" sur les 30 derniers jours :`,
    `- Chiffre d'affaires : ${cfa(totalRevenue)} (${sales.length} ventes)`,
    `- Valeur du stock (coût) : ${cfa(stockValue)}`,
    `- Dettes clients : ${cfa(totalDebts)}`,
    `- Dépenses : ${cfa(totalExpenses)} (soit ${expenseRatio}% du chiffre d'affaires)`,
    topProducts.length ? `- Meilleures ventes : ${topProducts.join(', ')}` : `- Meilleures ventes : données insuffisantes`,
    slowProducts.length ? `- Produits qui ne se vendent pas : ${slowProducts.join(', ')}` : ``,
    peakDays.length ? `- Jours les plus actifs : ${peakDays.join(', ')}` : ``,
    ``,
    `Question du commerçant : "${question}"`,
    ``,
    `Réponds en français, de façon concrète et actionnable, en t'appuyant sur ces chiffres réels et le type de commerce.`,
  ].filter(Boolean).join('\n')

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
        system: SYSTEM_CONTEXT,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      return NextResponse.json({ error: 'Le Conseiller est momentanément indisponible.', detail: detail.slice(0, 300) }, { status: 502 })
    }

    const data = await response.json()
    const advice = data?.content?.[0]?.text || ''
    return NextResponse.json({ advice })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur lors de l\'analyse.' }, { status: 500 })
  }
}
