'use client'

import { supabase } from '@/lib/supabaseClient'
import { ImagePlus, Loader2, Upload } from 'lucide-react'
import { ChangeEvent, useState } from 'react'

type Props = {
  label: string
  value?: string
  folder: 'logos' | 'banners'
  previewClassName?: string
  onChange: (url: string) => void
}

export default function BusinessImageUploader({ label, value, folder, previewClassName, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage('')

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('business-assets')
      .upload(path, file, { upsert: false })

    if (error) {
      setMessage(error.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('business-assets').getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-700">{label}</p>
        {value && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Uploadé</span>}
      </div>

      <div className={`mb-4 flex items-center justify-center overflow-hidden rounded-2xl bg-white ${previewClassName || 'h-40'}`}>
        {value ? <img src={value} alt={label} className="h-full w-full object-cover" /> : <ImagePlus className="text-slate-300" size={42} />}
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800">
        {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
        {uploading ? 'Upload...' : `Uploader ${label.toLowerCase()}`}
        <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
      </label>

      {message && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
    </div>
  )
}
