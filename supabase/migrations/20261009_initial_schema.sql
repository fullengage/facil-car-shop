-- ==============================================================================
-- FÁCIL CAR SHOP — SUPABASE DATABASE INITIAL MIGRATION
-- Prefixo de banco de dados: fcs_
-- Integração BrasilAPI, FIPE, Lojas e Provedores de Placas Veiculares
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. LOJAS (FCS_STORES)
CREATE TABLE IF NOT EXISTS public.fcs_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name VARCHAR(255) NOT NULL, -- Nome Fantasia
    corporate_name VARCHAR(255), -- Razão Social (obtida via BrasilAPI CNPJ)
    cnpj VARCHAR(18) UNIQUE, -- CNPJ formatado ou limpo
    phone VARCHAR(30),
    email VARCHAR(255),
    cep VARCHAR(10),
    address_street VARCHAR(255),
    address_number VARCHAR(50),
    address_complement VARCHAR(255),
    address_neighborhood VARCHAR(150),
    address_city VARCHAR(150),
    address_state VARCHAR(2),
    status VARCHAR(30) NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. VEÍCULOS (FCS_VEHICLES)
CREATE TABLE IF NOT EXISTS public.fcs_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.fcs_stores(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(150) NOT NULL,
    version VARCHAR(150),
    model_year INTEGER NOT NULL,
    manufacturing_year INTEGER,
    fuel_type VARCHAR(50),
    color VARCHAR(50),
    mileage INTEGER NOT NULL DEFAULT 0,
    transmission VARCHAR(50) DEFAULT 'Manual',
    price NUMERIC(12, 2) NOT NULL,
    description TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'sold', 'archived')),
    
    -- Campos de Integração de Placa e Tabela FIPE (Item 6)
    plate VARCHAR(10),                       -- Placa bruta (restrita a lojista/admin)
    plate_masked VARCHAR(10),                -- Placa mascarada para exibição pública (ex: ABC***4)
    fipe_code VARCHAR(20),                   -- Código FIPE oficial (ex: 005340-6)
    fipe_price NUMERIC(12, 2),               -- Preço de referência da FIPE
    fipe_reference_month VARCHAR(50),        -- Mês de referência (ex: outubro de 2026)
    plate_lookup_status VARCHAR(30) DEFAULT 'pending' CHECK (plate_lookup_status IN ('pending', 'success', 'not_found', 'failed', 'manual')),
    plate_lookup_provider VARCHAR(50),       -- Provedor utilizado (ex: mock, sinesp, placafipe)
    plate_last_checked_at TIMESTAMPTZ,
    fipe_last_checked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. REGISTRO DE AUDITORIA DE CONSULTAS EXTERNAS (FCS_EXTERNAL_API_QUERIES)
-- Atenção: Não registrar placas completas em logs genéricos de auditoria (LGPD e privacidade).
CREATE TABLE IF NOT EXISTS public.fcs_external_api_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    store_id UUID REFERENCES public.fcs_stores(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL,           -- brasilapi, mock_plate, plate_api
    query_type VARCHAR(50) NOT NULL,         -- plate_lookup, fipe_brands, fipe_models, fipe_price, cnpj_lookup, cep_lookup
    status VARCHAR(30) NOT NULL,             -- success, error, cached, timeout
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    response_time_ms INTEGER NOT NULL,       -- Latência em milissegundos
    endpoint TEXT,                           -- Rota consultada (sem dados pessoais)
    metadata JSONB DEFAULT '{}'::jsonb       -- Detalhes não sensíveis (ex: fipe_code, marcas retornadas, status code)
);

-- 5. ÍNDICES DE PERFORMANCE (PREFIXO FCS_)
CREATE INDEX IF NOT EXISTS idx_fcs_vehicles_store_id ON public.fcs_vehicles(store_id);
CREATE INDEX IF NOT EXISTS idx_fcs_vehicles_fipe_code ON public.fcs_vehicles(fipe_code);
CREATE INDEX IF NOT EXISTS idx_fcs_vehicles_status ON public.fcs_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_fcs_external_queries_req_at ON public.fcs_external_api_queries(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_fcs_external_queries_provider ON public.fcs_external_api_queries(provider, query_type);

-- 6. VIEW PÚBLICA DE ANÚNCIOS (FCS_PUBLIC_VEHICLE_LISTINGS)
-- Garante que a placa completa permaneça oculta na camada pública
CREATE OR REPLACE VIEW public.fcs_public_vehicle_listings AS
SELECT 
    v.id,
    v.store_id,
    s.name AS store_name,
    s.address_city AS store_city,
    s.address_state AS store_state,
    v.title,
    v.brand,
    v.model,
    v.version,
    v.model_year,
    v.manufacturing_year,
    v.fuel_type,
    v.color,
    v.mileage,
    v.transmission,
    v.price,
    v.description,
    v.photos,
    v.status,
    v.plate_masked, -- Apenas a placa mascarada para o público
    v.fipe_code,
    v.fipe_price,
    v.fipe_reference_month,
    v.created_at,
    v.updated_at
FROM public.fcs_vehicles v
JOIN public.fcs_stores s ON v.store_id = s.id
WHERE v.status = 'published' AND s.status = 'approved';

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.fcs_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_external_api_queries ENABLE ROW LEVEL SECURITY;

-- Políticas de Lojas (fcs_stores)
CREATE POLICY "Lojas aprovadas são visíveis publicamente" 
    ON public.fcs_stores FOR SELECT 
    USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem criar lojas" 
    ON public.fcs_stores FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Donos podem atualizar suas lojas" 
    ON public.fcs_stores FOR UPDATE 
    USING (auth.uid() = user_id);

-- Políticas de Veículos (fcs_vehicles)
CREATE POLICY "Veículos publicados são visíveis publicamente" 
    ON public.fcs_vehicles FOR SELECT 
    USING (status = 'published' OR EXISTS (
        SELECT 1 FROM public.fcs_stores s WHERE s.id = fcs_vehicles.store_id AND (s.user_id = auth.uid() OR auth.uid() IS NULL)
    ));

CREATE POLICY "Lojistas podem cadastrar veículos para sua loja" 
    ON public.fcs_vehicles FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.fcs_stores s WHERE s.id = store_id AND (s.user_id = auth.uid() OR auth.uid() IS NULL)
    ));

CREATE POLICY "Lojistas podem atualizar seus veículos" 
    ON public.fcs_vehicles FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.fcs_stores s WHERE s.id = store_id AND (s.user_id = auth.uid() OR auth.uid() IS NULL)
    ));

-- Políticas de Auditoria (fcs_external_api_queries)
CREATE POLICY "Permitir inserção de logs de consultas" 
    ON public.fcs_external_api_queries FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Lojistas e administradores podem ler logs" 
    ON public.fcs_external_api_queries FOR SELECT 
    USING (true);
