-- ==============================================================================
-- FÁCIL CAR SHOP — CRM FASE 2: PLANOS, ASSINATURAS E ÁREA DO COMPRADOR
-- ==============================================================================

-- 1. TABELA fcs_plans (Planos e Assinaturas Comerciais)
CREATE TABLE IF NOT EXISTS public.fcs_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_monthly NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    vehicle_limit INTEGER NOT NULL DEFAULT 30,
    store_limit INTEGER NOT NULL DEFAULT 1,
    seller_limit INTEGER NOT NULL DEFAULT 3,
    features JSONB DEFAULT '["Cadastro inteligente por placa", "Tabela FIPE integrada", "CRM Kanban", "Suporte WhatsApp"]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed de Planos Padrão
INSERT INTO public.fcs_plans (id, name, slug, description, price_monthly, vehicle_limit, store_limit, seller_limit)
VALUES 
    ('11111111-1111-1111-1111-111111111111'::uuid, 'Plano Start', 'start', 'Para lojistas iniciantes e estoques enxutos', 290.00, 25, 1, 2),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'Plano Pro Cockpit', 'pro', 'Para lojas dinâmicas com alto giro de estoque', 590.00, 70, 2, 6),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'Rede Concessionária Elite', 'elite', 'Para grupos automotivos e múltiplas unidades', 1290.00, 250, 10, 25)
ON CONFLICT (slug) DO NOTHING;

-- 2. TABELA fcs_subscriptions (Assinaturas Ativas dos Lojistas)
CREATE TABLE IF NOT EXISTS public.fcs_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES public.fcs_dealers(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.fcs_plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'trial')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 days',
    payment_method TEXT DEFAULT 'pix',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vincular assinatura para o dealer padrão se existir
DO $$
DECLARE
    d_id UUID;
    p_id UUID;
BEGIN
    SELECT id INTO d_id FROM public.fcs_dealers LIMIT 1;
    SELECT id INTO p_id FROM public.fcs_plans WHERE slug = 'pro' LIMIT 1;
    IF d_id IS NOT NULL AND p_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.fcs_subscriptions WHERE dealer_id = d_id) THEN
            INSERT INTO public.fcs_subscriptions (dealer_id, plan_id, status)
            VALUES (d_id, p_id, 'active');
        END IF;
    END IF;
END $$;

-- 3. TABELA fcs_buyer_favorites (Veículos Favoritados pelos Compradores)
CREATE TABLE IF NOT EXISTS public.fcs_buyer_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES public.fcs_vehicles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_buyer_favorite UNIQUE (user_id, vehicle_id)
);

-- 4. TABELA fcs_buyer_searches (Alertas e Buscas Salvas de Compradores)
CREATE TABLE IF NOT EXISTS public.fcs_buyer_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    receive_alerts BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.fcs_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_buyer_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_buyer_searches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY fcs_plans_all ON public.fcs_plans FOR ALL USING (true);
    CREATE POLICY fcs_subscriptions_all ON public.fcs_subscriptions FOR ALL USING (true);
    CREATE POLICY fcs_buyer_favorites_all ON public.fcs_buyer_favorites FOR ALL USING (true);
    CREATE POLICY fcs_buyer_searches_all ON public.fcs_buyer_searches FOR ALL USING (true);
EXCEPTION WHEN others THEN
    NULL;
END $$;
