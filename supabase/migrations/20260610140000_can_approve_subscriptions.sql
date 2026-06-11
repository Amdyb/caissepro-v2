-- Part 6: per-member permission allowing a manager to approve subscription upgrades.
-- Owners grant it; a manager must NOT be able to self-grant it (the existing
-- bm_update_self_or_owner policy lets a member update their own row), so a BEFORE UPDATE
-- trigger restricts changes to this column to the business owner / superadmin / service role.
ALTER TABLE public.business_members
  ADD COLUMN IF NOT EXISTS can_approve_subscriptions boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.guard_bm_privileged_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
begin
  if new.can_approve_subscriptions is distinct from old.can_approve_subscriptions then
    -- allow: service role / SQL console (auth.uid() null), superadmin, or an owner of THIS business
    if auth.uid() is not null
       and coalesce(auth.email(), '') not in ('infos@dakarvapes.com', 'azzideejay@gmail.com')
       and not exists (
         select 1 from public.business_members bm
         where bm.business_id = new.business_id
           and bm.user_id = auth.uid()
           and bm.role in ('proprietaire', 'owner')
       )
    then
      raise exception 'Seul le propriétaire peut modifier la permission d''approbation';
    end if;
  end if;
  return new;
end;
$function$;

DROP TRIGGER IF EXISTS trg_guard_bm_privileged_columns ON public.business_members;
CREATE TRIGGER trg_guard_bm_privileged_columns
  BEFORE UPDATE ON public.business_members
  FOR EACH ROW EXECUTE FUNCTION public.guard_bm_privileged_columns();

-- the trigger function is only invoked by the trigger; no API role needs EXECUTE
REVOKE EXECUTE ON FUNCTION public.guard_bm_privileged_columns() FROM PUBLIC, anon, authenticated;
