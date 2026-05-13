import type { Metadata } from 'next'
import './globals.css'
import InstallAppPrompt from '@/components/InstallAppPrompt'

export const metadata: Metadata = {
  title: 'CaissePro',
  description: 'POS, inventory and business management for African businesses',
  manifest: '/manifest.json',
  themeColor: '#16a34a',
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
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta
          name="apple-mobile-web-app-title"
          content="CaissePro"
        />
      </head>

      <body>
        {children}

        <InstallAppPrompt />
      </body>
    </html>
  )
}
