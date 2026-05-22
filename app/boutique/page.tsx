'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BoutiquePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/storefront')
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="font-bold text-slate-600">Redirection vers Ma Boutique...</p>
    </main>
  )
}
