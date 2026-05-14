-- Business onboarding templates for CaissePro

create table if not exists business_templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  icon text,
  default_categories jsonb default '[]'::jsonb,
  default_settings jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

insert into business_templates (slug, name, description, icon, default_categories)
values
(
  'retail',
  'Commerce & Boutique',
  'Boutique physique avec caisse et boutique en ligne.',
  'shopping-bag',
  '["Boissons","Snacks","Beauté","Électronique","Maison"]'::jsonb
),
(
  'restaurant',
  'Restaurant & Fast Food',
  'Gestion commandes, menus et caisse restaurant.',
  'utensils-crossed',
  '["Menus","Boissons","Desserts","Plats","Snacks"]'::jsonb
),
(
  'beauty',
  'Salon & Beauté',
  'Salon de coiffure, esthétique et rendez-vous.',
  'sparkles',
  '["Coiffure","Soins","Produits","Accessoires"]'::jsonb
),
(
  'tontine',
  'Tontine & Épargne',
  'Gestion de tontines et groupes d’épargne.',
  'wallet',
  '["Cotisations","Groupes","Paiements"]'::jsonb
)
on conflict (slug) do nothing;

alter table businesses
add column if not exists onboarding_completed boolean default false;

alter table businesses
add column if not exists template_slug text references business_templates(slug);

create index if not exists businesses_template_slug_idx
on businesses(template_slug);
