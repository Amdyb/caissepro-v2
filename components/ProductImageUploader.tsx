'use client'

import { ChangeEvent, useState } from 'react'
import { ImagePlus, Loader2, UploadCloud } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  value?: string
  onChange: (url: string) => void
}

export default function ProductImageUploader({
  value,
  onChange
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    setUploading(true)
    setMessage('')

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file)

    if (error) {
      setMessage(error.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    onChange(data.publicUrl)
    setUploading(false)
  }

  return (
    <div>
      <label className="text-sm font-bold text-slate-700">
        Image produit
      </label>

      <div className="mt-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
        {value ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <img
              src={value}
              alt="Produit"
              className="h-28 w-full object-contain bg-white"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-2xl bg-brand-50 p-4 text-brand-700">
              <ImagePlus size={30} />
            </div>

            <p className="mt-4 text-sm font-bold text-slate-700">
              Ajouter une image produit
            </p>

            <p className="mt-1 text-xs text-slate-500">
              JPG, PNG, WEBP
            </p>
          </div>
        )}

        <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-4 text-sm font-black text-white hover:bg-brand-700">
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

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={uploadImage}
          />
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
