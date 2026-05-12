import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CaissePro - POS simple pour l’Afrique de l’Ouest',
  description: 'CaissePro aide les boutiques à gérer ventes, stock, employés et boutique en ligne avec une interface simple.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
