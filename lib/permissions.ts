// Centralized role permission helpers.
//
// Roles in business_members.role:
//   proprietaire / owner → Propriétaire — full access (evaluated first)
//   manager / admin      → Manager — see notes below; the exact scope is now
//                     per-business (broad by default, narrowed for Dakar Vapes)
//   sales/cashier/staff/employee/vendeur → Caissier — POS-focused, view-only catalog
//
// Per-business Manager role:
//   • Default (all businesses): broad Manager — full Produits, Catégories,
//     Fournisseurs, Clients, Dépenses, Rapports, Boutique, Employés. Everything
//     EXCEPT the Zone de Sécurité.
//   • Dakar Vapes ONLY: tightly LOCKED Manager — exactly Vendre, Remboursements,
//     Caisse du jour, Dépenses, Produits (view + stock only), Rapports (view),
//     Commandes en ligne (full), Ma Boutique (view + share only), Profil, Aide.
//     Nothing else: no Catégories/Fournisseurs/Clients/Employés/Historique/
//     Finances/Client Doit/Coach/advanced settings.
// Per-business Vendeur / Caissier role:
//   • Default (all businesses): POS-focused staff — Vendre, Produits (view),
//     Caisse du jour, Dépenses.
//   • Dakar Vapes ONLY: locked Vendeur — exactly Vendre, Dépenses, Produits
//     (view), Commandes en ligne (full), Ma Boutique (view + share), Profil,
//     Aide. No Remboursement, no Caisse du jour, no Rapport.
// The active business is the one selected in localStorage (multi-boutique).

// 'proprietaire' is the French role stored for owners in business_members and is
// the value used by the vast majority of accounts — it MUST grant full access.
// Evaluated FIRST in every permission check — never falls into manager/staff paths.
export const OWNER_ROLES   = ['proprietaire', 'owner']
// 'admin' is manager-tier, not owner. Do not add 'owner' here.
export const MANAGER_ROLES = ['manager', 'admin']
// Includes both the French ('caissier') and English ('cashier') cashier values
// so view-only gating applies consistently regardless of which was stored.
export const STAFF_ROLES   = ['sales', 'staff', 'employee', 'cashier', 'caissier', 'vendeur']

// Read-only message shown when a view-only role hits a write action/route.
export const READ_ONLY_MESSAGE = 'Accès en lecture seule'

// Businesses whose Manager role uses the NARROWED config. Every other business
// gets the broad Manager role. Currently only Dakar Vapes is narrowed.
export const DAKAR_VAPES_BUSINESS_ID = 'a5714754-8360-4e60-87fc-f08a1d0f6b2e'

// localStorage key holding the active business id (multi-boutique selector).
const SELECTED_BIZ_KEY = 'caissepro_selected_business_id'

// Reads the currently selected business id from localStorage. Returns null on the
// server or when nothing is selected.
export function getSelectedBusinessId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(SELECTED_BIZ_KEY)
  } catch {
    return null
  }
}

// True when the Manager role is NARROWED for this business (Dakar Vapes only).
// Falls back to the localStorage-selected business when no id is passed.
export function isManagerNarrowed(businessId?: string | null): boolean {
  const id = businessId ?? getSelectedBusinessId()
  return id === DAKAR_VAPES_BUSINESS_ID
}

// Staff or narrowed-business manager → read-only on catalog/team resources.
function isNarrowedAccess(role?: string | null, businessId?: string | null): boolean {
  if (!role) return false
  if (STAFF_ROLES.includes(role)) return true
  if (MANAGER_ROLES.includes(role)) return isManagerNarrowed(businessId)
  return false
}

// Owner or broad-business manager → write access on catalog/team/storefront resources.
function hasBroadAccess(role?: string | null, businessId?: string | null): boolean {
  if (!role) return false
  if (OWNER_ROLES.includes(role)) return true
  if (MANAGER_ROLES.includes(role)) return !isManagerNarrowed(businessId)
  return false
}

export function isProductReadOnly(role?: string | null, businessId?: string | null): boolean {
  return isNarrowedAccess(role, businessId)
}

export function isEmployeeReadOnly(role?: string | null, businessId?: string | null): boolean {
  return isNarrowedAccess(role, businessId)
}

export function canManageProducts(role?: string | null, businessId?: string | null): boolean {
  return hasBroadAccess(role, businessId)
}

export function canManageEmployees(role?: string | null, businessId?: string | null): boolean {
  return hasBroadAccess(role, businessId)
}

// Owners and broad Managers can customize storefront; Dakar Vapes Manager/Vendeur
// and all staff get view + share only.
export function canCustomizeStorefront(role?: string | null, businessId?: string | null): boolean {
  return hasBroadAccess(role, businessId)
}
