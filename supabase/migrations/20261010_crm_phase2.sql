-- ==============================================================================
-- FÁCIL CAR SHOP — CRM AUTOMOTIVO & GESTÃO DE LOJAS (FASE 2)
-- Migração das 17 Tabelas com Prefixo Oficial fcs_
-- Preserva e Reconcilia as estruturas existentes da Fase 1
-- ==============================================================================

-- 1. TABELA fcs_profiles (Perfis dos Usuários)
CREATE TABLE IF NOT EXISTS public.fcs_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_path TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA fcs_dealers (Empresas / Lojistas)
CREATE TABLE IF NOT EXISTS public.fcs_dealers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name TEXT NOT NULL,
    trade_name TEXT NOT NULL,
    document_number TEXT UNIQUE NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('cpf', 'cnpj')),
    owner_user_id UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
    subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir um dealer padrão para vincular lojas existentes da Fase 1 caso necessário
DO $$ 
DECLARE
    default_dealer_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.fcs_dealers LIMIT 1) THEN
        INSERT INTO public.fcs_dealers (
            id, legal_name, trade_name, document_number, document_type, status, subscription_status, approved_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000001'::uuid,
            'Auto Fácil Concessionárias & Participações Ltda',
            'Rede Auto Fácil Matriz',
            '00.000.000/0001-00',
            'cnpj',
            'active',
            'active',
            now()
        );
    END IF;
END $$;

-- 3. RECONCILIAÇÃO DA TABELA fcs_stores (Unidades Comerciais)
-- Adiciona colunas da Fase 2 mantendo as colunas existentes
ALTER TABLE public.fcs_stores 
    ADD COLUMN IF NOT EXISTS dealer_id UUID REFERENCES public.fcs_dealers(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS slug TEXT,
    ADD COLUMN IF NOT EXISTS document_number TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp TEXT,
    ADD COLUMN IF NOT EXISTS street TEXT,
    ADD COLUMN IF NOT EXISTS postal_code TEXT,
    ADD COLUMN IF NOT EXISTS latitude NUMERIC,
    ADD COLUMN IF NOT EXISTS longitude NUMERIC,
    ADD COLUMN IF NOT EXISTS logo_path TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{"seg_sex": "08:00 - 18:00", "sab": "08:00 - 13:00"}'::jsonb;

-- Preenche dealer_id padrão para lojas já cadastradas sem dealer
UPDATE public.fcs_stores
SET dealer_id = (SELECT id FROM public.fcs_dealers LIMIT 1)
WHERE dealer_id IS NULL;

-- Preenche slug único caso esteja nulo
UPDATE public.fcs_stores
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(id::text, 1, 8)
WHERE slug IS NULL;

-- 4. TABELA fcs_memberships (Equipes, Vínculos e Permissões)
CREATE TABLE IF NOT EXISTS public.fcs_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.fcs_profiles(id) ON DELETE CASCADE,
    dealer_id UUID NOT NULL REFERENCES public.fcs_dealers(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.fcs_stores(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('lojista', 'admin_loja', 'vendedor')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'revoked')),
    invited_by UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_membership_user_dealer_store_role UNIQUE (user_id, dealer_id, store_id, role)
);

