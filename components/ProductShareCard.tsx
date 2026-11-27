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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Load a src into a detached Image and resolve only once it is actually decoded
// (pixels ready), with a timeout so a hung load never blocks the capture forever.
function preloadImage(src: string, timeoutMs = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    let settled = false
    const done = (ok: boolean) => { if (!settled) { settled = true; resolve(ok) } }
    const timer = setTimeout(() => done(false), timeoutMs)
    img.onload = async () => {
      try { if (img.decode) await img.decode() } catch {}
      clearTimeout(timer)
      done(true)
    }
    img.onerror = () => { clearTimeout(timer); done(false) }
    img.src = src
  })
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
  const imgElRef = useRef<HTMLImageElement>(null)
  // The resolved image source actually painted into the card (a data URL when we
  // could inline it, so the capture canvas is never cross-origin tainted).
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  // The product image could not be loaded — render a branded fallback, never a
  // black box.
  const [imgFailed, setImgFailed] = useState(false)
  // Prep finished (success or failure): the image is decoded and safe to capture.
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const shopLink = `caissepro.app/shop/${shopSlug}`
  const caption = `${[product.name, product.short_description?.trim() || null].filter(Boolean).join('\n')}\n\n${shopLink}`

  // Prepare the image before any capture can run:
  //   1. Fetch the bytes and inline them as a data URL (sidesteps cross-origin
  //      canvas tainting even if the bucket's CORS headers are imperfect).
  //   2. If the fetch is blocked, fall back to the raw URL loaded with
  //      crossOrigin=anonymous (works when Supabase returns Access-Control-*).
  //   3. Await the chosen source actually decoding before marking ready.
  //   4. If nothing loads, flag failure so the card shows a branded placeholder.
  useEffect(() => {
    let cancelled = false
    async function prepare() {
      if (!product.image) { setImgFailed(true); setReady(true); return }

      let candidate: string | null = null
      try {
        const res = await fetch(product.image, { mode: 'cors', cache: 'no-store' })
        if (res.ok) candidate = await blobToDataUrl(await res.blob())
      } catch {
        /* fall through to raw-URL attempt */
      }
      if (cancelled) return

      const src = candidate || product.image
      const ok = await preloadImage(src)
      if (cancelled) return

      if (ok) { setImgSrc(src); setImgFailed(false) }
      else { setImgFailed(true) }
      setReady(true)
    }
    prepare()
    return () => { cancelled = true }
  }, [product.image])

  async function capture(): Promise<Blob | null> {
    const node = cardRef.current
    if (!node) return null
    // Make sure the on-screen <img> is fully decoded before snapshotting.
    try { await imgElRef.current?.decode?.() } catch {}
    const opts = { pixelRatio: 3, cacheBust: false, backgroundColor: '#0b0b0b' as string }
    // Safari/iOS frequently renders the first html-to-image pass blank; warm up
    // with a couple of throwaway passes, then take the real capture.
    await htmlToImage.toPng(node, opts).catch(() => {})
    await htmlToImage.toPng(node, opts).catch(() => {})
    return htmlToImage.toBlob(node, opts)
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
    if (busy || !ready) return
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
    if (busy || !ready) return
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
          <div className="relative aspect-square w-full" style={{ backgroundColor: '#0b0b0b' }}>
            {imgSrc && !imgFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgElRef}
                src={imgSrc}
                alt={product.name}
                crossOrigin="anonymous"
                className="h-full w-full object-cover"
              />
            ) : !ready ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="animate-spin text-white/30" size={32} />
              </div>
            ) : (
              // Branded fallback — never a black rectangle when the photo fails.
              <div
                className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, #0b0b0b)` }}
              >
                <span className="text-3xl font-black leading-tight text-white drop-shadow">{product.name}</span>
                <span className="text-sm font-black uppercase tracking-widest text-white/70">{shopName}</span>
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
            disabled={busy || !ready}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white shadow-xl disabled:opacity-60"
            style={{ backgroundColor: primaryColor }}
          >
            {busy || !ready ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
            {!ready ? 'Préparation...' : busy ? 'Génération...' : 'Partager'}
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleDownload}
              disabled={busy || !ready}
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
