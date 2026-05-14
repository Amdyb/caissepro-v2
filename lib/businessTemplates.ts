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
    label: 'Boutique / Retail',
    dashboardTitle: 'Gestion commerciale',
    storefrontEnabled: true,
    primaryColor: 'emerald',
    modules: [
      'pos',
      'inventory',
      'products',
      'customers',
      'client_debt',
      'reports',
      'expenses',
      'suppliers',
      'payments',
      'storefront'
    ]
  },

  restaurant: {
    id: 'restaurant',
    label: 'Restaurant',
    dashboardTitle: 'Gestion restauration',
    storefrontEnabled: true,
    primaryColor: 'orange',
    modules: [
      'menu',
      'orders',
      'tables',
      'kitchen',
      'customers',
      'payments',
      'reports'
    ]
  },

  tontine: {
    id: 'tontine',
    label: 'Tontine',
    dashboardTitle: 'Gestion tontine',
    storefrontEnabled: false,
    primaryColor: 'amber',
    modules: [
      'groups',
      'members',
      'contributions',
      'draws',
      'payment_proofs',
      'transparency_links',
      'reports',
      'reminders'
    ]
  },

  rental: {
    id: 'rental',
    label: 'Gestion immobilière',
    dashboardTitle: 'Gestion locative',
    storefrontEnabled: false,
    primaryColor: 'sky',
    modules: [
      'properties',
      'tenants',
      'rent_payments',
      'reminders',
      'receipts',
      'reports'
    ]
  },

  service: {
    id: 'service',
    label: 'Services',
    dashboardTitle: 'Gestion services',
    storefrontEnabled: true,
    primaryColor: 'violet',
    modules: [
      'appointments',
      'customers',
      'invoices',
      'payments',
      'reports'
    ]
  }
}

export function getBusinessTemplate(type?: string) {
  if (!type) return BUSINESS_TEMPLATES.retail

  return BUSINESS_TEMPLATES[type] || BUSINESS_TEMPLATES.retail
}
