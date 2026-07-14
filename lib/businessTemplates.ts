export type BusinessTemplate = {
  id: string
  label: string
  dashboardTitle: string
  modules: string[]
  storefrontEnabled: boolean
  primaryColor: string
}

export const BUSINESS_TEMPLATES: Record<string, BusinessTemplate> = {
  retail: {
    id: 'retail',
    label: 'Commerce & Boutique',
    dashboardTitle: 'Gestion commerciale',
    storefrontEnabled: true,
    primaryColor: 'emerald',
    modules: ['pos','inventory','products','customers','client_debt','reports','expenses','suppliers','payments','storefront']
  },
  restaurant: {
    id: 'restaurant',
    label: 'Restaurant & Fast Food',
    dashboardTitle: 'Gestion restauration',
    storefrontEnabled: true,
    primaryColor: 'orange',
    modules: ['menu','orders','tables','kitchen','customers','payments','reports']
  },
  laundry: {
    id: 'laundry',
    label: 'Blanchisserie & Pressing',
    dashboardTitle: 'Gestion pressing',
    storefrontEnabled: true,
    primaryColor: 'sky',
    modules: ['laundry_tickets','laundry_services','customers','payments','pickup','delivery','reports','storefront']
  },
  beauty: {
    id: 'beauty',
    label: 'Salon & Beauté',
    dashboardTitle: 'Gestion salon & beauté',
    storefrontEnabled: true,
    primaryColor: 'pink',
    modules: ['appointments','services','customers','products','payments','reports','storefront']
  },
  tontine: {
    id: 'tontine',
    label: 'Tontine & Épargne',
    dashboardTitle: 'Gestion tontine',
    storefrontEnabled: false,
    primaryColor: 'amber',
    modules: ['groups','members','contributions','draws','payment_proofs','transparency_links','reports','reminders']
  },
  rental: {
    id: 'rental',
    label: 'Gestion immobilière',
    dashboardTitle: 'Gestion locative',
    storefrontEnabled: false,
    primaryColor: 'sky',
    modules: ['properties','tenants','rent_payments','reminders','receipts','reports']
  },
  services: {
    id: 'services',
    label: 'Services',
    dashboardTitle: 'Gestion services',
    storefrontEnabled: true,
    primaryColor: 'violet',
    modules: ['appointments','customers','invoices','payments','reports','storefront']
  },
  service: {
    id: 'service',
    label: 'Services',
    dashboardTitle: 'Gestion services',
    storefrontEnabled: true,
    primaryColor: 'violet',
    modules: ['appointments','customers','invoices','payments','reports','storefront']
  },
  grocery: {
    id: 'grocery',
    label: 'Épicerie & Alimentation',
    dashboardTitle: 'Gestion épicerie',
    storefrontEnabled: true,
    primaryColor: 'emerald',
    modules: ['pos','inventory','products','customers','suppliers','payments','reports','storefront']
  },
  electronics: {
    id: 'electronics',
    label: 'Électronique',
    dashboardTitle: 'Gestion électronique',
    storefrontEnabled: true,
    primaryColor: 'blue',
    modules: ['pos','inventory','products','repairs','customers','payments','reports','storefront']
  },
  fashion: {
    id: 'fashion',
    label: 'Mode & Accessoires',
    dashboardTitle: 'Gestion mode',
    storefrontEnabled: true,
    primaryColor: 'fuchsia',
    modules: ['pos','inventory','products','customers','orders','payments','reports','storefront']
  }
}

export function normalizeBusinessType(type?: string | null) {
  if (!type) return 'retail'
  const clean = type.trim().toLowerCase()
  if (BUSINESS_TEMPLATES[clean]) return clean
  // New canonical keys → template equivalents
  if (clean === 'salon') return 'beauty'
  if (clean === 'pharmacie') return 'pharmacy'
  if (clean === 'grossiste') return 'wholesale'
  if (clean === 'bijouterie') return 'retail'
  // Legacy aliases
  if (clean === 'blanchisserie' || clean === 'pressing' || clean === 'dry_cleaning') return 'laundry'
  if (clean === 'service') return 'services'
  return 'retail'
}

export function getBusinessTemplate(type?: string | null) {
  return BUSINESS_TEMPLATES[normalizeBusinessType(type)] || BUSINESS_TEMPLATES.retail
}
