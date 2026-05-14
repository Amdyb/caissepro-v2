import { BarChart3, CalendarClock, CreditCard, HandCoins, Home, Package, ReceiptText, Settings, Shuffle, ShoppingCart, Store, Truck, Users, Wallet } from 'lucide-react'

export function getDashboardCards(type: string) {
  if (type === 'tontine') {
    return [
      { title: 'Groupes tontine', text: 'Créer et gérer les groupes.', href: '/tontines', icon: Users, primary: true },
      { title: 'Participants', text: 'Membres, téléphones et statuts.', href: '/tontine-participants', icon: Users },
      { title: 'Cotisations', text: 'Paiements, retards et preuves.', href: '/tontine-contributions', icon: HandCoins },
      { title: 'Tirages', text: 'Tirage aléatoire transparent.', href: '/tontine-draws', icon: Shuffle },
      { title: 'Rappels WhatsApp', text: 'Relancer les participants.', href: '/automation/reminders', icon: CalendarClock },
      { title: 'Rapports tontine', text: 'Suivi des cycles et gagnants.', href: '/reports', icon: BarChart3 }
    ]
  }

  if (type === 'rental') {
    return [
      { title: 'Biens immobiliers', text: 'Appartements, chambres et immeubles.', href: '/properties', icon: Home, primary: true },
      { title: 'Locataires', text: 'Profils, contacts et contrats.', href: '/tenants', icon: Users },
      { title: 'Loyers', text: 'Paiements, retards et reçus.', href: '/rent-payments', icon: HandCoins },
      { title: 'Rappels loyer', text: 'Relances WhatsApp automatiques.', href: '/automation/reminders', icon: CalendarClock },
      { title: 'Dépenses', text: 'Réparations et charges.', href: '/expenses', icon: Wallet },
      { title: 'Rapports locatifs', text: 'Revenus et impayés.', href: '/reports', icon: BarChart3 }
    ]
  }

  if (type === 'restaurant') {
    return [
      { title: 'Vendre', text: 'Encaisser rapidement.', href: '/pos', icon: ShoppingCart, primary: true },
      { title: 'Menu', text: 'Plats, prix et catégories.', href: '/products', icon: Package },
      { title: 'Commandes', text: 'Suivi des commandes.', href: '/sales', icon: ReceiptText },
      { title: 'Clients', text: 'Fidélité et contacts.', href: '/customers', icon: Users },
      { title: 'Dépenses', text: 'Charges et ingrédients.', href: '/expenses', icon: Wallet },
      { title: 'Rapports', text: 'Ventes, plats populaires et profits.', href: '/reports', icon: BarChart3 }
    ]
  }

  return [
    { title: 'Vendre', text: 'Ouvrir la caisse et vendre.', href: '/pos', icon: ShoppingCart, primary: true },
    { title: 'Produits', text: 'Inventaire, photos, prix et stock.', href: '/products', icon: Package },
    { title: 'Ventes', text: 'Historique, reçus et factures.', href: '/sales', icon: ReceiptText },
    { title: 'Clients', text: 'Fidélité, contacts et achats.', href: '/customers', icon: Users },
    { title: 'Client Doit', text: 'Dettes clients et remboursements.', href: '/debts', icon: HandCoins },
    { title: 'Paiements', text: 'Liens, preuves et vérification.', href: '/payment-links', icon: CreditCard },
    { title: 'Fournisseurs', text: 'Contacts et soldes fournisseurs.', href: '/suppliers', icon: Truck },
    { title: 'Dépenses', text: 'Charges et profits réels.', href: '/expenses', icon: Wallet },
    { title: 'Boutique en ligne', text: 'Partager votre boutique.', href: '/storefront', icon: Store },
    { title: 'Rapports', text: 'Performance commerciale.', href: '/reports', icon: BarChart3 },
    { title: 'Caisse jour', text: 'Cash journalier et fermeture.', href: '/register-shifts', icon: CalendarClock },
    { title: 'Paramètres', text: 'Branding et informations.', href: '/settings', icon: Settings }
  ]
}
