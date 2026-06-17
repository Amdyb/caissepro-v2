'use client'

import { ChangeEvent, useState } from 'react'
import { ImagePlus, Loader2, UploadCloud } from 'lucide-react'
import { uploadImage as uploadImageFile, validateImageFile, getSelectedBusinessId } from '@/lib/uploadImage'

type Props = {
  label: string
  value?: string
  bucket?: string
  folder?: string
  previewClassName?: string
  onChange: (url: string) => void
}

export default function ShopImageUploader({
  label,
  value,
  bucket = 'business-assets',
  folder = 'uploads',
  previewClassName = 'h-32 w-full object-cover',
  onChange
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState('')

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setMessage('')
    const validationError = validateImageFile(file)
    if (validationError) { setMessage(validationError); return }

    setPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      const { url } = await uploadImageFile({ file, bucket, businessId: getSelectedBusinessId(), folder })
      onChange(url)
      setPreview('')
    } catch (err: any) {
      setMessage(err.message || "Erreur lors de l'upload de l'image.")
      setPreview('')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="text-sm font-black text-slate-700">{label}</label>

      <div className="mt-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
        {value || preview ? (
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value || preview} alt={label} className={previewClassName} />
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
            <p className="mt-4 text-sm font-bold text-slate-700">Ajouter une image</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">JPG, PNG, WEBP — max 5MB</p>
          </div>
        )}

        <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white hover:bg-emerald-700">
          {uploading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Upload...
            </>
          ) : (
            <>
              <UploadCloud size={18} />
              Choisir une image
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
        </label>

        {message && (
          <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
