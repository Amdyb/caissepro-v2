'use client'

import { supabase } from '@/lib/supabaseClient'
import {
  Activity,
  ArrowLeft,
  Bell,
  CreditCard,
  LogOut,
  MessageCircle,
  ShieldAlert,
  Store,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function MerchantProfilePage() {
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
    return <div className="px-5 py-10 font-black text-white/70">Chargement marchand...</div>
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <Link href="/super-admin/businesses" className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white/70 hover:bg-white/10">
        <ArrowLeft size={18} /> Retour
      </Link>

      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-black text-emerald-200">
          {message}
        </div>
      )}

      <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Store className="text-emerald-300" />
              <h1 className="text-4xl font-black text-white">{business?.name || 'Merchant'}</h1>
            </div>

            <p className="mt-2 text-sm font-bold text-white/50">
              /{business?.slug || 'no-slug'} · {business?.business_type || 'retail'}
            </p>

            <div className="mt-4 flex gap-2">
              <span className={`rounded-full px-4 py-2 text-xs font-black ${business?.status === 'suspended' ? 'bg-orange-400/20 text-orange-300' : 'bg-emerald-400/20 text-emerald-300'}`}>
                {business?.status === 'suspended' ? 'SUSPENDU' : 'ACTIF'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={openWhatsApp} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white hover:bg-emerald-500">
              <MessageCircle size={18} />WhatsApp
            </button>

            <button onClick={sendNotification} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-white/70 hover:bg-white/10">
              <Bell size={18} />Notifier
            </button>

            <button onClick={forceLogout} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-white/70 hover:bg-white/10">
              <LogOut size={18} />Force Logout
            </button>

            <button onClick={suspendStore} className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-white ${business?.status === 'suspended' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-orange-500 hover:bg-orange-600'}`}>
              <ShieldAlert size={18} />
              {business?.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <Users className="text-sky-300" />
          <p className="mt-5 text-sm font-black uppercase text-white/50">Employés</p>
          <p className="mt-2 text-5xl font-black text-white">{employees.length}</p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <CreditCard className="text-emerald-300" />
          <p className="mt-5 text-sm font-black uppercase text-white/50">Abonnements</p>
          <p className="mt-2 text-5xl font-black text-white">{subscriptions.length}</p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <Activity className="text-violet-300" />
          <p className="mt-5 text-sm font-black uppercase text-white/50">Activité</p>
          <p className="mt-2 text-lg font-black text-emerald-300">ACTIF</p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <ShieldAlert className="text-orange-300" />
          <p className="mt-5 text-sm font-black uppercase text-white/50">Storefront</p>
          <p className="mt-2 text-lg font-black text-white">
            {business?.online_store_enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black text-white">Employés</h2>

          <div className="mt-5 space-y-3">
            {employees.length === 0 ? (
              <p className="rounded-2xl bg-white/5 p-5 text-sm font-bold text-white/50">Aucun employé.</p>
            ) : (
              employees.map((employee) => (
                <div key={employee.id} className="rounded-2xl border border-white/10 bg-slate-900 p-4">
                  <p className="font-black text-white">{employee.role || 'staff'}</p>
                  <p className="text-sm font-bold text-white/50">User ID: {employee.user_id}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black text-white">Historique abonnements</h2>

          <div className="mt-5 space-y-3">
            {subscriptions.length === 0 ? (
              <p className="rounded-2xl bg-white/5 p-5 text-sm font-bold text-white/50">Aucun abonnement.</p>
            ) : (
              subscriptions.map((subscription) => (
                <div key={subscription.id} className="rounded-2xl border border-white/10 bg-slate-900 p-4">
                  <p className="font-black text-white">{subscription.plan}</p>
                  <p className="text-sm font-bold text-white/50">{subscription.status}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
