import type { Metadata, Viewport } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'
import DarkModeProvider from '@/components/DarkModeProvider'
import InstallAppPrompt from '@/components/InstallAppPrompt'
import NetworkStatusBanner from '@/components/NetworkStatusBanner'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import SupportBubble from '@/components/SupportBubble'
import SWRProvider from '@/components/SWRProvider'

export const viewport: Viewport = {
  themeColor: '#16a34a',
}

export const metadata: Metadata = {
  title: 'CaissePro',
  description: 'CaissePro by Amdy Labs — Développer le commerce en Afrique',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/caissepro-icon.svg',
    shortcut: '/icons/caissepro-icon.svg',
    apple: '/icons/caissepro-icon.svg'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CaissePro'
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/caissepro-icon.svg" />
        <link rel="apple-touch-icon" href="/icons/caissepro-icon.svg" />

        <meta name="theme-color" content="#16a34a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CaissePro" />

        {/* Apply the theme before first paint to avoid a flash. Dark is the
            default when no preference is saved; a saved choice always wins. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem('theme-preference')||'dark';var d;if(p==='light'){d=false;}else if(p==='auto'){var h=new Date().getHours();d=h>=19||h<6;}else{d=true;}if(d){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>

      <body>
        <SWRProvider>
          <DarkModeProvider />
          <NetworkStatusBanner />
          <ServiceWorkerRegister />
          {children}
          <InstallAppPrompt />
          <SupportBubble />
        </SWRProvider>
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
    </html>
  )
}
