import type { LucideIcon } from 'lucide-react'
import { Gem, Package, PiggyBank, Pill, Scissors, Store, UtensilsCrossed } from 'lucide-react'

export type BusinessTypeConfig = {
  key: string
  label: string
  color: string
  icon: LucideIcon
  productsTabLabel: string
  addButtonLabel: string
  seedCategories: string[]
}

export const BUSINESS_TYPE_CONFIGS: BusinessTypeConfig[] = [
  {
    key: 'retail',
    label: 'Commerce & Boutique',
    color: '#16a34a',
    icon: Store,
    productsTabLabel: 'Produits',
    addButtonLabel: 'Ajouter un produit',
    seedCategories: ['Général', 'Alimentaire', 'Boissons', 'Hygiène', 'Divers'],
  },
  {
    key: 'restaurant',
    label: 'Restaurant & Fast-Food',
    color: '#ea580c',
    icon: UtensilsCrossed,
    productsTabLabel: 'Menu',
    addButtonLabel: 'Ajouter au menu',
    seedCategories: [
      'Plat du jour', 'Petit Déjeuner', 'Déjeuner', 'Dîner',
      'Grillades', 'Sandwichs & Burgers', 'Accompagnements',
      'Boissons', 'Jus Naturels', 'Desserts',
    ],
  },
  {
    key: 'salon',
    label: 'Salon & Beauté',
    color: '#db2777',
    icon: Scissors,
    productsTabLabel: 'Prestations',
    addButtonLabel: 'Ajouter une prestation',
    seedCategories: [
      'Coiffure', 'Tresses', 'Tissage', 'Défrisage',
      'Manucure', 'Pédicure', 'Maquillage', 'Soins Visage',
      'Produits Capillaires', 'Accessoires',
    ],
  },
  {
    key: 'pharmacie',
    label: 'Pharmacie',
    color: '#0891b2',
    icon: Pill,
    productsTabLabel: 'Médicaments',
    addButtonLabel: 'Ajouter un médicament',
    seedCategories: [
      'Médicaments', 'Antidouleurs', 'Antibiotiques', 'Paludisme',
      'Vitamines & Compléments', 'Soins Bébé', 'Hygiène & Beauté',
      'Matériel Médical', 'Parapharmacie',
    ],
  },
  {
    key: 'bijouterie',
    label: 'Bijouterie',
    color: '#d97706',
    icon: Gem,
    productsTabLabel: 'Collection',
    addButtonLabel: 'Ajouter à la collection',
    seedCategories: [
      'Or', 'Argent', 'Bagues', 'Colliers', 'Bracelets',
      "Boucles d'Oreilles", 'Montres', 'Pierres Précieuses', 'Réparation',
    ],
  },
  {
    key: 'grossiste',
    label: 'Grossiste',
    color: '#7c3aed',
    icon: Package,
    productsTabLabel: 'Produits',
    addButtonLabel: 'Ajouter un produit',
    seedCategories: ['Général', 'Alimentaire', 'Boissons', 'Hygiène', 'Divers'],
  },
  {
    key: 'tontine',
    label: 'Tontine',
    color: '#ca8a04',
    icon: PiggyBank,
    productsTabLabel: 'Produits',
    addButtonLabel: 'Ajouter un produit',
    seedCategories: [],
  },
]

// Old DB values → canonical new key. 'other' is a silent fallback (not shown in UI).
const KEY_ALIASES: Record<string, string> = {
  beauty: 'salon',
  pharmacy: 'pharmacie',
  wholesale: 'grossiste',
  other: 'retail',
  // removed types fall back to retail
  laundry: 'retail',
  rental: 'retail',
  garage: 'retail',
  btp: 'retail',
  services: 'retail',
  service: 'retail',
  grocery: 'retail',
  electronics: 'retail',
  fashion: 'retail',
}

export function normalizeBusinessTypeKey(key?: string | null): string {
  if (!key) return 'retail'
  const lower = key.trim().toLowerCase()
  if (BUSINESS_TYPE_CONFIGS.some((c) => c.key === lower)) return lower
  return KEY_ALIASES[lower] ?? 'retail'
}

export function getBusinessTypeConfig(key?: string | null): BusinessTypeConfig {
  const normalized = normalizeBusinessTypeKey(key)
  return BUSINESS_TYPE_CONFIGS.find((c) => c.key === normalized) ?? BUSINESS_TYPE_CONFIGS[0]
}
