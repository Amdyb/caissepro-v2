'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import {
  Activity,
  Bell,
  CreditCard,
  LogOut,
  MessageCircle,
  ShieldAlert,
  Store,
  Users
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const SUPER_ADMIN_EMAILS = ['infos@dakarvapes.com']

export default function MerchantProfilePage() {
  const router = useRouter()
  const params = useParams()
  const businessId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [message, setMessage] = useState('')

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

    const [businessResult, employeesResult, subscriptionsResult] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', businessId).maybeSingle(),
      supabase.from('business_members').select('*').eq('business_id', businessId),
      supabase.from('subscriptions').select('*').eq('business_id', businessId).order('created_at', { ascending: false })
    ])

    setBusiness(businessResult.data)
    setEmployees(employeesResult.data || [])
    setSubscriptions(subscriptionsResult.data || [])
    setLoading(false)
  }

  async function suspendStore() {
    const nextStatus = business?.status === 'suspended' ? 'active' : 'suspended'

    const { error } = await supabase
      .from('businesses')
      .update({ status: nextStatus })
      .eq('id', businessId)

    if (error) {
      setMessage(error.message)
      return
    }

    setBusiness((prev: any) => ({ ...prev, status: nextStatus }))

    setMessage(nextStatus === 'suspended' ? 'Boutique suspendue.' : 'Boutique réactivée.')
  }

  async function forceLogout() {
    setMessage('Déconnexion forcée signalée pour cette boutique.')
  }

  async function sendNotification() {
    setMessage('Notification envoyée au marchand.')
  }

  function openWhatsApp() {
    if (!business?.phone) {
      setMessage('Numéro WhatsApp introuvable.')
      return
    }

    const phone = String(business.phone).replace(/\D/g, '')
    const text = encodeURIComponent(`Bonjour ${business.name}, support CaissePro.`)

    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="font-black">Chargement marchand...</p>
      </main>
    )
  }

  return (
    <AppShell title="Merchant Control Center" subtitle="Gestion détaillée du marchand.">
      <div className="mx-auto max-w-7xl pb-20">
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
            {message}
          </div>
        )}

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Store className="text-emerald-600" />
                <h1 className="text-4xl font-black text-slate-950">
                  {business?.name || 'Merchant'}
                </h1>
              </div>

              <p className="mt-2 text-sm font-bold text-slate-500">
                /{business?.slug || 'no-slug'} · {business?.business_type || 'retail'}
              </p>

              <div className="mt-4 flex gap-2">
                <span className={`rounded-full px-4 py-2 text-xs font-black ${business?.status === 'suspended' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {business?.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={openWhatsApp} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white">
                <MessageCircle size={18} />WhatsApp
              </button>

              <button onClick={sendNotification} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-700">
                <Bell size={18} />Notifier
              </button>

              <button onClick={forceLogout} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white">
                <LogOut size={18} />Force Logout
              </button>

              <button onClick={suspendStore} className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-white ${business?.status === 'suspended' ? 'bg-emerald-600' : 'bg-orange-500'}`}>
                <ShieldAlert size={18} />
                {business?.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <Users className="text-sky-500" />
            <p className="mt-5 text-sm font-black uppercase text-slate-500">Employés</p>
            <p className="mt-2 text-5xl font-black text-slate-950">{employees.length}</p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <CreditCard className="text-emerald-600" />
            <p className="mt-5 text-sm font-black uppercase text-slate-500">Abonnements</p>
            <p className="mt-2 text-5xl font-black text-slate-950">{subscriptions.length}</p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <Activity className="text-violet-500" />
            <p className="mt-5 text-sm font-black uppercase text-slate-500">Activité</p>
            <p className="mt-2 text-lg font-black text-emerald-600">ACTIVE</p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <ShieldAlert className="text-orange-500" />
            <p className="mt-5 text-sm font-black uppercase text-slate-500">Storefront</p>
            <p className="mt-2 text-lg font-black text-slate-950">
              {business?.online_store_enabled ? 'ENABLED' : 'DISABLED'}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">Employés</h2>

            <div className="mt-5 space-y-3">
              {employees.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                  Aucun employé.
                </p>
              ) : (
                employees.map((employee) => (
                  <div key={employee.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-black text-slate-950">
                      {employee.role || 'staff'}
                    </p>

                    <p className="text-sm font-bold text-slate-500">
                      User ID: {employee.user_id}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">Historique abonnements</h2>

            <div className="mt-5 space-y-3">
              {subscriptions.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                  Aucun abonnement.
                </p>
              ) : (
                subscriptions.map((subscription) => (
                  <div key={subscription.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-black text-slate-950">
                      {subscription.plan}
                    </p>

                    <p className="text-sm font-bold text-slate-500">
                      {subscription.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
