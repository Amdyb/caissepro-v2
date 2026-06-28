import type { Metadata } from 'next'
import Nav from '@/components/landing/Nav'
import Hero from '@/components/landing/Hero'
import PaymentStrip from '@/components/landing/PaymentStrip'
import DeviceBand from '@/components/landing/DeviceBand'
import Features from '@/components/landing/Features'
import Metiers from '@/components/landing/Metiers'
import Pricing from '@/components/landing/Pricing'
import AgentProgram from '@/components/landing/AgentProgram'
import Testimonials from '@/components/landing/Testimonials'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: 'CaissePro — La caisse enregistreuse intelligente de l’Afrique',
  description:
    'Vendez, encaissez et gérez votre stock depuis votre tablette, ordinateur ou téléphone. Mobile Money à 0% de commission, reçus WhatsApp et boutique en ligne gratuite.',
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b09] font-manrope text-[#f2f5f3] antialiased">
      {/* Keep reveal content visible without JS */}
      <noscript>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <style>{`.reveal{opacity:1 !important}`}</style>
      </noscript>

      {/* Ambient background — radial emerald/purple glows */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(900px 500px at 78% -5%, rgba(22,163,74,.20), transparent 60%), radial-gradient(700px 600px at 10% 12%, rgba(22,163,74,.10), transparent 55%), radial-gradient(800px 700px at 90% 90%, rgba(139,92,246,.07), transparent 55%)',
        }}
      />
      {/* Ambient grid masked with a radial fade */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(circle at 50% 0%, #000 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 0%, #000 0%, transparent 70%)',
        }}
      />

      <div className="relative z-[2]">
        <Nav />
        <Hero />
        <PaymentStrip />
        <DeviceBand />
        <Features />
        <Metiers />
        <Pricing />
        <AgentProgram />
        <Testimonials />
        <FinalCTA />
        <Footer />
      </div>
    </main>
  )
}
