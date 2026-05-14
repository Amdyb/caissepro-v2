export type Locale = 'fr' | 'en' | 'wo'

export const locales: { code: Locale; label: string; native: string }[] = [
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'wo', label: 'Wolof', native: 'Wolof' }
]

export const defaultLocale: Locale = 'fr'

export const translations: Record<Locale, Record<string, string>> = {
  fr: {
    'common.start': 'Démarrer',
    'common.login': 'Connexion',
    'common.register': 'Créer un compte',
    'common.demo': 'Voir la démo',
    'common.dashboard': 'Tableau de bord',
    'common.save': 'Enregistrer',
    'common.loading': 'Chargement...',
    'common.logout': 'Déconnexion',
    'brand.slogan': 'Développer le commerce en Afrique',

    'landing.nav.demo': 'Démo boutique',
    'landing.nav.benefits': 'Bénéfices',
    'landing.nav.pricing': 'Tarifs',
    'landing.pricing.title': 'Commencez gratuit. Grandissez quand vous êtes prêt.',
    'landing.pricing.label': 'TARIFS',
    'landing.plan.free': 'Gratuit',
    'landing.plan.starter': 'Starter',
    'landing.plan.business': 'Business',
    'landing.plan.premium': 'Premium',

    'auth.login.title': 'Connectez-vous à CaissePro',
    'auth.register.title': 'Créer votre compte CaissePro',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.submit.login': 'Se connecter',
    'auth.submit.register': 'Créer mon compte',
    'auth.beta': 'Accès bêta fondateur',

    'dashboard.title': 'Tableau de bord',
    'dashboard.today': 'Aujourd’hui',
    'dashboard.week': 'Cette semaine',
    'dashboard.alerts': 'Alertes',
    'dashboard.debts': 'À récupérer',
    'dashboard.modules': 'Modules actifs',
    'dashboard.quickAction': 'Action rapide'
  },
  en: {
    'common.start': 'Start',
    'common.login': 'Login',
    'common.register': 'Create account',
    'common.demo': 'View demo',
    'common.dashboard': 'Dashboard',
    'common.save': 'Save',
    'common.loading': 'Loading...',
    'common.logout': 'Logout',
    'brand.slogan': 'Develop commerce in Africa',

    'landing.nav.demo': 'Shop demo',
    'landing.nav.benefits': 'Benefits',
    'landing.nav.pricing': 'Pricing',
    'landing.pricing.title': 'Start free. Grow when you are ready.',
    'landing.pricing.label': 'PRICING',
    'landing.plan.free': 'Free',
    'landing.plan.starter': 'Starter',
    'landing.plan.business': 'Business',
    'landing.plan.premium': 'Premium',

    'auth.login.title': 'Login to CaissePro',
    'auth.register.title': 'Create your CaissePro account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.submit.login': 'Login',
    'auth.submit.register': 'Create my account',
    'auth.beta': 'Founding beta access',

    'dashboard.title': 'Dashboard',
    'dashboard.today': 'Today',
    'dashboard.week': 'This week',
    'dashboard.alerts': 'Alerts',
    'dashboard.debts': 'To collect',
    'dashboard.modules': 'Active modules',
    'dashboard.quickAction': 'Quick action'
  },
  wo: {
    'common.start': 'Tambali',
    'common.login': 'Dugg',
    'common.register': 'Sos compte',
    'common.demo': 'Xool démo bi',
    'common.dashboard': 'Tableau bi',
    'common.save': 'Aar',
    'common.loading': 'Mu ngi yebu...',
    'common.logout': 'Génn',
    'brand.slogan': 'Yokkute commerce ci Afrig',

    'landing.nav.demo': 'Démo boutique',
    'landing.nav.benefits': 'Njariñ yi',
    'landing.nav.pricing': 'Njëg yi',
    'landing.pricing.title': 'Tambali ak lu amul fay. Yokk sa business bu paree.',
    'landing.pricing.label': 'NJËG YI',
    'landing.plan.free': 'Amul fay',
    'landing.plan.starter': 'Starter',
    'landing.plan.business': 'Business',
    'landing.plan.premium': 'Premium',

    'auth.login.title': 'Dugg ci CaissePro',
    'auth.register.title': 'Sos sa compte CaissePro',
    'auth.email': 'Email',
    'auth.password': 'Baatu jàll',
    'auth.submit.login': 'Dugg',
    'auth.submit.register': 'Sos sama compte',
    'auth.beta': 'Accès beta fondateur',

    'dashboard.title': 'Tableau bi',
    'dashboard.today': 'Tey',
    'dashboard.week': 'Ayu-bés bii',
    'dashboard.alerts': 'Alertes',
    'dashboard.debts': 'Lu war a jot',
    'dashboard.modules': 'Modules yi aktif',
    'dashboard.quickAction': 'Jëf bu gaaw'
  }
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale
  const saved = window.localStorage.getItem('caissepro_locale') as Locale | null
  return saved && ['fr', 'en', 'wo'].includes(saved) ? saved : defaultLocale
}

export function setStoredLocale(locale: Locale) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('caissepro_locale', locale)
  window.dispatchEvent(new CustomEvent('localechange', { detail: locale }))
}

export function translate(locale: Locale, key: string) {
  return translations[locale]?.[key] || translations[defaultLocale][key] || key
}
