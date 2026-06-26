// Centralized role permission helpers.
//
// Roles in business_members.role:
//   owner / admin   → Propriétaire — full access
//   manager         → Manager — daily operations, but products & employees are
//                     VIEW ONLY, and no categories/suppliers/security zone
//   sales/cashier/staff/employee/vendeur → Caissier — POS-focused, view-only catalog

// 'proprietaire' is the French role stored for owners in business_members and is
// the value used by the vast majority of accounts — it MUST grant full access.
export const OWNER_ROLES = ['owner', 'admin', 'proprietaire']
// Includes both the French ('caissier') and English ('cashier') cashier values
// so view-only gating applies consistently regardless of which was stored.
export const STAFF_ROLES = ['sales', 'staff', 'employee', 'cashier', 'caissier', 'vendeur']

// Read-only message shown when a view-only role hits a write action/route.
export const READ_ONLY_MESSAGE = 'Accès en lecture seule'

// Roles that may only CONSULT the catalog (no add/edit/delete of products).
// Managers are now view-only on products alongside cashiers/staff.
export const PRODUCT_READ_ONLY_ROLES = [...STAFF_ROLES, 'manager']

// Roles that may only CONSULT the team (no add/edit/deactivate of employees).
export const EMPLOYEE_READ_ONLY_ROLES = [...STAFF_ROLES, 'manager']

// True when the role can create/edit/delete products (owner & admin only).
export function canManageProducts(role?: string | null): boolean {
  return !!role && OWNER_ROLES.includes(role)
}

// True when the role can add/edit/deactivate employees (owner & admin only).
export function canManageEmployees(role?: string | null): boolean {
  return !!role && OWNER_ROLES.includes(role)
}
