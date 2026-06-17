'use client'

import { ChangeEvent, useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { uploadImage, validateImageFile, getSelectedBusinessId } from '@/lib/uploadImage'

type Props = {
  value?: string
  businessId?: string | null
  onChange: (url: string) => void
}

export default function ProductImageUploader({ value, businessId, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState('')

  async function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setMessage('')

    // Validate before doing anything.
    const validationError = validateImageFile(file)
    if (validationError) {
      setMessage(validationError)
      return
    }

    // Instant local preview before the upload completes.
    setPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      const bId = businessId || getSelectedBusinessId()
      const { url } = await uploadImage({ file, bucket: 'product-images', businessId: bId })
      onChange(url)
      setPreview('')
    } catch (err: any) {
      setMessage(err.message || "Erreur lors de l'upload de l'image.")
      setPreview('')
    } finally {
      setUploading(false)
    }
  }

  const shownImage = value || preview

  return (
    <div>
      <label className="text-sm font-bold text-slate-700">Image produit (optionnel)</label>

      <div className="mt-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
        {shownImage ? (
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shownImage} alt="Produit" className="h-28 w-full bg-white object-contain" />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 className="animate-spin text-emerald-600" size={26} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
              <ImagePlus size={30} />
            </div>
            <p className="mt-4 text-sm font-bold text-slate-700">Ajouter une image produit</p>
            <p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP — max 5MB</p>
          </div>
        )}

        <label className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 text-sm font-black text-white hover:bg-emerald-700">
          {uploading ? (
            <><Loader2 className="animate-spin" size={18} /> Upload en cours...</>
          ) : (
            <><ImagePlus size={17} /> {value ? "Changer l'image" : "Ajouter l'image du produit"}</>
          )}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleSelect} />
        </label>

        {message && (
          <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</div>
        )}
      </div>
    </div>
  )
}
