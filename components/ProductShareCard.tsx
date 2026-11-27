'use client'

import * as htmlToImage from 'html-to-image'
import { Check, Copy, Download, Loader2, Share2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type ShareProduct = {
  id: string
  name: string
  short_description?: string | null
  sell_price?: number | null
  image?: string | null
}

function formatCfa(value: number) {
  return `${Number(value || 0).toLocaleString('fr-FR')} CFA`
}

function safeFileName(name: string) {
  return (name || 'produit')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 60) || 'produit'
}

export default function ProductShareCard({
  product,
  shopName,
  shopSlug,
  hidePrices,
  primaryColor = '#16a34a',
  onClose,
}: {
  product: ShareProduct
  shopName: string
  shopSlug: string
  hidePrices: boolean
  primaryColor?: string
  onClose: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  // Ready = the card image has finished loading (or there is no image). Capturing
  // before this flips comes out blank, so the Share button waits on it.
  const [imgReady, setImgReady] = useState(!product.image)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const shopLink = `caissepro.app/shop/${shopSlug}`
  const caption = [product.name, product.short_description?.trim(), '', shopLink]
    .filter((l) => l !== undefined && l !== null)
    .join('\n')

  // Fetch the product image as a data URL first. Inlining the bytes sidesteps
  // cross-origin canvas tainting so the capture (and download) always works;
  // if the fetch is blocked we fall back to the raw URL + crossOrigin.
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!product.image) { setImgReady(true); return }
      try {
        const res = await fetch(product.image, { mode: 'cors' })
        const blob = await res.blob()
        const reader = new FileReader()
        reader.onloadend = () => { if (!cancelled) setImgSrc(reader.result as string) }
        reader.readAsDataURL(blob)
      } catch {
        if (!cancelled) setImgSrc(product.image || null)
      }
    }
    load()
    return () => { cancelled = true }
  }, [product.image])

  async function capture(): Promise<Blob | null> {
    if (!cardRef.current) return null
    return htmlToImage.toBlob(cardRef.current, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: '#0b0b0b',
    })
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeFileName(product.name)}-${shopSlug || 'boutique'}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function handleShare() {
    if (busy || !imgReady) return
    setBusy(true)
    setError('')
    try {
      const blob = await capture()
      if (!blob) throw new Error('capture')
      const file = new File([blob], `${safeFileName(product.name)}.png`, { type: 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: any) => boolean }
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text: caption })
      } else {
        // No native share (desktop / unsupported): download image + copy caption.
        downloadBlob(blob)
        try { await navigator.clipboard.writeText(caption); setCopied(true) } catch {}
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') setError("Le partage a échoué. Essayez « Télécharger ».")
    } finally {
      setBusy(false)
    }
  }

  async function handleDownload() {
    if (busy || !imgReady) return
    setBusy(true)
    setError('')
    try {
      const blob = await capture()
      if (!blob) throw new Error('capture')
      downloadBlob(blob)
    } catch {
      setError("La génération de l'image a échoué.")
    } finally {
      setBusy(false)
    }
  }

  async function handleCopyCaption() {
    try { await navigator.clipboard.writeText(caption); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  const priceLabel = hidePrices ? 'Prix sur demande' : formatCfa(Number(product.sell_price || 0))

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-h-full w-full max-w-sm overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-black text-white"><Share2 size={18} /> Partager le produit</h3>
          <button onClick={onClose} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X size={18} /></button>
        </div>

        {/* The card that gets captured to an image. */}
        <div ref={cardRef} className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0b] text-white">
          <div className="relative aspect-square w-full bg-white/5">
            {imgSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgSrc}
                alt={product.name}
                crossOrigin="anonymous"
                onLoad={() => setImgReady(true)}
                onError={() => setImgReady(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/20">
                <Share2 size={48} />
              </div>
            )}
          </div>

          <div className="p-5">
            <h4 className="text-xl font-black leading-tight">{product.name}</h4>
            {product.short_description?.trim() && (
              <p className="mt-2 text-sm font-semibold leading-snug text-white/60">{product.short_description}</p>
            )}
            <p className="mt-3 text-2xl font-black" style={{ color: primaryColor }}>{priceLabel}</p>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                <span className="text-sm font-black">{shopName}</span>
              </div>
              <span className="text-[11px] font-bold text-white/40">{shopLink}</span>
            </div>
          </div>
        </div>

        {error && <p className="mt-3 rounded-2xl bg-rose-500/15 px-4 py-3 text-center text-xs font-black text-rose-300">{error}</p>}

        <div className="mt-4 space-y-2.5">
          <button
            onClick={handleShare}
            disabled={busy || !imgReady}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white shadow-xl disabled:opacity-60"
            style={{ backgroundColor: primaryColor }}
          >
            {busy ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
            {!imgReady ? 'Préparation...' : busy ? 'Génération...' : 'Partager'}
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleDownload}
              disabled={busy || !imgReady}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-3.5 text-sm font-black text-white hover:bg-white/10 disabled:opacity-60"
            >
              <Download size={17} /> Télécharger
            </button>
            <button
              onClick={handleCopyCaption}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-3.5 text-sm font-black text-white hover:bg-white/10"
            >
              {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Copié' : 'Légende'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
