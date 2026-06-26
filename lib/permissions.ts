// Centralized role permission helpers.
//
// Roles in business_members.role:
//   owner / admin   → Propriétaire — full access
//   manager         → Manager — daily operations, but products & employees are
//                     VIEW ONLY, and no categories/suppliers/security zone
//   sales/cashier/staff/employee/vendeur → Caissier — POS-focused, view-only catalog

export const OWNER_ROLES = ['owner', 'admin']
export const STAFF_ROLES = ['sales', 'staff', 'employee', 'cashier', 'vendeur']

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
