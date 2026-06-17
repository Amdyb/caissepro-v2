export type TicketStatus = 'open' | 'en_cours' | 'resolu' | 'ferme'
export type TicketPriority = 'normal' | 'urgent'

export type SupportTicket = {
  id: string
  ticket_number: string | null
  user_id: string | null
  business_id: string | null
  name: string
  email: string | null
  phone: string | null
  category: string | null
  subject: string
  message: string
  status: TicketStatus
  priority: TicketPriority
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export type TicketReply = {
  id: string
  ticket_id: string
  author_id: string | null
  author_name: string | null
  is_admin: boolean
  message: string
  created_at: string
}

export const TICKET_STATUS_META: Record<TicketStatus, { label: string; badge: string; dot: string }> = {
  open:     { label: 'Ouvert',   badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300', dot: 'bg-orange-500' },
  en_cours: { label: 'En cours', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',         dot: 'bg-blue-500' },
  resolu:   { label: 'Résolu',   badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dot: 'bg-emerald-500' },
  ferme:    { label: 'Fermé',    badge: 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-white/50',           dot: 'bg-slate-400' },
}

export const TICKET_STATUS_ORDER: TicketStatus[] = ['open', 'en_cours', 'resolu', 'ferme']

export const TICKET_CATEGORIES: { value: string; label: string }[] = [
  { value: 'connexion', label: 'Connexion' },
  { value: 'paiement', label: 'Paiement' },
  { value: 'produits', label: 'Produits' },
  { value: 'ventes', label: 'Ventes' },
  { value: 'autre', label: 'Autre' },
]

export function categoryLabel(value: string | null): string {
  if (!value) return 'Général'
  return TICKET_CATEGORIES.find((c) => c.value === value)?.label || value
}

export function statusMeta(status: string | null) {
  return TICKET_STATUS_META[(status as TicketStatus)] || TICKET_STATUS_META.open
}
