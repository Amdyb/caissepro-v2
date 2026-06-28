# Handoff: CaissePro Landing Page Redesign (Visual-First)

## Overview
This is a visual-first redesign of the CaissePro landing page (`app/page.tsx`). The goal: replace the text-heavy old page with a page that **shows** the product using real app screenshots placed inside device mockups (phone frames, browser frame, hardware render), floating glass UI fragments, and a premium dark aesthetic.

CaissePro is a multi-tenant POS SaaS for West African merchants (mobile money, WhatsApp receipts, free online storefront, stock, reports, AI coach, agent program).

---

## About the Design Files
The files in this bundle are **design references created in HTML** — a prototype showing the intended look, layout, and behavior. **They are NOT production code to copy directly.**

Your task: **recreate this design in the existing CaissePro codebase** — Next.js 14 + TypeScript + Tailwind CSS — using its established patterns, components, and conventions. Rebuild `app/page.tsx` (and extract sub-components as the codebase normally would) to match the reference.

- `design-reference.html` — the full visual reference. Open it in a browser to see the target. Read its inline styles for exact values, but translate everything to **Tailwind classes**, not inline styles.
- `public/` — all images. Copy these into the project's real `public/` folder (or wherever static assets live) and reference them with the clean filenames below.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and interactions. Recreate pixel-accurately using Tailwind. Where the reference uses `clamp()` for fluid sizing, use Tailwind responsive breakpoints (`text-4xl md:text-6xl`, etc.) to achieve the same effect.

---

## Tech Stack & Conventions (must follow)
- **Next.js 14 (App Router), TypeScript, Tailwind CSS**
- **Lucide React icons ONLY** — no emojis anywhere
- **French** for all UI text
- `font-black` for all headings
- `rounded-[2rem]` for cards, `rounded-2xl` for buttons
- Primary color **emerald green `#16a34a`** (Tailwind `green-600`; brighter accents use `green-500 #22c55e`)
- Premium **dark theme** (default)
- Mobile-first, fully responsive
- Footer must contain **"Propulsé par AMDY LABS"**
- Smooth scroll animations, fast loading

---

## Design Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| Background base | `#070b09` | Page background (near-black green-tinted) |
| Surface | `rgba(16,22,19,.6)` | Card backgrounds |
| Surface solid | `#0c100e` | Inner mock UI panels |
| Primary | `#16a34a` | Buttons, primary accents (green-600) |
| Primary bright | `#22c55e` | Highlights, icons, "Pro" wordmark (green-500) |
| Text primary | `#f2f5f3` | Headings/body on dark |
| Text muted | `#9fb0a8` | Secondary copy |
| Text faint | `#8a9a92` / `#6f7e77` | Labels, captions |
| Border | `rgba(255,255,255,.08)` | Card borders |
| Accent purple | `#8b5cf6` / `#a78bfa` | Agent program, stock card |
| Accent orange | `#f97316` / `#fb923c` | Online store card |
| Wave blue | `#1a8cff` | Wave payment |
| WhatsApp green | `#25D366` | WhatsApp elements |
| Star gold | `#fbbf24` | Testimonial stars |

### Typography
- **Headings:** `Sora`, weight 800 (`font-black`). Letter-spacing `-0.02em` to `-0.03em`. Use Next.js `next/font/google` to load Sora.
- **Body:** `Manrope`, weights 400–800.
- Hero H1: fluid `clamp(2.5rem, 5.4vw, 4.4rem)`, line-height 1.03 → use `text-5xl md:text-7xl`.
- Section H2: `clamp(2rem, 3.8vw, 3.1rem)` → `text-4xl md:text-5xl`.
- Body lead: `~1.1–1.25rem`, line-height 1.6, color `#9fb0a8`.

### Radius
- Cards: `rounded-[2rem]` (32px). Big feature/CTA cards up to `rounded-[2.25rem]`/`rounded-[2.5rem]`.
- Buttons: `rounded-2xl` (16px).
- Phone frame outer: `~36–42px`; inner screen `~29–34px`.

