const fs = require('fs');
const path = require('path');

const draftPath = path.resolve(__dirname, '../supabase/migrations/20261011_admin_rls_draft.sql');
let draftContent = fs.readFileSync(draftPath, 'utf8');

// Adições aprovadas pelo usuário:
const additionalSql = `

-- ------------------------------------------------------------------------------
-- 9) AJUSTES APROVADOS (HANDOFF GEMINI)
-- ------------------------------------------------------------------------------

-- 9.1) seller_id anulável em propostas para permitir propostas vindas da vitrine pública
ALTER TABLE public.fcs_proposals ALTER COLUMN seller_id DROP NOT NULL;

-- 9.2) Função segura de cadastro público de loja/revenda pela vitrine
CREATE OR REPLACE FUNCTION public.fcs_public_register_store(
  p_contact_name TEXT,
  p_store_name TEXT,
  p_phone TEXT,
  p_city TEXT DEFAULT 'São Paulo'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dealer_id UUID;
  v_store_id UUID;
  v_slug TEXT;
BEGIN
  v_dealer_id := gen_random_uuid();
  v_store_id := gen_random_uuid();
  v_slug := lower(regexp_replace(p_store_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || right(gen_random_uuid()::text, 4);

  INSERT INTO public.fcs_dealers (
    id, legal_name, trade_name, document_number, document_type, phone, status, subscription_status
  ) VALUES (
    v_dealer_id, p_store_name, p_store_name, 'PENDING-' || right(v_dealer_id::text, 8), 'cnpj', p_phone, 'pending', 'trial'
  );

  INSERT INTO public.fcs_stores (
    id, dealer_id, name, slug, phone, city, state, status
  ) VALUES (
    v_store_id, v_dealer_id, p_store_name, v_slug, p_phone, COALESCE(p_city, 'Não informada'), 'SP', 'pending_approval'
  );

  RETURN jsonb_build_object(
    'success', true,
    'dealer_id', v_dealer_id,
    'store_id', v_store_id,
    'message', 'Cadastro realizado com sucesso! Aguarde a aprovação da nossa equipe.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fcs_public_register_store TO anon, authenticated;

-- 9.3) Planos comerciais oficiais da vitrine
INSERT INTO public.fcs_plans (id, name, slug, price_monthly, vehicle_limit, store_limit, seller_limit, description, features, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Básico', 'basico', 29.00, 10, 1, 1, 'Plano ideal para pequenas revendas e autônomos', '{"whatsapp": true, "destaque": false, "relatorios": false}'::jsonb, true),
  ('22222222-2222-2222-2222-222222222222', 'Pro', 'pro', 149.00, 50, 2, 5, 'Para revendas em crescimento com destaque e CRM', '{"whatsapp": true, "destaque": true, "relatorios": true}'::jsonb, true),
  ('33333333-3333-3333-3333-333333333333', 'Premium', 'premium', 299.00, 9999, 10, 20, 'Para grandes concessionárias com estoque ilimitado', '{"whatsapp": true, "destaque": true, "relatorios": true, "ilimitado": true}'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  price_monthly = EXCLUDED.price_monthly,
  vehicle_limit = EXCLUDED.vehicle_limit,
  store_limit = EXCLUDED.store_limit,
  seller_limit = EXCLUDED.seller_limit,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

`;

// Inserir antes do COMMIT;
let finalContent = draftContent.replace('COMMIT;', additionalSql + '\nCOMMIT;');

const finalPath = path.resolve(__dirname, '../supabase/migrations/20261011_admin_rls_final.sql');
fs.writeFileSync(finalPath, finalContent, 'utf8');
console.log('Final migration written to 20261011_admin_rls_final.sql');
