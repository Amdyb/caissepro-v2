'use client'

import { supabase } from '@/lib/supabaseClient'
import { uploadImage, validateImageFile } from '@/lib/uploadImage'
import { ImageIcon, Upload } from 'lucide-react'
import { useState } from 'react'

export default function BrandingImageUploader({
  businessId,
  label,
  value,
  folder,
  onUploaded
}: {
  businessId: string
  label: string
  value: string
  folder: 'logos' | 'banners'
  onUploaded: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  async function persistBranding(url: string) {
    const field = folder === 'logos' ? 'logo_url' : 'banner_url'

    const { error } = await supabase
      .from('businesses')
      .update({
        [field]: url
      })
      .eq('id', businessId)

    if (error) {
      setMessage(error.message)
      return false
    }

    return true
  }

  async function uploadFile(file: File) {
    if (!businessId || !file) return

    setMessage('')
    const validationError = validateImageFile(file)
    if (validationError) {
      setMessage(validationError)
      return
    }

    setUploading(true)

    try {
      const { url } = await uploadImage({ file, bucket: 'business-assets', businessId, folder })
      onUploaded(url)
      const saved = await persistBranding(url)
      if (saved) setMessage('Image enregistrée avec succès.')
    } catch (err: any) {
      setMessage(err.message || "Erreur lors de l'upload de l'image.")
    } finally {
      setUploading(false)
    }
  }

  async function handleManualChange(url: string) {
    onUploaded(url)

    if (!url || !businessId) return

    await persistBranding(url)
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <ImageIcon size={16} />
        {label}
      </label>

      <div className="mt-2 grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
          placeholder="https://..."
          value={value}
          onChange={(e) => handleManualChange(e.target.value)}
        />

        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">
          <Upload size={17} />
          {uploading ? 'Upload...' : 'Uploader'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadFile(file)
            }}
          />
        </label>
      </div>

      {value && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
          <img src={value} alt={label} className="h-24 w-full rounded-xl object-contain" />
        </div>
      )}

      {message && (
        <p className={`mt-2 text-xs font-bold ${message.includes('succès') ? 'text-green-700' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
