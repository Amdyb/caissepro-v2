'use client'

import AppShell from '@/components/AppShell'
import ShopSwitcher from '@/components/ShopSwitcher'
import { supabase } from '@/lib/supabaseClient'
import { resolveSelectedBusiness, setSelectedBusinessId, ShopOption } from '@/lib/storefront'
import { Download, Printer, QrCode } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function QRCodePage() {
  const [shops, setShops] = useState<ShopOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [shopUrl, setShopUrl] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  async function loadShop(businessId: string) {
    const { data: biz } = await supabase
      .from('businesses')
      .select('name, slug')
      .eq('id', businessId)
      .maybeSingle()
    const slug = (biz as any)?.slug
    setBusinessName((biz as any)?.name || 'Ma boutique')
    setShopUrl(slug ? `${window.location.origin}/shop/${slug}` : '')
  }

  useEffect(() => {
    async function init() {
      const { businessId, shops } = await resolveSelectedBusiness()
      setShops(shops)
      setSelectedId(businessId)
      if (businessId) await loadShop(businessId)
      setLoading(false)
    }
    init()
  }, [])

  async function switchShop(id: string) {
    setSelectedBusinessId(id)
    setSelectedId(id)
    setShopUrl('')
    await loadShop(id)
  }

  const qrImageUrl = shopUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=20&data=${encodeURIComponent(shopUrl)}`
    : ''

  function downloadQR() {
    if (!qrImageUrl) return
    const a = document.createElement('a')
    a.href = qrImageUrl
    a.download = `qr-${businessName.toLowerCase().replace(/\s+/g, '-')}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function printQR() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code — ${businessName}</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
            img { width: 320px; height: 320px; }
            h1 { margin: 16px 0 4px; font-size: 22px; font-weight: 900; }
            p { margin: 0; font-size: 13px; color: #64748b; word-break: break-all; }
          </style>
        </head>
        <body>
          <img src="${qrImageUrl}" />
          <h1>${businessName}</h1>
          <p>${shopUrl}</p>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  if (loading) {
    return (
      <AppShell title="QR Code boutique" subtitle="Scannez pour accéder à votre boutique.">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-emerald-200" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="QR Code boutique" subtitle="Scannez pour accéder à votre boutique en ligne.">
      <div className="mx-auto max-w-lg space-y-5">
        <ShopSwitcher shops={shops} selectedId={selectedId} onChange={switchShop} />

        {!shopUrl ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <QrCode className="mx-auto mb-4 text-slate-300" size={48} />
            <h3 className="text-xl font-black text-slate-950">Boutique non configurée</h3>
            <p className="mt-2 text-sm font-bold text-slate-500">Configurez un slug dans les paramètres de votre boutique pour générer un QR code.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col items-center p-8">
                <div ref={printRef} className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrImageUrl} alt={`QR Code ${businessName}`} width={280} height={280} className="block" />
                </div>
                <h2 className="mt-5 text-2xl font-black text-slate-950">{businessName}</h2>
                <p className="mt-1 max-w-xs break-all text-center text-sm font-bold text-slate-400">{shopUrl}</p>
              </div>

              <div className="border-t border-slate-100 p-5 text-center">
                <p className="text-xs font-bold text-slate-400">Partagez ce QR code avec vos clients pour qu'ils accèdent directement à votre boutique.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={downloadQR}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-xl shadow-emerald-600/20"
              >
                <Download size={20} /> Télécharger
              </button>
              <button
                onClick={printQR}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-black text-slate-700 shadow-sm"
              >
                <Printer size={20} /> Imprimer
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
