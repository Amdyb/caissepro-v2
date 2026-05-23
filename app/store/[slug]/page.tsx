'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import {
  Activity,
  ArrowLeft,
  Box,
  CreditCard,
  ShieldAlert,
  Store,
  Users
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const SUPER_ADMIN_EMAILS = ['infos@dakarvapes.com']

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function stockStatus(stock: number) {
  if (stock <= 0) return { label: 'Rupture', badge: 'bg-red-100 text-red-700' }
  if (stock <= 5) return { label: 'Stock faible', badge: 'bg-amber-100 text-amber-700' }
  return { label: 'En stock', badge: 'bg-emerald-100 text-emerald-700' }
}

export default function StoreSlugPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string

  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      router.push('/login')
      return
    }

    const email = userData.user.email || ''

    if (!SUPER_ADMIN_EMAILS.includes(email)) {
      router.push('/dashboard')
      return
    }

    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (!biz) {
      setLoading(false)
      return
    }

    setBusiness(biz)

    const [productsResult, membersResult, subscriptionsResult] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('business_id', biz.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('business_members')
        .select('*')
        .eq('business_id', biz.id),
      supabase
        .from('subscriptions')
        .select('*')
        .eq('business_id', biz.id)
        .order('created_at', { ascending: false })
    ])

    setProducts(shuffleArray(productsResult.data || []))
    setMembers(membersResult.data || [])
    setSubscriptions(subscriptionsResult.data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="font-black">Chargement boutique...</p>
      </main>
    )
  }

  if (!business) {
    return (
      <AppShell title="Boutique introuvable" subtitle="Aucune boutique ne correspond à ce slug.">
        <div className="mx-auto max-w-7xl pb-20">
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm"
          >
            <ArrowLeft size={18} />
            Retour
          </button>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-2xl font-black text-slate-950">Boutique &quot;{slug}&quot; introuvable.</p>
          </div>
        </div>
      </AppShell>
    )
  }

  const activeProducts = products.filter((p) => p.archived !== true && p.is_active !== false)

  return (
    <AppShell title={business.name || 'Boutique'} subtitle={`/${business.slug} · Vue super-administrateur`}>
      <div className="mx-auto max-w-7xl pb-20">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm"
        >
          <ArrowLeft size={18} />
          Retour
        </button>

        {/* Business header */}
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Store className="text-emerald-600" />
                <h1 className="text-4xl font-black text-slate-950">{business.name || 'Sans nom'}</h1>
              </div>
              <p className="mt-2 text-sm font-bold text-slate-500">
                /{business.slug || 'no-slug'} · {business.business_type || 'retail'}
              </p>
              {business.owner_email && (
                <p className="mt-1 text-sm font-bold text-slate-400">{business.owner_email}</p>
              )}
              <div className="mt-4 flex gap-2">
                <span className={`rounded-full px-4 py-2 text-xs font-black ${business.status === 'suspended' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {business.status === 'suspended' ? 'SUSPENDU' : 'ACTIF'}
                </span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
                  {business.plan || 'Free'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <Box className="text-emerald-600" />
            <p className="mt-5 text-sm font-black uppercase text-slate-500">Produits actifs</p>
            <p className="mt-2 text-5xl font-black text-slate-950">{activeProducts.length}</p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <Users className="text-sky-500" />
            <p className="mt-5 text-sm font-black uppercase text-slate-500">Membres</p>
            <p className="mt-2 text-5xl font-black text-slate-950">{members.length}</p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <CreditCard className="text-violet-500" />
            <p className="mt-5 text-sm font-black uppercase text-slate-500">Abonnements</p>
            <p className="mt-2 text-5xl font-black text-slate-950">{subscriptions.length}</p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <Activity className="text-orange-500" />
            <p className="mt-5 text-sm font-black uppercase text-slate-500">Storefront</p>
            <p className={`mt-2 text-lg font-black ${business.online_store_enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
              {business.online_store_enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Products */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Box className="text-emerald-600" />
              <h2 className="text-2xl font-black text-slate-950">Produits</h2>
            </div>

            <div className="mt-5 space-y-3">
              {activeProducts.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                  Aucun produit.
                </p>
              ) : (
                activeProducts.slice(0, 20).map((product) => {
                  const { label, badge } = stockStatus(product.stock ?? 0)
                  return (
                    <div key={product.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-950">{product.name}</p>
                          {product.category && (
                            <p className="text-xs font-bold text-slate-400">{product.category}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${badge}`}>
                            {label}
                          </span>
                          {product.sell_price != null && (
                            <span className="text-sm font-black text-slate-700">
                              {Number(product.sell_price).toLocaleString()} F
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              {activeProducts.length > 20 && (
                <p className="pt-2 text-center text-xs font-bold text-slate-400">
                  +{activeProducts.length - 20} autres produits
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Team members */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Users className="text-sky-500" />
                <h2 className="text-2xl font-black text-slate-950">Équipe</h2>
              </div>

              <div className="mt-5 space-y-3">
                {members.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                    Aucun membre.
                  </p>
                ) : (
                  members.map((member) => (
                    <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-black text-slate-950">{member.role || 'staff'}</p>
                      <p className="text-xs font-bold text-slate-400">ID: {member.user_id}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Subscriptions */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-violet-500" />
                <h2 className="text-2xl font-black text-slate-950">Abonnements</h2>
              </div>

              <div className="mt-5 space-y-3">
                {subscriptions.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                    Aucun abonnement.
                  </p>
                ) : (
                  subscriptions.map((sub) => (
                    <div key={sub.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black text-slate-950">{sub.plan}</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {sub.status}
                        </span>
                      </div>
                      {sub.created_at && (
                        <p className="mt-1 text-xs font-bold text-slate-400">
                          {new Date(sub.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
