# CaissePro Storefront Rebuild

## Goal
Rebuild storefront layer cleanly with one source of truth.

## Source of truth
- businesses table
- products table

## Storefront fields
Businesses table must use:
- id
- name
- slug
- logo_url
- banner_url
- slogan
- primary_color
- whatsapp_number
- phone
- address

## Product visibility rules
Only show:
- business_id matches
- is_active = true
- archived != true
- deleted_at IS NULL

## Storefront routes
- /storefront
- /shop/[slug]

## Remove
- stale local persistence
- fallback branding logic
- generic cache state
- duplicated storefront state

## Storefront save flow
1. Upload image
2. Save URL directly into businesses table
3. Refresh storefront data
4. Render fresh business row

## New storefront architecture
- server-driven storefront
- direct database rendering
- minimal local state
- no duplicated business cache

## Critical merchant features
- vanity branding
- WhatsApp ordering
- share shop
- product categories
- mobile-first design
- fast loading

## Rebuild priority
1. businesses schema validation
2. storefront settings save flow
3. storefront public rendering
4. product synchronization
5. cache cleanup
6. share links
7. storefront SEO metadata
