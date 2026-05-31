-- ============================================================
-- AGENT PORTAL MIGRATION
-- ============================================================

-- 1. generate invite code trigger function (defined before table usage)
CREATE OR REPLACE FUNCTION set_agent_invite_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
  v_attempts integer := 0;
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    LOOP
      v_code := 'AGT-' || upper(substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 6));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.agents WHERE invite_code = v_code);
      v_attempts := v_attempts + 1;
      IF v_attempts > 100 THEN
        RAISE EXCEPTION 'Could not generate unique invite code after 100 attempts';
      END IF;
    END LOOP;
    NEW.invite_code := v_code;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name                text        NOT NULL,
  email                    text        UNIQUE NOT NULL,
  phone                    text,
  whatsapp                 text,
  city                     text,
  country                  text        DEFAULT 'Sénégal',
  invite_code              text        UNIQUE,
  status                   text        DEFAULT 'pending',
  commission_rate          integer     DEFAULT 20,
  commission_amount        integer     DEFAULT 50000,
  total_signups            integer     DEFAULT 0,
  total_commissions_earned integer     DEFAULT 0,
  password_hash            text,
  last_login_at            timestamptz,
  created_by               uuid        REFERENCES auth.users(id),
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE TRIGGER trg_agent_invite_code
  BEFORE INSERT ON public.agents
  FOR EACH ROW EXECUTE FUNCTION set_agent_invite_code();

-- 3. agent_leads table
CREATE TABLE IF NOT EXISTS public.agent_leads (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      uuid        NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  business_id   uuid        REFERENCES public.businesses(id),
  business_name text,
  email         text,
  phone         text,
  country       text,
  status        text        DEFAULT 'registered',
  plan          text,
  amount        integer     DEFAULT 0,
  signed_up_at  timestamptz DEFAULT now(),
  paid_at       timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- 4. agent_commissions table
CREATE TABLE IF NOT EXISTS public.agent_commissions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id           uuid        NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  month              text        NOT NULL,
  signups_count      integer     DEFAULT 0,
  target_reached     boolean     DEFAULT false,
  amount             integer     DEFAULT 0,
  status             text        DEFAULT 'pending',
  paid_at            timestamptz,
  payment_method     text,
  payment_reference  text,
  created_at         timestamptz DEFAULT now(),
  UNIQUE(agent_id, month)
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_agent_leads_agent_id ON public.agent_leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_leads_business_id ON public.agent_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_agent_id ON public.agent_commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_invite_code ON public.agents(invite_code);
CREATE INDEX IF NOT EXISTS idx_agents_email ON public.agents(email);

-- 6. calculate_monthly_commission function
CREATE OR REPLACE FUNCTION calculate_monthly_commission(p_agent_id uuid, p_month text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count   integer;
  v_amount  integer;
  v_reached boolean;
BEGIN
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
$$;

-- 7. Trigger: update agent_lead when subscription is created
CREATE OR REPLACE FUNCTION update_agent_lead_on_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agent_id uuid;
BEGIN
  UPDATE public.agent_leads
  SET status  = 'paid',
      paid_at = now(),
      plan    = NEW.plan
  WHERE business_id = NEW.business_id
    AND status != 'paid'
  RETURNING agent_id INTO v_agent_id;

  IF v_agent_id IS NOT NULL THEN
    PERFORM calculate_monthly_commission(v_agent_id, to_char(now(), 'YYYY-MM'));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscription_agent_update ON public.subscriptions;
CREATE TRIGGER trg_subscription_agent_update
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_agent_lead_on_subscription();

-- 8. RLS
ALTER TABLE public.agents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_leads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;

-- Super-admin emails helper (inline subquery)
-- agents
CREATE POLICY "agents_superadmin_all" ON public.agents
  FOR ALL USING (
    (SELECT email FROM auth.users WHERE id = auth.uid())
    IN ('infos@dakarvapes.com', 'azzideejay@gmail.com')
  );

CREATE POLICY "agents_public_apply" ON public.agents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "agents_read_own" ON public.agents
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- agent_leads
CREATE POLICY "agent_leads_superadmin_all" ON public.agent_leads
  FOR ALL USING (
    (SELECT email FROM auth.users WHERE id = auth.uid())
    IN ('infos@dakarvapes.com', 'azzideejay@gmail.com')
  );

CREATE POLICY "agent_leads_insert_any" ON public.agent_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "agent_leads_own" ON public.agent_leads
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM public.agents
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- agent_commissions
CREATE POLICY "agent_commissions_superadmin_all" ON public.agent_commissions
  FOR ALL USING (
    (SELECT email FROM auth.users WHERE id = auth.uid())
    IN ('infos@dakarvapes.com', 'azzideejay@gmail.com')
  );

CREATE POLICY "agent_commissions_own" ON public.agent_commissions
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM public.agents
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