### Shadows / Effects
- Card glow buttons: `shadow-[0_14px_36px_rgba(22,163,74,.42)]`
- Floating device: `shadow-[0_40px_90px_rgba(0,0,0,.6)]`
- Glassmorphism on floating fragments: `bg-[rgba(16,22,19,.82)] backdrop-blur-md border border-white/10`
- Ambient background: fixed radial gradients (emerald top-right, faint emerald top-left, faint purple bottom-right) + a faint 64px grid masked with a radial fade.

---

## Assets (in `public/`)
| File | What it is | Used in |
|---|---|---|
| `check-out.png` | Real phone screenshot — Checkout drawer, total **157 500 CFA**, Wave selected, "Envoyer reçu WhatsApp" | **Hero** phone |
| `produit-page.png` | Real phone screenshot — "Point de Vente" product grid (vape products, stock badges) | **Features** POS card phone |
| `online-store.png` | Real screenshot — **DakarVapes** Netflix-style online storefront | **Online store** card (browser frame) |
| `logo-mark.png` | CaissePro "C" brand mark on white tile | Nav + footer logo |
| `device-family.png` | Realistic hardware render — POS terminal + payment stand + receipt printer (transparent bg) | "Tous vos appareils" band |
| `lockup-badge.png` | Clean "CaissePro" lockup (green C tile + wordmark) | Overlaid on garbled text in `device-family.png` |

> NOTE on `device-family.png`: the render's built-in screen/printer text is AI-garbled ("Caisserro"/"Caisserire"). The reference overlays `lockup-badge.png` over those two spots via absolute positioning (percent-based). Replicate those two overlays. Positions in reference: top screen `left:42.2% top:6.8% width:17.6% height:10.8%`; printer `left:76.3% top:84.2% width:13.4% height:8%` — both centered over a dark rounded rectangle. Re-tune visually if needed.

---

## Sections (in order)

### 1. Nav (sticky)
- Sticky top, `backdrop-blur`, `bg-[rgba(7,11,9,.72)]`, bottom border `white/6`.
- Left: `logo-mark.png` in a 40px white rounded-xl tile + wordmark "Caisse**Pro**" (Pro in `#22c55e`), Sora 800.
- Center links (hide on mobile): Fonctionnalités, Métiers, Tarifs, Agents → anchor links `#fonctionnalites #metiers #tarifs #agent`.
- Right: "Connexion" text link + "Commencer" button (`bg-green-600`, `rounded-2xl`... use `rounded-xl` here per reference, glow shadow).

### 2. Hero
- Two-column flex (wraps to stack on mobile). Left = copy, right = phone visual.
- **Left:** pill badge ("La caisse #1 de l'Afrique de l'Ouest" with pulsing dot) → H1 "La caisse enregistreuse **intelligente** de l'Afrique" ("intelligente" is a green gradient text) → lead paragraph mentioning **tablette, ordinateur ou téléphone**, Mobile Money 0%, reçus WhatsApp, boutique en ligne → two CTAs: "Commencer gratuitement" (green, arrow-right icon) + "Voir la démo" (ghost, play icon in circle) → 3 trust chips with check-circle-2 icons (Sans engagement, 0% de commission, Mode hors-ligne).
- **Right:** a floating phone (`check-out.png`) in a dark frame with emerald glow behind it, gently floating (CSS keyframe `translateY` ±14px, ~7s). Phone aspect ratio `986/1830`, `object-cover object-top`.
  - 3 floating glassmorphic fragment cards positioned absolutely around the phone:
    1. **Wave payment** (top-right): Wave blue tile, "Paiement reçu", "+12 500 FCFA", green check.
    2. **WhatsApp receipt** (mid-left): WhatsApp tile with message-circle, "Reçu envoyé", "sur WhatsApp · maintenant".
    3. **Sales sparkline** (bottom-right): "Ventes du jour", "+27%", "125 000 FCFA", a 7-bar mini bar chart (green gradient bars with a rise animation).
  - On mobile these fragments can be hidden or simplified to avoid overflow.

