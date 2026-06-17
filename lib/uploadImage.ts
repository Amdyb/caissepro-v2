import { supabase } from '@/lib/supabaseClient'

// Storage buckets cap files at 5 MB and only accept image MIME types, so we
// validate + compress client-side before upload. This is the single source of
// truth used by every image uploader (products, logos, banners).

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB — matches the bucket limit
const COMPRESS_THRESHOLD = 1024 * 1024 // 1 MB — compress anything larger
const MAX_DIMENSION = 1280 // px — longest edge after compression

export const SELECTED_BIZ_KEY = 'caissepro_selected_business_id'

export function getSelectedBusinessId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SELECTED_BIZ_KEY)
}

function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
}

// Returns a French error message, or null if the file is a valid image.
// Size is enforced later (after HEIC conversion + compression) so a large HEIC
// photo gets a chance to be shrunk before being rejected.
export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/') && !isHeic(file)) return 'Veuillez sélectionner une image.'
  return null
}

// iPhone HEIC/HEIF photos don't render in most browsers and can't be canvas-
// compressed, so convert them to JPEG up front. Browser-only (dynamic import);
// falls back to the original file if conversion fails (the buckets accept HEIC).
async function convertHeicIfNeeded(file: File): Promise<File> {
  if (!isHeic(file)) return file
  if (typeof window === 'undefined') return file
  try {
    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
    const blob = (Array.isArray(converted) ? converted[0] : converted) as Blob
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
  } catch (err) {
    console.error('HEIC conversion failed, uploading original:', err)
    return file
  }
}

function sanitizeName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
  return cleaned || 'image'
}

// Compress raster images over the threshold via canvas (re-encoded to JPEG).
// Animated GIFs are left untouched to preserve animation. Falls back to the
// original file if anything goes wrong or compression doesn't help.
async function compressImage(file: File): Promise<File> {
  if (file.size <= COMPRESS_THRESHOLD) return file
  if (file.type === 'image/gif') return file
  if (typeof document === 'undefined') return file

  try {
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const img: HTMLImageElement = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = dataUrl
    })

    let { width, height } = img
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, width, height)

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    )
    if (!blob || blob.size >= file.size) return file

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export type UploadImageOptions = {
  file: File
  bucket: string
  businessId?: string | null
  folder?: string
}

// Validate → compress → upload → return the public URL. Throws an Error with a
// user-facing French message on failure.
export async function uploadImage({ file, bucket, businessId, folder }: UploadImageOptions): Promise<{ url: string }> {
  const validationError = validateImageFile(file)
  if (validationError) throw new Error(validationError)

  const converted = await convertHeicIfNeeded(file)
  const processed = await compressImage(converted)
  if (processed.size > MAX_BYTES) throw new Error('Image trop grande (max 5MB)')

  const parts: string[] = []
  if (businessId) parts.push(businessId)
  if (folder) parts.push(folder)
  const prefix = parts.length ? `${parts.join('/')}/` : ''
  const fileName = `${prefix}${Date.now()}-${sanitizeName(processed.name)}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, processed, { cacheControl: '3600', upsert: false })

  if (error) {
    console.error('Upload error:', error)
    throw new Error('Erreur upload image: ' + error.message)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return { url: data.publicUrl }
}
