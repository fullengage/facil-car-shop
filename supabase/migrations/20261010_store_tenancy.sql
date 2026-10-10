-- ==============================================================================
-- FÁCIL CAR SHOP — VITRINE POR LOJA (SLUG + DOMÍNIO PRÓPRIO)
-- Cada loja tem uma vitrine em /loja/<slug> e, opcionalmente, o próprio domínio.
-- ==============================================================================

ALTER TABLE public.fcs_stores
    ADD COLUMN IF NOT EXISTS slug VARCHAR(60) UNIQUE,
    ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(253) UNIQUE,
    -- Só o administrador marca como true, depois de conferir o CNAME apontando para a plataforma.
    -- Enquanto for false, o domínio não é usado para rotear visitantes.
    ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_fcs_stores_custom_domain ON public.fcs_stores(custom_domain) WHERE domain_verified;
