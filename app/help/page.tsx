'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle, MessageCircle, Search } from 'lucide-react'

type FAQ = { question: string; answer: string }
type Section = { title: string; emoji: string; items: FAQ[] }

const FAQ_SECTIONS: Section[] = [
  {
    title: 'Démarrage',
    emoji: '🚀',
    items: [
      {
        question: 'Comment créer mon compte CaissePro ?',
        answer: 'Rendez-vous sur la page d\'inscription (/register), entrez votre email et un mot de passe. Votre boutique sera créée lors de la première connexion via l\'assistant d\'intégration (onboarding).'
      },
      {
        question: 'Comment configurer ma boutique ?',
        answer: 'Après connexion, accédez à Paramètres → Boutique en ligne pour renseigner le nom, le logo, l\'adresse, le téléphone et le lien public de votre boutique.'
      },
      {
        question: 'Puis-je utiliser CaissePro sans connexion Internet ?',
        answer: 'CaissePro nécessite une connexion Internet pour enregistrer les ventes et synchroniser les données. Une version hors-ligne est en cours de développement.'
      },
      {
        question: 'CaissePro est-il gratuit ?',
        answer: 'CaissePro propose une formule gratuite avec les fonctionnalités essentielles. Des formules payantes débloquent des fonctionnalités avancées (analytics, multi-boutiques, support prioritaire).'
      },
    ]
  },
  {
    title: 'Caisse & Ventes',
    emoji: '🧾',
    items: [
      {
        question: 'Comment enregistrer une vente ?',
        answer: 'Allez sur la page Point de Vente (/pos), sélectionnez les produits, cliquez sur le total en bas, choisissez le mode de paiement et confirmez. La vente est enregistrée automatiquement.'
      },
      {
        question: 'Comment envoyer un reçu par WhatsApp ?',
        answer: 'Après chaque vente, le drawer de confirmation affiche un bouton "Envoyer sur WhatsApp". Vous pouvez aussi accéder à n\'importe quelle vente dans l\'historique (/sales) et cliquer sur "Voir le reçu premium" pour le partager.'
      },
      {
        question: 'Comment imprimer un reçu ?',
        answer: 'Depuis la page de détail d\'une vente (/sales/[id]/receipt), cliquez sur "Imprimer". La page est optimisée pour l\'impression thermique en 80mm ou 58mm.'
      },
      {
        question: 'Comment gérer les paiements à crédit (Client Doit) ?',
        answer: 'Lors du paiement, sélectionnez "Client Doit". La dette est automatiquement enregistrée et visible dans la section Client Doit (/debts). Vous pouvez suivre et encaisser les dettes depuis cette page.'
      },
      {
        question: 'Puis-je annuler ou rembourser une vente ?',
        answer: 'Oui, rendez-vous dans Remboursements (/refunds) pour créer un remboursement lié à une vente existante.'
      },
    ]
  },
  {
    title: 'Produits & Stock',
    emoji: '📦',
    items: [
      {
        question: 'Comment ajouter un produit ?',
        answer: 'Allez dans Produits → Nouveau produit (/products/new). Renseignez le nom, le prix de vente, la catégorie, le stock initial et une image optionnelle.'
      },
      {
        question: 'Comment le stock est-il mis à jour ?',
        answer: 'Le stock est automatiquement décrémenté lors de chaque vente enregistrée. Vous pouvez ajuster le stock manuellement depuis la page de modification d\'un produit.'
      },
      {
        question: 'Comment archiver un produit sans le supprimer ?',
        answer: 'Dans la liste des produits, vous pouvez archiver un article. Il n\'apparaîtra plus dans le POS ni sur votre boutique en ligne, mais reste dans l\'historique.'
      },
      {
        question: 'Puis-je importer mes produits en masse ?',
        answer: 'L\'import CSV est disponible dans Paramètres → Sauvegarde & Export. Vous pouvez aussi exporter vos produits existants au format CSV.'
      },
    ]
  },
  {
    title: 'Clients',
    emoji: '👤',
    items: [
      {
        question: 'Comment ajouter un client ?',
        answer: 'Rendez-vous dans Clients (/customers) et cliquez sur "Ajouter un client". Vous pouvez aussi créer un client directement lors d\'une vente depuis le POS.'
      },
      {
        question: 'Comment voir l\'historique d\'achats d\'un client ?',
        answer: 'Dans Clients, cliquez sur le nom d\'un client pour voir son profil complet : total dépensé, nombre de ventes, solde dû et historique des transactions.'
      },
      {
        question: 'Comment gérer les dettes clients ?',
        answer: 'La section "Client Doit" (/debts) liste toutes les dettes en cours. Vous pouvez enregistrer un paiement partiel ou total directement depuis cette page.'
      },
    ]
  },
  {
    title: 'Employés',
    emoji: '👥',
    items: [
      {
        question: 'Comment ajouter un employé ?',
        answer: 'Allez dans Employés (/employees), saisissez l\'email et le nom de l\'employé. Un mot de passe temporaire est généré automatiquement — partagez-le via WhatsApp ou en le copiant.'
      },
      {
        question: 'Comment l\'employé active-t-il son compte ?',
        answer: 'L\'employé se rend sur la page /employee-setup, entre son email et le mot de passe temporaire, puis choisit son mot de passe définitif. Son compte est ensuite lié à votre boutique.'
      },
      {
        question: 'Quels rôles sont disponibles ?',
        answer: 'Trois rôles existent : Vendeur (accès caisse uniquement), Manager (caisse + rapports), Administrateur (accès complet). Les permissions peuvent être ajustées depuis la page Employés.'
      },
    ]
  },
  {
    title: 'Boutique en ligne',
    emoji: '🌐',
    items: [
      {
        question: 'Comment activer ma boutique en ligne ?',
        answer: 'Allez dans Ma Boutique en ligne (/storefront) et cliquez sur "Publier boutique". Votre vitrine sera accessible à l\'URL /shop/[votre-slug].'
      },
      {
        question: 'Comment les clients commandent-ils depuis ma boutique ?',
        answer: 'Sur votre vitrine publique, chaque produit a un bouton "Commander". Le client choisit son mode de paiement et est redirigé vers WhatsApp pour finaliser la commande avec vous.'
      },
      {
        question: 'Comment générer et imprimer mon QR code boutique ?',
        answer: 'Dans Ma Boutique en ligne ou dans Paramètres → Boutique en ligne, une section QR Code vous permet de télécharger votre QR code en PNG (512×512) ou de l\'imprimer directement.'
      },
      {
        question: 'Puis-je personnaliser les couleurs de ma boutique ?',
        answer: 'Oui, dans Paramètres → Boutique en ligne, vous pouvez choisir la couleur principale, le logo, la bannière et le slogan de votre vitrine publique.'
      },
    ]
  },
  {
    title: 'Compte & Sécurité',
    emoji: '🔐',
    items: [
      {
        question: 'Comment changer mon mot de passe ?',
        answer: 'Depuis la page de connexion (/login), cliquez sur "Mot de passe oublié ?". Vous recevrez un email avec un lien de réinitialisation. Vous pouvez aussi changer votre mot de passe depuis Paramètres → Profil.'
      },
      {
        question: 'Comment supprimer mon compte ?',
        answer: 'Allez dans Paramètres → Supprimer Boutique. Cette action supprime définitivement votre boutique et toutes les données associées. Cette opération est irréversible.'
      },
      {
        question: 'Mes données sont-elles sécurisées ?',
        answer: 'Oui. CaissePro utilise Supabase avec chiffrement TLS, authentification sécurisée et accès aux données contrôlé par des règles de sécurité strictes. Consultez nos mentions légales pour plus d\'informations.'
      },
    ]
  },
]

