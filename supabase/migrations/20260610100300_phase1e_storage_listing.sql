-- Phase 1E: drop the broad SELECT (listing) policies on public storage buckets.
-- The buckets product-images and business-assets are public=true, so getPublicUrl() serves
-- objects without a SELECT policy. The app only ever calls upload() and getPublicUrl()
-- (verified: no .list() calls anywhere), so removing these only stops anonymous directory
-- listing/enumeration of every file in the bucket.
DROP POLICY IF EXISTS "Public product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view business assets" ON storage.objects;
