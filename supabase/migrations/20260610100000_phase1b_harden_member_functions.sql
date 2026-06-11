-- Phase 1B: Harden the SECURITY DEFINER functions the app actively calls.
-- These are reachable by any authenticated user; without an internal authz check a
-- user from business A could mutate business B's members (cross-tenant escalation).
-- We add owner/manager guards derived from the TARGET row's business_id, set a fixed
-- search_path (also clears function_search_path_mutable), and keep signatures unchanged.

-- add member: caller must be owner/manager of the target business
CREATE OR REPLACE FUNCTION public.add_business_member_by_email(target_business_id uuid, target_email text, target_role text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
declare
  target_user_id uuid;
begin
  if auth.uid() is null or not public.is_business_owner_or_manager(target_business_id) then
    raise exception 'Not authorized';
  end if;

  select id into target_user_id
  from auth.users
  where lower(email) = lower(target_email)
  limit 1;

  if target_user_id is null then
    return 'Utilisateur introuvable. Cet employé doit créer un compte d’abord.';
  end if;

  if exists (
    select 1
    from business_members
    where business_id = target_business_id
    and user_id = target_user_id
  ) then
    return 'Cet utilisateur est déjà membre.';
  end if;

  insert into business_members (business_id, user_id, role)
  values (target_business_id, target_user_id, target_role);

  return 'Employé ajouté avec succès.';
end;
$function$;

-- update role: derive business from the member row, require owner/manager of THAT business
CREATE OR REPLACE FUNCTION public.update_business_member_role(target_member_id uuid, target_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
declare
  v_business_id uuid;
begin
  select business_id into v_business_id from business_members where id = target_member_id;
  if v_business_id is null then
    raise exception 'Member not found';
  end if;
  if auth.uid() is null or not public.is_business_owner_or_manager(v_business_id) then
    raise exception 'Not authorized';
  end if;

  update business_members set role = target_role where id = target_member_id;
end;
$function$;

-- remove member: same owner/manager guard on the target's business
CREATE OR REPLACE FUNCTION public.remove_business_member(target_member_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
declare
  v_business_id uuid;
begin
  select business_id into v_business_id from business_members where id = target_member_id;
  if v_business_id is null then
    return; -- already gone, nothing to do
  end if;
  if auth.uid() is null or not public.is_business_owner_or_manager(v_business_id) then
    raise exception 'Not authorized';
  end if;

  delete from business_members where id = target_member_id;
end;
$function$;

-- monthly commission: super admin only (also allow service_role for any future cron).
-- Body logic unchanged from original.
CREATE OR REPLACE FUNCTION public.calculate_monthly_commission(p_agent_id uuid, p_month text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  v_count   integer;
  v_amount  integer;
  v_reached boolean;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role'
     AND coalesce(auth.email(), '') NOT IN ('infos@dakarvapes.com', 'azzideejay@gmail.com') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.agent_leads
  WHERE agent_id = p_agent_id
    AND status = 'paid'
    AND to_char(paid_at, 'YYYY-MM') = p_month;

  v_reached := v_count >= 20;
  v_amount  := CASE WHEN v_reached THEN 50000 ELSE 0 END;

  INSERT INTO public.agent_commissions
    (agent_id, month, signups_count, target_reached, amount, status)
  VALUES
    (p_agent_id, p_month, v_count, v_reached, v_amount,
     CASE WHEN v_reached THEN 'pending' ELSE 'not_reached' END)
  ON CONFLICT (agent_id, month) DO UPDATE SET
    signups_count  = EXCLUDED.signups_count,
    target_reached = EXCLUDED.target_reached,
    amount         = EXCLUDED.amount,
    status = CASE
      WHEN EXCLUDED.target_reached AND agent_commissions.status = 'not_reached' THEN 'pending'
      WHEN NOT EXCLUDED.target_reached THEN 'not_reached'
      ELSE agent_commissions.status
    END;

  UPDATE public.agents
  SET total_signups = (
    SELECT COUNT(*) FROM public.agent_leads
    WHERE agent_id = p_agent_id AND status = 'paid'
  )
  WHERE id = p_agent_id;
END;
$function$;
