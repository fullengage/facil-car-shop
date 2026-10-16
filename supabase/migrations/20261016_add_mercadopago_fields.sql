-- ==============================================================================
-- Adição de campos Mercado Pago para Subscriptions
-- Data: 2026-10-16
-- ==============================================================================

-- 1. Tabela de mapeamento: fcs_plans → Mercado Pago plans
CREATE TABLE IF NOT EXISTS public.fcs_mercadopago_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fcs_plan_id UUID NOT NULL UNIQUE REFERENCES public.fcs_plans(id) ON DELETE CASCADE,
  mercadopago_plan_id TEXT NOT NULL UNIQUE, -- ID retornado pelo MP
  mercadopago_status TEXT DEFAULT 'active' CHECK (mercadopago_status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fcs_mercadopago_plans_fcs_plan_id
  ON public.fcs_mercadopago_plans(fcs_plan_id);
CREATE INDEX IF NOT EXISTS idx_fcs_mercadopago_plans_mp_plan_id
  ON public.fcs_mercadopago_plans(mercadopago_plan_id);

-- 2. Adicionar coluna de subscription_id ao Mercado Pago na tabela fcs_subscriptions
ALTER TABLE public.fcs_subscriptions
ADD COLUMN IF NOT EXISTS mercadopago_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'mercado_pago';

CREATE INDEX IF NOT EXISTS idx_fcs_subscriptions_mp_id
  ON public.fcs_subscriptions(mercadopago_subscription_id);

-- 3. Estender fcs_subscriptions para rastrear próximo pagamento
ALTER TABLE public.fcs_subscriptions
ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_charge_id TEXT;

-- 4. Tabela de histórico de cobranças (opcional, mas recomendado para auditoria)
CREATE TABLE IF NOT EXISTS public.fcs_subscription_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.fcs_subscriptions(id) ON DELETE CASCADE,
  mercadopago_charge_id TEXT UNIQUE,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL, -- 'approved', 'rejected', 'pending'
  charge_date TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fcs_subscription_charges_subscription_id
  ON public.fcs_subscription_charges(subscription_id);
CREATE INDEX IF NOT EXISTS idx_fcs_subscription_charges_mp_id
  ON public.fcs_subscription_charges(mercadopago_charge_id);
CREATE INDEX IF NOT EXISTS idx_fcs_subscription_charges_status
  ON public.fcs_subscription_charges(status);

-- 5. RLS para fcs_mercadopago_plans (leitura pública, escrita apenas admin)
ALTER TABLE public.fcs_mercadopago_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY fcs_mercadopago_plans_public_read ON public.fcs_mercadopago_plans
  FOR SELECT USING (true);

CREATE POLICY fcs_mercadopago_plans_admin_write ON public.fcs_mercadopago_plans
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.fcs_profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  ));

-- 6. RLS para fcs_subscription_charges
ALTER TABLE public.fcs_subscription_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY fcs_subscription_charges_dealer_read ON public.fcs_subscription_charges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.fcs_subscriptions sub
      WHERE sub.id = fcs_subscription_charges.subscription_id
        AND sub.dealer_id = (
          SELECT dealer_id FROM public.fcs_memberships m
          WHERE m.user_id = auth.uid() LIMIT 1
        )
    )
  );

-- 7. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_fcs_mercadopago_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fcs_mercadopago_plans_updated_at_trigger
  ON public.fcs_mercadopago_plans;

CREATE TRIGGER fcs_mercadopago_plans_updated_at_trigger
  BEFORE UPDATE ON public.fcs_mercadopago_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fcs_mercadopago_plans_updated_at();

-- 8. Seed: Atualizar fcs_subscriptions existentes com valores padrão
UPDATE public.fcs_subscriptions
SET payment_method = 'mercado_pago'
WHERE payment_method IS NULL;

-- Log da migração
INSERT INTO public.fcs_audit_logs (actor_user_id, entity_type, entity_id, action, new_values)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'richard.fullweb@gmail.com' LIMIT 1),
  'migration',
  'mercadopago_setup',
  'executed',
  jsonb_build_object(
    'timestamp', now(),
    'tables_created', ARRAY['fcs_mercadopago_plans', 'fcs_subscription_charges'],
    'columns_added', ARRAY['mercadopago_subscription_id', 'payment_method', 'next_payment_date', 'last_payment_date', 'last_charge_id']
  )
);
