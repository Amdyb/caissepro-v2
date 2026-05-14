'use client'

import { ChangeEvent, useState } from 'react'
import { Loader2, UploadCloud } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  value?: string
  onChange: (url: string) => void
}

export default function PaymentProofUploader({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  async function uploadProof(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage('')

    const ext = file.name.split('.').pop()
    const path = `proofs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('payment-proofs')
      .upload(path, file, { upsert: false })

    if (error) {
      setMessage(error.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('payment-proofs').getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
      {value && (
        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <img src={value} alt="Preuve paiement" className="h-48 w-full object-cover" />
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800">
        {uploading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
        {uploading ? 'Upload...' : 'Uploader reçu / capture'}
        <input type="file" accept="image/*" className="hidden" onChange={uploadProof} />
      </label>

      {message && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
    </div>
  )
}