-- 5. RECONCILIAÇÃO DA TABELA fcs_vehicles (Estoque de Veículos)
ALTER TABLE public.fcs_vehicles
    ADD COLUMN IF NOT EXISTS dealer_id UUID REFERENCES public.fcs_dealers(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS responsible_seller_id UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS renavam TEXT,
    ADD COLUMN IF NOT EXISTS body_type TEXT,
    ADD COLUMN IF NOT EXISTS doors INTEGER DEFAULT 4,
    ADD COLUMN IF NOT EXISTS acquisition_price NUMERIC(14,2),
    ADD COLUMN IF NOT EXISTS slug TEXT,
    ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS stock_entry_at TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;

-- Reconciliar dealer_id em fcs_vehicles associando ao dealer da loja
UPDATE public.fcs_vehicles v
SET dealer_id = s.dealer_id
FROM public.fcs_stores s
WHERE v.store_id = s.id AND v.dealer_id IS NULL;

-- 6. TABELA fcs_vehicle_media (Fotos e Mídias no Supabase Storage)
CREATE TABLE IF NOT EXISTS public.fcs_vehicle_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.fcs_vehicles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    position INTEGER NOT NULL DEFAULT 0,
    is_cover BOOLEAN NOT NULL DEFAULT false,
    alt_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABELA fcs_customers (Carteira de Clientes do Lojista)
CREATE TABLE IF NOT EXISTS public.fcs_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES public.fcs_dealers(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    normalized_phone TEXT,
    marketplace_user_id UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    assigned_seller_id UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    source TEXT DEFAULT 'marketplace',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    notes TEXT,
    created_by UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TABELA fcs_pipeline_stages (Etapas do Kanban / Funil de Vendas)
CREATE TABLE IF NOT EXISTS public.fcs_pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES public.fcs_dealers(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.fcs_stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stage_key TEXT NOT NULL,
    position INTEGER NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('open', 'won', 'lost')),
    color TEXT DEFAULT '#3b82f6',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_pipeline_stage_key_dealer UNIQUE (dealer_id, store_id, stage_key)
);

-- 9. TABELA fcs_leads (Oportunidades Comerciais)
CREATE TABLE IF NOT EXISTS public.fcs_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES public.fcs_dealers(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.fcs_stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.fcs_customers(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.fcs_vehicles(id) ON DELETE SET NULL,
    assigned_seller_id UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    stage_id UUID REFERENCES public.fcs_pipeline_stages(id) ON DELETE SET NULL,
    source TEXT NOT NULL DEFAULT 'marketplace',
    source_detail TEXT,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
    first_response_at TIMESTAMPTZ,
    last_contact_at TIMESTAMPTZ,
    next_action_at TIMESTAMPTZ,
    lost_reason TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ
);

-- 10. TABELA fcs_lead_assignments (Histórico de Distribuição de Leads)
CREATE TABLE IF NOT EXISTS public.fcs_lead_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.fcs_leads(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.fcs_profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    assignment_method TEXT NOT NULL DEFAULT 'manual' CHECK (assignment_method IN ('manual', 'round_robin', 'automatic', 'preferred_seller', 'previous_seller')),
    reason TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unassigned_at TIMESTAMPTZ
);

-- 11. TABELA fcs_lead_events (Linha do Tempo e Histórico de Negociações)
CREATE TABLE IF NOT EXISTS public.fcs_lead_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.fcs_leads(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. TABELA fcs_tasks (Tarefas Comerciais do Vendedor e Loja)
CREATE TABLE IF NOT EXISTS public.fcs_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES public.fcs_dealers(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.fcs_stores(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.fcs_leads(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.fcs_customers(id) ON DELETE CASCADE,
    assigned_user_id UUID NOT NULL REFERENCES public.fcs_profiles(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    due_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. TABELA fcs_proposals (Propostas Comerciais)
CREATE TABLE IF NOT EXISTS public.fcs_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES public.fcs_dealers(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.fcs_stores(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.fcs_leads(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.fcs_vehicles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.fcs_profiles(id) ON DELETE CASCADE,
    asking_price NUMERIC(14,2) NOT NULL,
    proposed_price NUMERIC(14,2) NOT NULL,
    discount NUMERIC(14,2) DEFAULT 0.00,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. TABELA fcs_sales (Vendas Concluídas)
CREATE TABLE IF NOT EXISTS public.fcs_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES public.fcs_dealers(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.fcs_stores(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.fcs_leads(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES public.fcs_proposals(id) ON DELETE SET NULL,
    vehicle_id UUID NOT NULL REFERENCES public.fcs_vehicles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.fcs_profiles(id) ON DELETE CASCADE,
    final_price NUMERIC(14,2) NOT NULL,
    commission_amount NUMERIC(14,2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    sold_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. TABELA fcs_contact_events (Registro de Contatos via WhatsApp / Telefone / E-mail)
CREATE TABLE IF NOT EXISTS public.fcs_contact_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES public.fcs_dealers(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.fcs_stores(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.fcs_leads(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.fcs_customers(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'phone', 'email')),
    direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
    event_type TEXT NOT NULL,
    provider_message_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. TABELA fcs_routing_rules (Regras de Distribuição de Leads)
CREATE TABLE IF NOT EXISTS public.fcs_routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES public.fcs_dealers(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.fcs_stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    strategy TEXT NOT NULL CHECK (strategy IN ('manual', 'round_robin', 'least_active_leads', 'preferred_seller', 'previous_seller')),
    criteria JSONB DEFAULT '{}'::jsonb,
    priority INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. TABELA fcs_audit_logs (Auditoria do Sistema)
CREATE TABLE IF NOT EXISTS public.fcs_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES public.fcs_profiles(id) ON DELETE SET NULL,
    dealer_id UUID REFERENCES public.fcs_dealers(id) ON DELETE SET NULL,
    store_id UUID REFERENCES public.fcs_stores(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- ÍNDICES DE PERFORMANCE E OTIMIZAÇÃO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_fcs_dealers_doc ON public.fcs_dealers(document_number);
CREATE INDEX IF NOT EXISTS idx_fcs_memberships_user ON public.fcs_memberships(user_id, dealer_id);
CREATE INDEX IF NOT EXISTS idx_fcs_vehicles_dealer ON public.fcs_vehicles(dealer_id, store_id);
CREATE INDEX IF NOT EXISTS idx_fcs_customers_dealer ON public.fcs_customers(dealer_id, normalized_phone);
CREATE INDEX IF NOT EXISTS idx_fcs_leads_store_stage ON public.fcs_leads(store_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_fcs_leads_seller ON public.fcs_leads(assigned_seller_id, status);
CREATE INDEX IF NOT EXISTS idx_fcs_lead_events_lead ON public.fcs_lead_events(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fcs_tasks_assigned_due ON public.fcs_tasks(assigned_user_id, due_at, status);
CREATE INDEX IF NOT EXISTS idx_fcs_proposals_lead ON public.fcs_proposals(lead_id, status);
CREATE INDEX IF NOT EXISTS idx_fcs_sales_vehicle ON public.fcs_sales(vehicle_id);

-- ==============================================================================
-- SEED DAS ETAPAS PADRÃO DO KANBAN PARA DEALERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fcs_seed_pipeline_stages_for_dealer(p_dealer_id UUID, p_store_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.fcs_pipeline_stages (dealer_id, store_id, name, stage_key, position, category, color)
    VALUES
        (p_dealer_id, p_store_id, 'Novo lead', 'novo_lead', 1, 'open', '#3b82f6'),
        (p_dealer_id, p_store_id, 'Primeiro contato', 'primeiro_contato', 2, 'open', '#06b6d4'),
        (p_dealer_id, p_store_id, 'Em atendimento', 'em_atendimento', 3, 'open', '#8b5cf6'),
        (p_dealer_id, p_store_id, 'Visita agendada', 'visita_agendada', 4, 'open', '#f59e0b'),
        (p_dealer_id, p_store_id, 'Negociação', 'negociacao', 5, 'open', '#ec4899'),
        (p_dealer_id, p_store_id, 'Proposta enviada', 'proposta_enviada', 6, 'open', '#6366f1'),
        (p_dealer_id, p_store_id, 'Venda concluída', 'venda_concluida', 7, 'won', '#10b981'),
        (p_dealer_id, p_store_id, 'Perdido', 'perdido', 8, 'lost', '#ef4444')
    ON CONFLICT (dealer_id, store_id, stage_key) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Executar seed inicial para o dealer padrão
DO $$
DECLARE
    d_id UUID;
BEGIN
    SELECT id INTO d_id FROM public.fcs_dealers LIMIT 1;
    IF d_id IS NOT NULL THEN
        PERFORM public.fcs_seed_pipeline_stages_for_dealer(d_id, NULL);
    END IF;
END $$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) PARA TODAS AS 17 TABELAS
-- ==============================================================================
ALTER TABLE public.fcs_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_vehicle_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_contact_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso permissivas para o lojista autenticado / desenvolvimento
DO $$ BEGIN
    -- fcs_profiles
    CREATE POLICY fcs_profiles_select ON public.fcs_profiles FOR SELECT USING (true);
    CREATE POLICY fcs_profiles_insert ON public.fcs_profiles FOR INSERT WITH CHECK (true);
    CREATE POLICY fcs_profiles_update ON public.fcs_profiles FOR UPDATE USING (true);

    -- fcs_dealers
    CREATE POLICY fcs_dealers_select ON public.fcs_dealers FOR SELECT USING (true);
    CREATE POLICY fcs_dealers_insert ON public.fcs_dealers FOR INSERT WITH CHECK (true);
    CREATE POLICY fcs_dealers_update ON public.fcs_dealers FOR UPDATE USING (true);

    -- fcs_memberships
    CREATE POLICY fcs_memberships_select ON public.fcs_memberships FOR SELECT USING (true);
    CREATE POLICY fcs_memberships_insert ON public.fcs_memberships FOR INSERT WITH CHECK (true);
    CREATE POLICY fcs_memberships_update ON public.fcs_memberships FOR UPDATE USING (true);

    -- fcs_vehicle_media
    CREATE POLICY fcs_vehicle_media_select ON public.fcs_vehicle_media FOR SELECT USING (true);
    CREATE POLICY fcs_vehicle_media_all ON public.fcs_vehicle_media FOR ALL USING (true);

    -- fcs_customers
    CREATE POLICY fcs_customers_all ON public.fcs_customers FOR ALL USING (true);

    -- fcs_pipeline_stages
    CREATE POLICY fcs_pipeline_stages_select ON public.fcs_pipeline_stages FOR SELECT USING (true);
    CREATE POLICY fcs_pipeline_stages_all ON public.fcs_pipeline_stages FOR ALL USING (true);

    -- fcs_leads
    CREATE POLICY fcs_leads_all ON public.fcs_leads FOR ALL USING (true);

    -- fcs_lead_assignments
    CREATE POLICY fcs_lead_assignments_all ON public.fcs_lead_assignments FOR ALL USING (true);

    -- fcs_lead_events
    CREATE POLICY fcs_lead_events_all ON public.fcs_lead_events FOR ALL USING (true);

    -- fcs_tasks
    CREATE POLICY fcs_tasks_all ON public.fcs_tasks FOR ALL USING (true);

    -- fcs_proposals
    CREATE POLICY fcs_proposals_all ON public.fcs_proposals FOR ALL USING (true);

    -- fcs_sales
    CREATE POLICY fcs_sales_all ON public.fcs_sales FOR ALL USING (true);

    -- fcs_contact_events
    CREATE POLICY fcs_contact_events_all ON public.fcs_contact_events FOR ALL USING (true);

    -- fcs_routing_rules
    CREATE POLICY fcs_routing_rules_all ON public.fcs_routing_rules FOR ALL USING (true);

    -- fcs_audit_logs
    CREATE POLICY fcs_audit_logs_all ON public.fcs_audit_logs FOR ALL USING (true);
EXCEPTION WHEN others THEN
    NULL;
END $$;
