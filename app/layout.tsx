import type { Metadata, Viewport } from 'next'
import './globals.css'
import DarkModeProvider from '@/components/DarkModeProvider'
import InstallAppPrompt from '@/components/InstallAppPrompt'
import NetworkStatusBanner from '@/components/NetworkStatusBanner'

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
      </head>

      <body>
        <DarkModeProvider />
        <NetworkStatusBanner />
        {children}
        <InstallAppPrompt />
      </body>
    </html>
  )
}