### 3. Payment partners strip
- Centered uppercase label "Encaissez par tous les moyens de paiement".
- Row of pill chips, each = colored dot + name: **Wave** `#1a8cff`, **Orange Money** `#ff7900`, **PayDunya** `#22c55e`, **Visa** `#1a1f71`, **Mastercard** `#eb001b`.

### 4. "Tous vos appareils" (Compatible partout)
- Centered: green eyebrow "Compatible partout" → H2 "Une seule app, tous vos appareils" → lead paragraph (tablette de comptoir, ordinateur, smartphone, imprimante de reçus, en ligne comme hors-ligne).
- Below: `device-family.png` (max-width ~940px, `object-contain`, drop-shadow), floating animation, emerald radial glow behind it. Overlay the two `lockup-badge.png` stamps as described in Assets note.

### 5. Features (bento grid)
Auto-fit grid, `minmax(300px, 1fr)`, gap ~18px. Cards:
- **Caisse & encaissement rapide** (spans 2 cols): emerald gradient card. Left = shopping-cart icon + heading + copy ("Recherchez vos produits, scannez les codes-barres et encaissez en quelques secondes. Alertes de stock en temps réel."). Right = `produit-page.png` in a floating dark phone frame (aspect `986/1830`, glow behind).
- **Mobile Money**: smartphone icon (blue), "Wave, Orange Money & PayDunya intégrés directement à la caisse.", big "**0%** de commission".
- **Reçus WhatsApp**: message-circle icon (WhatsApp green), copy, a mini "Reçu N°000123 · Livré · 9 300 FCFA" chip.
- **Boutique en ligne gratuite** (spans 2 cols): orange gradient card. Left = globe icon + heading + "Une vitrine en ligne façon Netflix...". Right = `online-store.png` inside a **browser frame** (macOS traffic-light dots + fake address bar `dakarvapes.caissepro.app` with lock icon; image clipped to ~340px tall, `object-top`).
- **Stock & code-barres**: boxes icon (purple), copy.
- **Coach Entrepreneur IA** (spans 2 cols): emerald→purple gradient. sparkles icon, "PREMIUM" pill badge, heading, copy ("Un conseiller commercial intelligent qui analyse vos ventes et vous dit quoi commander, quand et à quel prix.").
- **Secondary feature chips** row below the bento (auto-fit, minmax 220px): icon + label for: Scanner code-barres (`scan-barcode`), Notifications push (`bell`), Mode hors-ligne (PWA) (`wifi-off`), Multi-boutique (`building-2`), Gestion d'équipe (`users`), Support 7j/7 (`life-buoy`).

### 6. Métiers (business types)
- Eyebrow "Pour chaque métier" → H2 "Conçu pour votre activité".
- Auto-fit grid (minmax 160px) of 10 small cards, each = icon tile + label, centered:
  Boutique (`store`), Restaurant (`utensils-crossed`), Salon (`scissors`), Pharmacie (`pill`), Garage (`wrench`), BTP (`hard-hat`), Tontine (`hand-coins`), Immobilier (`building-2`), Grossiste (`warehouse`), Pressing (`shirt`).

