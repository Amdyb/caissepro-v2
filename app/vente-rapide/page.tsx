'use client'

// This app authenticates entirely client-side (Supabase session in the browser),
// so there is no server Supabase client to read the user from. We resolve the
// user + their business_id on the client, mirroring the membership lookup used
// everywhere else (business_members.business_id where user_id = auth.uid()).
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { SkeletonDashboard } from '@/components/Skeleton'
import VenteRapide from '@/components/VenteRapide'

export default function VenteRapidePage() {
  const router = useRouter()
  const [ctx, setCtx] = useState<{ businessId: string; cashierId: string } | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!active) return
      if (!user) { router.replace('/login'); return }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      if (!active) return
      if (!membership?.business_id) { router.replace('/dashboard'); return }

      setCtx({ businessId: membership.business_id as string, cashierId: user.id })
    })()
    return () => { active = false }
  }, [router])

  if (!ctx) return <SkeletonDashboard />

  return <VenteRapide businessId={ctx.businessId} cashierId={ctx.cashierId} />
}
