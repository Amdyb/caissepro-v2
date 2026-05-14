'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export type UserRole = 'admin' | 'manager' | 'sales'

type RoleGuardState = {
  loading: boolean
  allowed: boolean
  role: UserRole | null
  businessId: string | null
  userId: string | null
  error: string
}

export function useRoleGuard(allowedRoles: UserRole[]) {
  const router = useRouter()
  const [state, setState] = useState<RoleGuardState>({
    loading: true,
    allowed: false,
    role: null,
    businessId: null,
    userId: null,
    error: ''
  })

  useEffect(() => {
    async function checkAccess() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id, role')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (error || !membership) {
        setState({
          loading: false,
          allowed: false,
          role: null,
          businessId: null,
          userId: userData.user.id,
          error: 'Aucune boutique trouvée pour ce compte.'
        })
        return
      }

      const role = (membership.role || 'sales') as UserRole
      const allowed = allowedRoles.includes(role)

      setState({
        loading: false,
        allowed,
        role,
        businessId: membership.business_id,
        userId: userData.user.id,
        error: allowed ? '' : 'Accès refusé. Votre rôle ne permet pas d’ouvrir cette page.'
      })
    }

    checkAccess()
  }, [allowedRoles, router])

  return state
}

export function AccessDenied({ message }: { message?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Accès refusé</h1>
        <p className="mt-3 text-sm font-semibold text-slate-500">
          {message || 'Votre compte n’a pas les permissions nécessaires.'}
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white"
        >
          Retour au dashboard
        </button>
      </div>
    </main>
  )
}