### 7. Tarifs (pricing)
- Eyebrow "Tarifs" → H2 "Des prix simples, en FCFA" → lead ("Commencez gratuitement... 0% de frais sur vos transactions, sur tous les plans.").
- **Promo banner**: gift icon + "Offre de lancement : payez 1 mois, obtenez 2 mois".
- **Billing toggle** (stateful): segmented "Mensuel" / "Annuel -2 mois". Annual = monthly price × 10 (i.e. 2 months free). This requires `useState`.
- 4 tier cards (auto-fit minmax 250px), Business highlighted as "LE PLUS POPULAIRE" (green border + badge):
  | Plan | Monthly (FCFA) | Tagline | Key features |
  |---|---|---|---|
  | **Gratuit** | 0 (Pour toujours) | Pour démarrer | 1 boutique, Ventes illimitées, Mobile Money 0%, Boutique en ligne, Reçus WhatsApp |
  | **Starter** | 5 000 | Petits commerces | + Stock avancé, Scanner code-barres, Rapports détaillés, 2 utilisateurs |
  | **Business** ⭐ | 15 000 | Le choix des pros | + Gestion d'équipe (3 rôles), Fournisseurs & réassort, Notifications push, 5 utilisateurs |
  | **Premium** | 35 000 | Sans limites | + Coach Entrepreneur IA, Multi-boutique, Utilisateurs illimités, Support prioritaire |
  - Annual display: `price × 10` formatted with French thousands spacing, period "/an · 2 mois offerts". Monthly period "/mois".
  - CTA per card; Gratuit = "Commencer gratuitement", others = "Choisir <Plan>".

### 8. Programme Agent
- Purple gradient card. Left: "PROGRAMME AGENT" pill (handshake icon) → H2 "Gagnez en équipant les commerçants de votre quartier" → copy → "Devenir agent" button (purple). Right: stat card "Revenus potentiels — **50 000** FCFA par mois et plus".

### 9. Témoignages (PLACEHOLDER — see note)
- Eyebrow "Ils nous font confiance" → H2 "Les commerçants adoptent CaissePro".
- 3 cards, each: 5 gold stars + quote + avatar (initial in green tile) + name + role.
- **⚠ These are placeholder testimonials** (Fatou Ndiaye / Ibrahima Sow / Awa Diallo). Replace with real ones before launch, or keep as representative examples if approved.

### 10. CTA final
- Big emerald gradient card, centered: H2 "Prêt à moderniser votre commerce ?" → copy → "Commencer gratuitement" button.

### 11. Footer
- Logo + wordmark + tagline ("La caisse enregistreuse intelligente de l'Afrique...").
- Two link columns: **Produit** (Fonctionnalités, Tarifs, Métiers) and **Entreprise** (Programme Agent, Support, Contact).
- Bottom bar: "© 2026 CaissePro. Tous droits réservés." + **"Propulsé par AMDY LABS"** (AMDY LABS in `#22c55e`).

---

## Interactions & Behavior
- **Scroll reveal:** each section fades up on scroll into view. The reference uses CSS scroll-driven animation (`animation-timeline: view()`) with a one-time load fallback. In React, use a small `IntersectionObserver` hook or a library like Framer Motion (`whileInView`) — whatever the codebase already uses. Effect: opacity 0→1 + translateY 30px→0, ~0.9s ease-out.
- **Floating animations:** phone + device render gently float (CSS `@keyframes`, translateY ±10–14px, 6–8s, infinite). Glow elements pulse opacity.
- **Pricing toggle:** `useState` for `'mensuel' | 'annuel'`; recomputes displayed price and period. Active segment = green bg + white text.
- **Smooth scroll** on anchor nav links (`scroll-behavior: smooth` on html, or Tailwind `scroll-smooth`).
- **Responsive:** all multi-column sections wrap/stack on mobile. Hero floating fragments should hide or simplify under ~640px to avoid horizontal overflow.

## State Management
- Only the **pricing billing toggle** needs state (`useState`). Everything else is static/presentational. No data fetching.

## Files in this bundle
- `design-reference.html` — full visual reference (open in browser; read inline styles for exact values).
- `public/*.png` — all images (copy to the project's static assets folder).

## Recommended component breakdown
Follow the codebase's existing convention. A sensible split:
`Nav`, `Hero`, `PaymentStrip`, `DeviceBand`, `Features`, `Metiers`, `Pricing` (client component for the toggle), `AgentProgram`, `Testimonials`, `FinalCTA`, `Footer`. `app/page.tsx` composes them. Mark only `Pricing` (and any scroll-animation wrapper) as `"use client"`.
