'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, Shield } from 'lucide-react'

const LAST_UPDATED = '22 mai 2026'

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} /> Retour
        </Link>

        {/* Header */}
        <div className="mb-10 rounded-[2rem] bg-slate-950 px-8 py-10 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black">Mentions légales</h1>
              <p className="mt-1 text-sm font-semibold text-slate-400">Dernière mise à jour : {LAST_UPDATED}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">

          {/* Table of contents */}
          <nav className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Sommaire</p>
            <div className="space-y-2">
              {[
                ['#conditions', 'Conditions générales d\'utilisation'],
                ['#confidentialite', 'Politique de confidentialité'],
                ['#donnees', 'Données personnelles'],
                ['#cookies', 'Cookies'],
                ['#responsabilite', 'Limitation de responsabilité'],
                ['#contact', 'Contact'],
              ].map(([href, label]) => (
                <a key={href} href={href} className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-950">
                  <FileText size={14} className="shrink-0 text-emerald-600" /> {label}
                </a>
              ))}
            </div>
          </nav>

          {/* CGU */}
          <section id="conditions" className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-black text-slate-950">1. Conditions générales d'utilisation</h2>

            <div className="space-y-5 text-sm leading-7 text-slate-600">
              <div>
                <h3 className="mb-2 font-black text-slate-900">1.1 Acceptation des conditions</h3>
                <p>En accédant à CaissePro et en utilisant nos services, vous acceptez d'être lié par les présentes conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.</p>
              </div>

              <div>
                <h3 className="mb-2 font-black text-slate-900">1.2 Description du service</h3>
                <p>CaissePro est une solution de point de vente (POS) en ligne destinée aux commerçants et entrepreneurs. Le service comprend la gestion des ventes, des produits, des clients, des employés, des stocks, et une vitrine boutique en ligne.</p>
              </div>

              <div>
                <h3 className="mb-2 font-black text-slate-900">1.3 Inscription et compte</h3>
                <p>Pour utiliser CaissePro, vous devez créer un compte en fournissant des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants de connexion. Toute activité effectuée depuis votre compte est sous votre responsabilité.</p>
              </div>

              <div>
                <h3 className="mb-2 font-black text-slate-900">1.4 Utilisation autorisée</h3>
                <p>Vous vous engagez à utiliser CaissePro uniquement à des fins légales et conformément aux présentes conditions. Il est interdit d'utiliser notre service pour :</p>
                <ul className="mt-2 space-y-1 pl-5">
                  <li className="list-disc">Enregistrer ou traiter des transactions frauduleuses</li>
                  <li className="list-disc">Vendre des produits ou services illicites</li>
                  <li className="list-disc">Tenter d'accéder de façon non autorisée à nos systèmes</li>
                  <li className="list-disc">Reproduire ou revendre notre service sans autorisation</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-black text-slate-900">1.5 Abonnement et paiement</h3>
                <p>CaissePro propose des formules gratuites et payantes. Les tarifs des formules payantes sont indiqués sur la page de tarification. Tout abonnement est facturé à l'avance et non remboursable sauf disposition contraire de la loi applicable.</p>
              </div>

              <div>
                <h3 className="mb-2 font-black text-slate-900">1.6 Résiliation</h3>
                <p>Vous pouvez résilier votre compte à tout moment depuis les paramètres de votre compte. CaissePro se réserve le droit de suspendre ou résilier tout compte en cas de violation des présentes conditions.</p>
              </div>
            </div>
          </section>

          {/* Politique de confidentialité */}
          <section id="confidentialite" className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-black text-slate-950">2. Politique de confidentialité</h2>

            <div className="space-y-5 text-sm leading-7 text-slate-600">
              <div>
                <h3 className="mb-2 font-black text-slate-900">2.1 Notre engagement</h3>
                <p>CaissePro s'engage à protéger la vie privée de ses utilisateurs. Cette politique décrit comment nous collectons, utilisons et protégeons vos informations personnelles.</p>
              </div>

              <div>
                <h3 className="mb-2 font-black text-slate-900">2.2 Informations collectées</h3>
                <p>Nous collectons les informations suivantes :</p>
                <ul className="mt-2 space-y-1 pl-5">
                  <li className="list-disc"><strong>Informations de compte :</strong> nom, adresse email, mot de passe chiffré</li>
                  <li className="list-disc"><strong>Informations boutique :</strong> nom, adresse, téléphone, logo, slug</li>
                  <li className="list-disc"><strong>Données de transaction :</strong> ventes, produits, clients, paiements</li>
                  <li className="list-disc"><strong>Données d'usage :</strong> pages visitées, actions effectuées (à des fins d'amélioration du service)</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-black text-slate-900">2.3 Utilisation des données</h3>
                <p>Vos données sont utilisées pour :</p>
                <ul className="mt-2 space-y-1 pl-5">
                  <li className="list-disc">Fournir et améliorer nos services</li>
                  <li className="list-disc">Gérer votre compte et votre abonnement</li>
                  <li className="list-disc">Vous envoyer des notifications importantes relatives à votre compte</li>
                  <li className="list-disc">Assurer la sécurité et prévenir la fraude</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-black text-slate-900">2.4 Partage des données</h3>
                <p>Nous ne vendons jamais vos données personnelles à des tiers. Vos données peuvent être partagées uniquement avec nos prestataires techniques (hébergement, authentification) dans le cadre strict de la fourniture du service.</p>
              </div>
            </div>
          </section>

          {/* Données personnelles */}
          <section id="donnees" className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-black text-slate-950">3. Données personnelles (RGPD)</h2>

            <div className="space-y-5 text-sm leading-7 text-slate-600">
              <div>
                <h3 className="mb-2 font-black text-slate-900">3.1 Vos droits</h3>
                <p>Conformément à la réglementation applicable, vous disposez des droits suivants :</p>
                <ul className="mt-2 space-y-1 pl-5">
                  <li className="list-disc"><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
                  <li className="list-disc"><strong>Droit de rectification :</strong> corriger des données inexactes</li>
                  <li className="list-disc"><strong>Droit à l'effacement :</strong> demander la suppression de votre compte et données</li>
                  <li className="list-disc"><strong>Droit à la portabilité :</strong> exporter vos données dans un format standard</li>
                  <li className="list-disc"><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-black text-slate-900">3.2 Conservation des données</h3>
                <p>Vos données sont conservées le temps nécessaire à la fourniture du service et au respect de nos obligations légales. Après résiliation de votre compte, vos données sont supprimées sous 30 jours, sauf obligation légale de conservation.</p>
              </div>

              <div>
                <h3 className="mb-2 font-black text-slate-900">3.3 Sécurité</h3>
                <p>Nous utilisons des mesures de sécurité robustes : chiffrement TLS, authentification sécurisée via Supabase Auth, accès limité aux données sensibles. Malgré ces mesures, aucun système n'est infaillible.</p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section id="cookies" className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-black text-slate-950">4. Cookies</h2>
            <div className="space-y-4 text-sm leading-7 text-slate-600">
              <p>CaissePro utilise des cookies essentiels au fonctionnement du service (session d'authentification, préférences d'interface). Ces cookies sont strictement nécessaires et ne peuvent pas être désactivés.</p>
              <p>Nous n'utilisons pas de cookies à des fins publicitaires ou de tracking tiers.</p>
            </div>
          </section>

          {/* Responsabilité */}
          <section id="responsabilite" className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-black text-slate-950">5. Limitation de responsabilité</h2>
            <div className="space-y-4 text-sm leading-7 text-slate-600">
              <p>CaissePro est fourni "tel quel". Nous ne garantissons pas une disponibilité ininterrompue du service. En aucun cas, CaissePro ne pourra être tenu responsable de pertes de données, de revenus ou de dommages indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le service.</p>
              <p>L'utilisateur est seul responsable de la légalité de ses activités commerciales et de la conformité de ses transactions avec la législation en vigueur dans son pays.</p>
            </div>
          </section>

          {/* Contact */}
          <section id="contact" className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-black text-slate-950">6. Contact</h2>
            <p className="text-sm leading-7 text-slate-600">
              Pour toute question relative à ces mentions légales ou à vos données personnelles, contactez-nous à :<br />
              <a href="mailto:contact@caissepro.app" className="mt-2 inline-block font-black text-emerald-700 hover:underline">contact@caissepro.app</a>
            </p>
            <p className="mt-4 text-xs font-semibold text-slate-500">CaissePro — Dakar, Sénégal</p>
          </section>

        </div>

        <p className="mt-10 text-center text-xs font-bold text-slate-400">
          © {new Date().getFullYear()} CaissePro · Tous droits réservés
        </p>
      </div>
    </main>
  )
}