function FAQItem({ item }: { item: FAQ }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-black text-slate-900">{item.question}</span>
        {open ? <ChevronUp size={18} className="shrink-0 text-emerald-600" /> : <ChevronDown size={18} className="shrink-0 text-slate-400" />}
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 py-4 text-sm leading-7 text-slate-600">
          {item.answer}
        </div>
      )}
    </div>
  )
}

export default function HelpPage() {
  const [search, setSearch] = useState('')

  const filtered = FAQ_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        !search.trim() ||
        item.question.toLowerCase().includes(search.toLowerCase()) ||
        item.answer.toLowerCase().includes(search.toLowerCase())
    )
  })).filter((section) => section.items.length > 0)

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} /> Retour au tableau de bord
        </Link>

        {/* Header */}
        <div className="mb-10 rounded-[2rem] bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-10 text-white shadow-2xl shadow-emerald-600/20">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <HelpCircle size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black">Centre d'aide</h1>
              <p className="mt-1 text-sm font-semibold text-emerald-100">Tout ce qu'il faut savoir sur CaissePro</p>
            </div>
          </div>

          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une question..."
              className="w-full rounded-2xl bg-white/15 py-4 pl-12 pr-5 text-sm font-bold text-white placeholder:text-white/50 outline-none focus:bg-white/25 border border-white/20"
            />
          </div>
        </div>

        {/* FAQ sections */}
        <div className="space-y-8">
          {filtered.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <HelpCircle className="mx-auto mb-4 text-slate-300" size={44} />
              <p className="font-black text-slate-700">Aucun résultat pour "{search}"</p>
              <p className="mt-2 text-sm text-slate-500">Essayez avec d'autres mots-clés ou contactez notre support.</p>
            </div>
          ) : (
            filtered.map((section) => (
              <div key={section.title}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
                  <span>{section.emoji}</span> {section.title}
                </h2>
                <div className="space-y-2">
                  {section.items.map((item, i) => (
                    <FAQItem key={i} item={item} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contact CTA */}
        <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <MessageCircle className="mx-auto mb-3 text-emerald-600" size={32} />
          <h3 className="text-xl font-black text-slate-950">Vous n'avez pas trouvé votre réponse ?</h3>
          <p className="mt-2 text-sm text-slate-500">Notre équipe est disponible pour vous aider.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href="https://wa.me/221781234567"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
              <MessageCircle size={16} /> Contacter via WhatsApp
            </a>
            <a
              href="mailto:support@caissepro.app"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
            >
              Envoyer un email
            </a>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4 text-xs font-bold text-slate-400">
          <Link href="/legal" className="hover:text-slate-700">Mentions légales</Link>
          <span>·</span>
          <Link href="/dashboard" className="hover:text-slate-700">Tableau de bord</Link>
        </div>
      </div>
    </main>
  )
}
