'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { getNextRoute } from '@/lib/getNextRoute'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const route = await getNextRoute(session.user.id, session.user.email || '')
        router.replace(route)
      }
    })

    // Handle case where session is already set (e.g. page refresh)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const route = await getNextRoute(session.user.id, session.user.email || '')
        router.replace(route)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-black text-white">C</div>
        <p className="mt-4 font-semibold text-slate-600">Connexion en cours...</p>
      </div>
    </main>
  )
}
