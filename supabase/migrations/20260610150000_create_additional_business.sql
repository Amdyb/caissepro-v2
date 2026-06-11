-- Part 7: create an additional shop for an existing premium user.
-- A brand-new business has no members yet, so the client cannot insert the owner row
-- (bm_insert_owners requires is_business_owner_or_manager of that business). This SECURITY
-- DEFINER RPC creates the business + owner membership atomically, and enforces the premium
-- gate + 5-shop limit server-side so the UI gate can't be bypassed.
CREATE OR REPLACE FUNCTION public.create_additional_business(p_name text, p_type text, p_slug text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
declare
  v_uid uuid := auth.uid();
  v_owned int;
  v_has_premium boolean;
  v_business_id uuid;
begin
  if v_uid is null then
    raise exception 'Non authentifié';
  end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'Le nom de la boutique est requis';
  end if;

  select count(*) into v_owned
  from public.business_members
  where user_id = v_uid and role in ('owner', 'proprietaire');

  if v_owned >= 5 then
    raise exception 'Limite de 5 boutiques atteinte';
  end if;

  select exists (
    select 1
    from public.subscriptions s
    join public.business_members bm on bm.business_id = s.business_id
    where bm.user_id = v_uid and s.status = 'active' and s.plan = 'premium'
  ) into v_has_premium;

  if not v_has_premium then
    raise exception 'Plan Premium requis pour créer plusieurs boutiques';
  end if;

  insert into public.businesses (name, business_type, slug, currency, onboarding_completed)
  values (btrim(p_name), coalesce(nullif(btrim(p_type), ''), 'retail'), nullif(btrim(p_slug), ''), 'CFA', false)
  returning id into v_business_id;

  insert into public.business_members (business_id, user_id, role, is_active, must_change_password)
  values (v_business_id, v_uid, 'owner', true, false);

  return v_business_id;
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_additional_business(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_additional_business(text, text, text) TO authenticated;
