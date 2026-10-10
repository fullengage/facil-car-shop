-- ==============================================================================
-- RASCUNHO REVISADO — NÃO APLICADO. Testar em staging antes de rodar no banco.
-- Substitui o rascunho anterior deste arquivo (que nunca foi aplicado).
--
-- HIERARQUIA (fcs_memberships.role + escopo obrigatório):
--   lojista            dealer_id preenchido, store_id NULL          (guarda-chuva, paga)
--   admin_loja         dealer_id + store_id (UMA loja)              (gerencia vendedores da loja)
--   vendedor           dealer_id + store_id                         (trabalha para a loja)
--   vendedor_autonomo  dealer_id NULL, store_id NULL                (pessoa física, só o próprio dado)
--   super_admin        fcs_profiles.role = 'super_admin'            (plataforma)
--
-- Regra de acesso: todo acesso passa pelas funções fcs_is_* (SECURITY DEFINER, search_path fixo),
-- que leem memberships/lojas/revendas sem RLS. Isso evita recursão entre políticas.
--
-- DECISÕES DO DONO DO PRODUTO JÁ INCORPORADAS:
--  * Status da revenda: 'pending' (não 'pending_review').
--  * Vendedor autônomo: auto-cadastro com status 'active', exige CPF válido em fcs_profiles.cpf.
--    O CPF nunca é legível por anon/authenticated (ver seção 1); só o service role lê.
--  * Cadastro de loja pela vitrine: só e-mail. Função fcs_public_register_store cria conta,
--    revenda pendente, loja pendente e vínculo lojista. Anon perde INSERT direto em revenda/loja.
--  * Limites do plano (veículos, lojas, vendedores) aplicados por trigger BEFORE INSERT.
--  * PENDENTE (não decidido): vendedor com mais de uma loja (TODO na seção 7.3).
--    PENDENTE: lojistas da mesma revenda não se veem (mantido assim).
--
-- VERIFICAÇÃO ANTES DE APLICAR (rodar à mão; não faz parte da migração):
--   SELECT role, count(*) FROM public.fcs_profiles GROUP BY role;
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--     WHERE conrelid = 'public.fcs_memberships'::regclass AND contype = 'c';
--   SELECT count(*) FROM public.fcs_vehicles WHERE dealer_id IS NULL;
--
-- ATENÇÃO — FLUXO PÚBLICO (vitrine). O front precisa de ajuste ANTES de aplicar:
--  1. PropostaForm.tsx e AnuncieForm.tsx fazem .insert(...).select().single(). O RETURNING exige
--     SELECT sobre a linha inserida, e anon não tem SELECT em clientes/leads. Ajuste: gerar o id no
--     cliente (crypto.randomUUID()) e inserir sem .select().
--  2. AnuncieForm.tsx deve chamar rpc('fcs_public_register_store', ...) em vez de inserir direto
--     em fcs_dealers/fcs_stores (usa colunas inexistentes: company_name, city, state; e status
--     'pending_review' que o CHECK não aceita). Anon não tem mais INSERT direto nessas tabelas.
--  3. PropostaForm.tsx: a proposta anon não envia seller_id (agora anulável); o front não pode
--     mandar IDs fixos de vendedor. Proposta anon exige status 'sent', lead da mesma loja e veículo
--     publicado da mesma loja (checados por helpers SECURITY DEFINER).
--     Anon não tem INSERT em fcs_lead_events nem SELECT em fcs_pipeline_stages: o front ignora
--     esses erros (stage_id fica null e o evento não é gravado).
--  4. Veículos publicados: o SELECT para anon libera a LINHA inteira de fcs_vehicles, incluindo
--     plate e renavam. RLS não filtra colunas. O público deve usar fcs_public_vehicle_listings
--     (view). Revogar SELECT da tabela para anon exige antes checar todos os select('*') do front.
--     NÃO feito aqui.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1) PAPEL DO USUÁRIO E CPF (fcs_profiles)
-- ------------------------------------------------------------------------------
ALTER TABLE public.fcs_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'super_admin'));

-- Guarda: se a coluna já existia com outros valores, o CHECK acima não foi criado. Aborta.
DO $$
DECLARE n INTEGER;
BEGIN
  SELECT count(*) INTO n FROM public.fcs_profiles WHERE role NOT IN ('user', 'super_admin');
  IF n > 0 THEN
    RAISE EXCEPTION 'fcs_profiles.role tem % valor(es) fora de (user, super_admin). Corrigir antes de aplicar.', n;
  END IF;
END $$;

-- Validação de CPF (dígitos verificadores). Recebe só os 11 dígitos.
CREATE OR REPLACE FUNCTION public.fcs_is_valid_cpf(p_cpf TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  i INTEGER;
  s INTEGER := 0;
  d1 INTEGER;
  d2 INTEGER;
BEGIN
  IF p_cpf IS NULL OR p_cpf !~ '^[0-9]{11}$' OR p_cpf ~ '^([0-9])\1{10}$' THEN
    RETURN false;
  END IF;
  FOR i IN 1..9 LOOP
    s := s + substr(p_cpf, i, 1)::INTEGER * (11 - i);
  END LOOP;
  d1 := (s * 10) % 11;
  IF d1 = 10 THEN d1 := 0; END IF;
  IF d1 <> substr(p_cpf, 10, 1)::INTEGER THEN RETURN false; END IF;

  s := 0;
  FOR i IN 1..10 LOOP
    s := s + substr(p_cpf, i, 1)::INTEGER * (12 - i);
  END LOOP;
  d2 := (s * 10) % 11;
  IF d2 = 10 THEN d2 := 0; END IF;
  RETURN d2 = substr(p_cpf, 11, 1)::INTEGER;
END;
$$;

ALTER TABLE public.fcs_profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.fcs_profiles DROP CONSTRAINT IF EXISTS fcs_profiles_cpf_check;
ALTER TABLE public.fcs_profiles
  ADD CONSTRAINT fcs_profiles_cpf_check CHECK (cpf IS NULL OR public.fcs_is_valid_cpf(cpf));
CREATE UNIQUE INDEX IF NOT EXISTS uq_fcs_profiles_cpf ON public.fcs_profiles (cpf) WHERE cpf IS NOT NULL;

-- CPF fora de qualquer leitura de cliente: anon não lê a tabela; authenticated lê só as colunas
-- abaixo (sem cpf). Não usar select('*') em fcs_profiles no front. Service role continua lendo tudo.
REVOKE SELECT ON public.fcs_profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, phone, avatar_path, status, role, created_at, updated_at)
  ON public.fcs_profiles TO authenticated;

-- ------------------------------------------------------------------------------
-- 2) MEMBERSHIPS: papéis, escopo e unicidade
-- ------------------------------------------------------------------------------
-- 2a) Remove qualquer CHECK que mencione role (o nome auto-gerado pode variar no banco real).
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.fcs_memberships'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.fcs_memberships DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

-- 2b) vendedor_autonomo não tem revenda: dealer_id passa a aceitar NULL.
ALTER TABLE public.fcs_memberships ALTER COLUMN dealer_id DROP NOT NULL;

ALTER TABLE public.fcs_memberships
  ADD CONSTRAINT fcs_memberships_role_check
  CHECK (role IN ('lojista', 'admin_loja', 'vendedor', 'vendedor_autonomo'));

-- 2c) Escopo por papel. NOT VALID: não derruba a migração por linhas legadas, mas já vale
--     para todo INSERT/UPDATE novo. Ver o aviso abaixo e rodar VALIDATE depois de corrigir os dados.
ALTER TABLE public.fcs_memberships
  ADD CONSTRAINT fcs_memberships_scope_check
  CHECK (
       (role = 'lojista'            AND dealer_id IS NOT NULL AND store_id IS NULL)
    OR (role IN ('admin_loja', 'vendedor') AND dealer_id IS NOT NULL AND store_id IS NOT NULL)
    OR (role = 'vendedor_autonomo'  AND dealer_id IS NULL AND store_id IS NULL)
  ) NOT VALID;

DO $$
DECLARE n INTEGER;
BEGIN
  SELECT count(*) INTO n
  FROM public.fcs_memberships m
  WHERE NOT (
       (m.role = 'lojista'            AND m.dealer_id IS NOT NULL AND m.store_id IS NULL)
    OR (m.role IN ('admin_loja', 'vendedor') AND m.dealer_id IS NOT NULL AND m.store_id IS NOT NULL)
    OR (m.role = 'vendedor_autonomo'  AND m.dealer_id IS NULL AND m.store_id IS NULL)
  );
  IF n > 0 THEN
    RAISE NOTICE 'fcs_memberships: % linha(s) fora do escopo. Corrigir e rodar: ALTER TABLE public.fcs_memberships VALIDATE CONSTRAINT fcs_memberships_scope_check;', n;
  END IF;
END $$;

-- 2c-bis) Proposta da vitrine nasce sem vendedor: seller_id passa a aceitar NULL.
--     Propostas já existentes continuam com vendedor. Políticas de vendedor exigem seller_id = auth.uid().
ALTER TABLE public.fcs_proposals ALTER COLUMN seller_id DROP NOT NULL;

-- 2d) UNIQUE parcial. A UNIQUE antiga (user, dealer, store, role) não barra duplicata quando
--     store_id é NULL (NULL é diferente de NULL), então criamos índices parciais.
--     A UNIQUE antiga continua valendo para admin_loja/vendedor.
CREATE UNIQUE INDEX IF NOT EXISTS uq_fcs_memberships_lojista
  ON public.fcs_memberships (user_id, dealer_id)
  WHERE role = 'lojista' AND status <> 'revoked';

CREATE UNIQUE INDEX IF NOT EXISTS uq_fcs_memberships_admin_loja
  ON public.fcs_memberships (user_id)
  WHERE role = 'admin_loja' AND status <> 'revoked';

CREATE UNIQUE INDEX IF NOT EXISTS uq_fcs_memberships_autonomo
  ON public.fcs_memberships (user_id)
  WHERE role = 'vendedor_autonomo' AND status <> 'revoked';

-- ------------------------------------------------------------------------------
-- 3) FUNÇÕES AUXILIARES (ordem importa: cada uma usa as anteriores)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fcs_is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fcs_profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  );
$$;

-- Revenda dona da loja (usada também por anon nos inserts da vitrine).
CREATE OR REPLACE FUNCTION public.fcs_store_dealer_id(p_store UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT s.dealer_id FROM public.fcs_stores s WHERE s.id = p_store;
$$;

-- Loja de um lead (usado pelo INSERT anon de proposta; anon não lê fcs_leads).
CREATE OR REPLACE FUNCTION public.fcs_lead_store_id(p_lead UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT l.store_id FROM public.fcs_leads l WHERE l.id = p_lead;
$$;

-- Loja de um veículo PUBLICADO (anon não precisa de SELECT em fcs_vehicles para isso).
CREATE OR REPLACE FUNCTION public.fcs_public_vehicle_store_id(p_vehicle UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT v.store_id FROM public.fcs_vehicles v
  WHERE v.id = p_vehicle AND v.status = 'published';
$$;

-- Loja aprovada (vitrine pública).
CREATE OR REPLACE FUNCTION public.fcs_store_is_public(p_store UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fcs_stores s
    WHERE s.id = p_store AND s.status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.fcs_dealer_is_active(p_dealer UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fcs_dealers d
    WHERE d.id = p_dealer AND d.status = 'active'
  );
$$;

-- Usuário é lojista (membership ativa) deste dealer.
CREATE OR REPLACE FUNCTION public.fcs_is_dealer_owner(p_dealer UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fcs_memberships m
    WHERE m.user_id = auth.uid()
      AND m.dealer_id = p_dealer
      AND m.role = 'lojista'
      AND m.status = 'active'
  );
$$;

-- Lojista com revenda ATIVA. Lojista de revenda pendente/suspensa não gerencia loja nem equipe.
CREATE OR REPLACE FUNCTION public.fcs_is_active_dealer_owner(p_dealer UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.fcs_is_dealer_owner(p_dealer) AND public.fcs_dealer_is_active(p_dealer);
$$;

-- Usuário tem CPF cadastrado (usado para liberar o vendedor autônomo).
CREATE OR REPLACE FUNCTION public.fcs_profile_has_cpf()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fcs_profiles p
    WHERE p.id = auth.uid() AND p.cpf IS NOT NULL
  );
$$;

-- Qualquer membro ativo do dealer (lojista, admin ou vendedor).
CREATE OR REPLACE FUNCTION public.fcs_is_dealer_member(p_dealer UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fcs_memberships m
    WHERE m.user_id = auth.uid()
      AND m.dealer_id = p_dealer
      AND m.status = 'active'
  );
$$;

-- Admin da loja (admin_loja desta loja, com dealer consistente) OU lojista dono do dealer da loja.
CREATE OR REPLACE FUNCTION public.fcs_is_store_admin(p_store UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p_store IS NOT NULL AND (
    EXISTS (
      SELECT 1
      FROM public.fcs_memberships m
      JOIN public.fcs_stores s ON s.id = m.store_id AND s.dealer_id = m.dealer_id
      WHERE m.user_id = auth.uid()
        AND m.store_id = p_store
        AND m.role = 'admin_loja'
        AND m.status = 'active'
    )
    OR public.fcs_is_active_dealer_owner(public.fcs_store_dealer_id(p_store))
  );
$$;

-- Qualquer membro da loja: admin da loja ou vendedor vinculado a ela.
CREATE OR REPLACE FUNCTION public.fcs_is_store_member(p_store UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p_store IS NOT NULL AND (
    public.fcs_is_store_admin(p_store)
    OR EXISTS (
      SELECT 1
      FROM public.fcs_memberships m
      JOIN public.fcs_stores s ON s.id = m.store_id AND s.dealer_id = m.dealer_id
      WHERE m.user_id = auth.uid()
        AND m.store_id = p_store
        AND m.role = 'vendedor'
        AND m.status = 'active'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.fcs_is_autonomous_seller()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fcs_memberships m
    WHERE m.user_id = auth.uid()
      AND m.role = 'vendedor_autonomo'
      AND m.status = 'active'
  );
$$;

-- ------------------------------------------------------------------------------
-- 4) TRAVA DE CAMPOS ADMINISTRATIVOS (trigger)
--    Políticas de UPDATE não conseguem comparar OLD x NEW, então isso fica em trigger.
--    Sem JWT (service role / SQL direto) ou super_admin: passa.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fcs_guard_admin_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.fcs_is_super_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'fcs_dealers' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
       OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
       OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
       OR NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id
       OR NEW.document_number IS DISTINCT FROM OLD.document_number THEN
      RAISE EXCEPTION 'Somente o super_admin altera status, assinatura ou aprovação da revenda'
        USING ERRCODE = '42501';
    END IF;

  ELSIF TG_TABLE_NAME = 'fcs_stores' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.domain_verified IS DISTINCT FROM OLD.domain_verified
       OR NEW.dealer_id IS DISTINCT FROM OLD.dealer_id THEN
      RAISE EXCEPTION 'Somente o super_admin altera status, domínio verificado ou revenda da loja'
        USING ERRCODE = '42501';
    END IF;

  ELSIF TG_TABLE_NAME = 'fcs_profiles' THEN
    -- CPF pode ser preenchido uma vez; depois só o super_admin altera.
    IF OLD.cpf IS NOT NULL AND NEW.cpf IS DISTINCT FROM OLD.cpf THEN
      RAISE EXCEPTION 'CPF já cadastrado; alteração somente pelo super_admin'
        USING ERRCODE = '42501';
    END IF;

  ELSIF TG_TABLE_NAME = 'fcs_leads' THEN
    -- Vendedor não pode mover o lead para outra loja/revenda.
    IF NOT public.fcs_is_store_admin(OLD.store_id)
       AND (NEW.store_id IS DISTINCT FROM OLD.store_id
            OR NEW.dealer_id IS DISTINCT FROM OLD.dealer_id) THEN
      RAISE EXCEPTION 'Lead não pode ser movido para outra loja pelo vendedor'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fcs_dealers_guard_admin_fields ON public.fcs_dealers;
CREATE TRIGGER fcs_dealers_guard_admin_fields
  BEFORE UPDATE ON public.fcs_dealers
  FOR EACH ROW EXECUTE FUNCTION public.fcs_guard_admin_fields();

DROP TRIGGER IF EXISTS fcs_stores_guard_admin_fields ON public.fcs_stores;
CREATE TRIGGER fcs_stores_guard_admin_fields
  BEFORE UPDATE ON public.fcs_stores
  FOR EACH ROW EXECUTE FUNCTION public.fcs_guard_admin_fields();

DROP TRIGGER IF EXISTS fcs_profiles_guard_admin_fields ON public.fcs_profiles;
CREATE TRIGGER fcs_profiles_guard_admin_fields
  BEFORE UPDATE ON public.fcs_profiles
  FOR EACH ROW EXECUTE FUNCTION public.fcs_guard_admin_fields();

DROP TRIGGER IF EXISTS fcs_leads_guard_admin_fields ON public.fcs_leads;
CREATE TRIGGER fcs_leads_guard_admin_fields
  BEFORE UPDATE ON public.fcs_leads
  FOR EACH ROW EXECUTE FUNCTION public.fcs_guard_admin_fields();

-- ------------------------------------------------------------------------------
-- 4b) LIMITES DO PLANO (trigger). Limite = coluna do plano ativo (ou trial) da revenda:
--     fcs_plans.vehicle_limit (veículos), store_limit (lojas), seller_limit (vendedores).
--     Conta só linhas não arquivadas/não revogadas; excluir/arquivar libera a vaga.
--     Sem assinatura ativa/trial a inserção é recusada.
--     SECURITY DEFINER: o trigger precisa ler assinaturas/contagens sem RLS do chamador.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fcs_enforce_plan_limit()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_dealer UUID;
  v_limit INTEGER;
  v_count INTEGER;
  v_label TEXT;
  v_counts_new BOOLEAN;
  v_counts_old BOOLEAN := false;
BEGIN
  IF TG_TABLE_NAME = 'fcs_vehicles' THEN
    v_dealer := COALESCE(NEW.dealer_id, public.fcs_store_dealer_id(NEW.store_id));
    IF NEW.dealer_id IS NULL THEN NEW.dealer_id := v_dealer; END IF;
    v_counts_new := NEW.status <> 'archived';
    v_counts_old := TG_OP = 'UPDATE' AND OLD.status <> 'archived'
                    AND OLD.dealer_id IS NOT DISTINCT FROM v_dealer;
    IF NOT v_counts_new OR v_counts_old THEN RETURN NEW; END IF;
    IF v_dealer IS NULL THEN
      RAISE EXCEPTION 'Veículo sem revenda' USING ERRCODE = '23514';
    END IF;
    SELECT p.vehicle_limit INTO v_limit
      FROM public.fcs_subscriptions s JOIN public.fcs_plans p ON p.id = s.plan_id
      WHERE s.dealer_id = v_dealer AND s.status IN ('active', 'trial')
      ORDER BY s.created_at DESC LIMIT 1;
    SELECT count(*) INTO v_count FROM public.fcs_vehicles v
      WHERE v.dealer_id = v_dealer AND v.status <> 'archived';
    v_label := 'veículos';

  ELSIF TG_TABLE_NAME = 'fcs_stores' THEN
    v_dealer := NEW.dealer_id;
    v_counts_new := NEW.status <> 'rejected';
    v_counts_old := TG_OP = 'UPDATE' AND OLD.status <> 'rejected'
                    AND OLD.dealer_id IS NOT DISTINCT FROM NEW.dealer_id;
    IF NOT v_counts_new OR v_counts_old THEN RETURN NEW; END IF;
    IF v_dealer IS NULL THEN
      RAISE EXCEPTION 'Loja sem revenda' USING ERRCODE = '23514';
    END IF;
    SELECT p.store_limit INTO v_limit
      FROM public.fcs_subscriptions s JOIN public.fcs_plans p ON p.id = s.plan_id
      WHERE s.dealer_id = v_dealer AND s.status IN ('active', 'trial')
      ORDER BY s.created_at DESC LIMIT 1;
    SELECT count(*) INTO v_count FROM public.fcs_stores s
      WHERE s.dealer_id = v_dealer AND s.status <> 'rejected';
    v_label := 'lojas';

  ELSIF TG_TABLE_NAME = 'fcs_memberships' THEN
    v_counts_new := NEW.role = 'vendedor' AND NEW.status <> 'revoked';
    v_counts_old := TG_OP = 'UPDATE' AND OLD.role = 'vendedor' AND OLD.status <> 'revoked'
                    AND OLD.dealer_id IS NOT DISTINCT FROM NEW.dealer_id;
    IF NOT v_counts_new OR v_counts_old THEN RETURN NEW; END IF;
    v_dealer := NEW.dealer_id;
    IF v_dealer IS NULL THEN
      RAISE EXCEPTION 'Vendedor sem revenda' USING ERRCODE = '23514';
    END IF;
    SELECT p.seller_limit INTO v_limit
      FROM public.fcs_subscriptions s JOIN public.fcs_plans p ON p.id = s.plan_id
      WHERE s.dealer_id = v_dealer AND s.status IN ('active', 'trial')
      ORDER BY s.created_at DESC LIMIT 1;
    SELECT count(*) INTO v_count FROM public.fcs_memberships m
      WHERE m.dealer_id = v_dealer AND m.role = 'vendedor' AND m.status <> 'revoked';
    v_label := 'vendedores';
  END IF;

  IF v_limit IS NULL THEN
    RAISE EXCEPTION 'Revenda sem plano ativo' USING ERRCODE = '23514';
  END IF;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Limite do plano atingido: % % (máximo %)', v_count, v_label, v_limit
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fcs_vehicles_plan_limit ON public.fcs_vehicles;
CREATE TRIGGER fcs_vehicles_plan_limit
  BEFORE INSERT OR UPDATE ON public.fcs_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.fcs_enforce_plan_limit();

DROP TRIGGER IF EXISTS fcs_stores_plan_limit ON public.fcs_stores;
CREATE TRIGGER fcs_stores_plan_limit
  BEFORE INSERT OR UPDATE ON public.fcs_stores
  FOR EACH ROW EXECUTE FUNCTION public.fcs_enforce_plan_limit();

DROP TRIGGER IF EXISTS fcs_memberships_plan_limit ON public.fcs_memberships;
CREATE TRIGGER fcs_memberships_plan_limit
  BEFORE INSERT OR UPDATE ON public.fcs_memberships
  FOR EACH ROW EXECUTE FUNCTION public.fcs_enforce_plan_limit();

-- ------------------------------------------------------------------------------
-- 5) RLS HABILITADO NAS TABELAS TOCADAS (já estava; idempotente)
-- ------------------------------------------------------------------------------
ALTER TABLE public.fcs_profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_dealers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_stores                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_memberships            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_vehicles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_vehicle_media          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_pipeline_stages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_leads                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_lead_assignments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_lead_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_tasks                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_proposals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_sales                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_contact_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_routing_rules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_external_api_queries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_plans                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_subscriptions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_buyer_favorites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcs_buyer_searches         ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6) REMOVER POLÍTICAS PERMISSIVAS (nomes conferidos em 20261009_initial_schema.sql
--    e 20261010_crm_phase2.sql / crm_plans_and_buyer.sql)
-- ------------------------------------------------------------------------------
-- fcs_profiles (phase2)
DROP POLICY IF EXISTS fcs_profiles_select ON public.fcs_profiles;
DROP POLICY IF EXISTS fcs_profiles_insert ON public.fcs_profiles;
DROP POLICY IF EXISTS fcs_profiles_update ON public.fcs_profiles;
-- fcs_dealers (phase2)
DROP POLICY IF EXISTS fcs_dealers_select ON public.fcs_dealers;
DROP POLICY IF EXISTS fcs_dealers_insert ON public.fcs_dealers;
DROP POLICY IF EXISTS fcs_dealers_update ON public.fcs_dealers;
-- fcs_memberships (phase2)
DROP POLICY IF EXISTS fcs_memberships_select ON public.fcs_memberships;
DROP POLICY IF EXISTS fcs_memberships_insert ON public.fcs_memberships;
DROP POLICY IF EXISTS fcs_memberships_update ON public.fcs_memberships;
-- fcs_stores (initial_schema — políticas com user_id legado e acesso anon via auth.uid() IS NULL)
DROP POLICY IF EXISTS "Lojas aprovadas são visíveis publicamente" ON public.fcs_stores;
DROP POLICY IF EXISTS "Usuários autenticados podem criar lojas" ON public.fcs_stores;
DROP POLICY IF EXISTS "Donos podem atualizar suas lojas" ON public.fcs_stores;
-- fcs_vehicles (initial_schema — "auth.uid() IS NULL" liberava escrita anon)
DROP POLICY IF EXISTS "Veículos publicados são visíveis publicamente" ON public.fcs_vehicles;
DROP POLICY IF EXISTS "Lojistas podem cadastrar veículos para sua loja" ON public.fcs_vehicles;
DROP POLICY IF EXISTS "Lojistas podem atualizar seus veículos" ON public.fcs_vehicles;
-- fcs_external_api_queries (initial_schema — SELECT USING (true) e INSERT WITH CHECK (true))
DROP POLICY IF EXISTS "Permitir inserção de logs de consultas" ON public.fcs_external_api_queries;
DROP POLICY IF EXISTS "Lojistas e administradores podem ler logs" ON public.fcs_external_api_queries;
-- fcs_vehicle_media (phase2)
DROP POLICY IF EXISTS fcs_vehicle_media_select ON public.fcs_vehicle_media;
DROP POLICY IF EXISTS fcs_vehicle_media_all ON public.fcs_vehicle_media;
-- fcs_customers (phase2)
DROP POLICY IF EXISTS fcs_customers_all ON public.fcs_customers;
-- fcs_pipeline_stages (phase2)
DROP POLICY IF EXISTS fcs_pipeline_stages_select ON public.fcs_pipeline_stages;
DROP POLICY IF EXISTS fcs_pipeline_stages_all ON public.fcs_pipeline_stages;
-- CRM (phase2)
DROP POLICY IF EXISTS fcs_leads_all ON public.fcs_leads;
DROP POLICY IF EXISTS fcs_lead_assignments_all ON public.fcs_lead_assignments;
DROP POLICY IF EXISTS fcs_lead_events_all ON public.fcs_lead_events;
DROP POLICY IF EXISTS fcs_tasks_all ON public.fcs_tasks;
DROP POLICY IF EXISTS fcs_proposals_all ON public.fcs_proposals;
DROP POLICY IF EXISTS fcs_sales_all ON public.fcs_sales;
DROP POLICY IF EXISTS fcs_contact_events_all ON public.fcs_contact_events;
DROP POLICY IF EXISTS fcs_routing_rules_all ON public.fcs_routing_rules;
DROP POLICY IF EXISTS fcs_audit_logs_all ON public.fcs_audit_logs;
-- Planos e compradores (crm_plans_and_buyer)
DROP POLICY IF EXISTS fcs_plans_all ON public.fcs_plans;
DROP POLICY IF EXISTS fcs_subscriptions_all ON public.fcs_subscriptions;
DROP POLICY IF EXISTS fcs_buyer_favorites_all ON public.fcs_buyer_favorites;
DROP POLICY IF EXISTS fcs_buyer_searches_all ON public.fcs_buyer_searches;

-- ------------------------------------------------------------------------------
-- 7) NOVAS POLÍTICAS POR ESCOPO
-- ------------------------------------------------------------------------------

-- 7.1 Perfis
CREATE POLICY fcs_profiles_read_scoped ON public.fcs_profiles FOR SELECT
  USING (
    id = auth.uid()
    OR public.fcs_is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.fcs_memberships m
      WHERE m.user_id = fcs_profiles.id
        AND (public.fcs_is_dealer_owner(m.dealer_id) OR public.fcs_is_store_admin(m.store_id))
    )
  );
CREATE POLICY fcs_profiles_self_insert ON public.fcs_profiles FOR INSERT
  WITH CHECK (public.fcs_is_super_admin() OR (id = auth.uid() AND role = 'user'));
-- Usuário comum não sobe o próprio role.
CREATE POLICY fcs_profiles_self_update ON public.fcs_profiles FOR UPDATE
  USING (id = auth.uid() OR public.fcs_is_super_admin())
  WITH CHECK (public.fcs_is_super_admin() OR (id = auth.uid() AND role = 'user'));
CREATE POLICY fcs_profiles_super_delete ON public.fcs_profiles FOR DELETE
  USING (public.fcs_is_super_admin());

-- 7.2 Revendas (lojista)
CREATE POLICY fcs_dealers_member_read ON public.fcs_dealers FOR SELECT
  USING (public.fcs_is_dealer_member(id));
-- Cadastro público de revenda: só pela função fcs_public_register_store (seção 9). Sem INSERT direto.
CREATE POLICY fcs_dealers_owner_update ON public.fcs_dealers FOR UPDATE
  USING (public.fcs_is_dealer_owner(id))
  WITH CHECK (public.fcs_is_dealer_owner(id));
CREATE POLICY fcs_dealers_super_all ON public.fcs_dealers FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.3 Vínculos (memberships)
CREATE POLICY fcs_memberships_self_read ON public.fcs_memberships FOR SELECT
  USING (user_id = auth.uid());
-- Autônomo se cadastra só para si, sem revenda nem loja, e exige CPF já informado em fcs_profiles.
CREATE POLICY fcs_memberships_self_autonomo_insert ON public.fcs_memberships FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'vendedor_autonomo'
    AND dealer_id IS NULL
    AND store_id IS NULL
    AND status = 'active'
    AND public.fcs_profile_has_cpf()
  );
-- Lojista ativo gerencia admins e vendedores da própria revenda, sem criar outro lojista.
CREATE POLICY fcs_memberships_owner_manage ON public.fcs_memberships FOR ALL
  USING (public.fcs_is_active_dealer_owner(dealer_id) AND role IN ('admin_loja', 'vendedor'))
  WITH CHECK (
    public.fcs_is_active_dealer_owner(dealer_id)
    AND role IN ('admin_loja', 'vendedor')
    AND public.fcs_store_dealer_id(store_id) = dealer_id
  );
-- TODO(decisão pendente, não decidido pelo dono): um vendedor pode trabalhar em mais de uma loja?
--   Hoje não há unicidade para role 'vendedor' (só admin_loja é limitado a uma loja).
-- Admin da loja gerencia só os vendedores DA SUA loja (não mexe em admins nem em lojistas).
CREATE POLICY fcs_memberships_store_admin_manage ON public.fcs_memberships FOR ALL
  USING (role = 'vendedor' AND public.fcs_is_store_admin(store_id))
  WITH CHECK (
    role = 'vendedor'
    AND public.fcs_is_store_admin(store_id)
    AND public.fcs_store_dealer_id(store_id) = dealer_id
  );
CREATE POLICY fcs_memberships_super_all ON public.fcs_memberships FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.4 Lojas
CREATE POLICY fcs_stores_public_read ON public.fcs_stores FOR SELECT
  USING (status = 'approved');
CREATE POLICY fcs_stores_member_read ON public.fcs_stores FOR SELECT
  USING (public.fcs_is_store_member(id));
-- Lojista cria loja da própria revenda, sempre pendente de aprovação e sem domínio verificado.
-- Lojista (mesmo com revenda pendente) lê as próprias lojas.
CREATE POLICY fcs_stores_owner_read ON public.fcs_stores FOR SELECT
  USING (public.fcs_is_dealer_owner(dealer_id));
CREATE POLICY fcs_stores_owner_insert ON public.fcs_stores FOR INSERT
  WITH CHECK (
    public.fcs_is_active_dealer_owner(dealer_id)
    AND status = 'pending_approval'
    AND domain_verified = false
  );
CREATE POLICY fcs_stores_admin_update ON public.fcs_stores FOR UPDATE
  USING (public.fcs_is_store_admin(id))
  WITH CHECK (public.fcs_is_store_admin(id));
CREATE POLICY fcs_stores_super_all ON public.fcs_stores FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.5 Veículos
CREATE POLICY fcs_vehicles_public_read ON public.fcs_vehicles FOR SELECT
  USING (status = 'published' AND public.fcs_store_is_public(store_id));
CREATE POLICY fcs_vehicles_member_read ON public.fcs_vehicles FOR SELECT
  USING (public.fcs_is_store_member(store_id));
CREATE POLICY fcs_vehicles_admin_write ON public.fcs_vehicles FOR ALL
  USING (public.fcs_is_store_admin(store_id))
  WITH CHECK (
    public.fcs_is_store_admin(store_id)
    AND dealer_id = public.fcs_store_dealer_id(store_id)
  );
CREATE POLICY fcs_vehicles_super_all ON public.fcs_vehicles FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.6 Mídias do veículo: herdam a visibilidade do veículo (a RLS de fcs_vehicles filtra dentro do EXISTS)
CREATE POLICY fcs_vehicle_media_read ON public.fcs_vehicle_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.fcs_vehicles v WHERE v.id = fcs_vehicle_media.vehicle_id
  ));
CREATE POLICY fcs_vehicle_media_admin_write ON public.fcs_vehicle_media FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.fcs_vehicles v
    WHERE v.id = fcs_vehicle_media.vehicle_id AND public.fcs_is_store_admin(v.store_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.fcs_vehicles v
    WHERE v.id = fcs_vehicle_media.vehicle_id AND public.fcs_is_store_admin(v.store_id)
  ));
CREATE POLICY fcs_vehicle_media_super_all ON public.fcs_vehicle_media FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.7 Clientes (carteira da revenda; sem store_id direto, o escopo vem dos leads)
CREATE POLICY fcs_customers_owner_all ON public.fcs_customers FOR ALL
  USING (public.fcs_is_dealer_owner(dealer_id))
  WITH CHECK (public.fcs_is_dealer_owner(dealer_id));
CREATE POLICY fcs_customers_member_insert ON public.fcs_customers FOR INSERT
  WITH CHECK (public.fcs_is_dealer_member(dealer_id));
-- Vendedor/admin só leem clientes que têm lead visível para eles (RLS de fcs_leads filtra no EXISTS).
CREATE POLICY fcs_customers_lead_read ON public.fcs_customers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.fcs_leads l WHERE l.customer_id = fcs_customers.id
  ));
CREATE POLICY fcs_customers_store_admin_update ON public.fcs_customers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.fcs_leads l
    WHERE l.customer_id = fcs_customers.id AND public.fcs_is_store_admin(l.store_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.fcs_leads l
    WHERE l.customer_id = fcs_customers.id AND public.fcs_is_store_admin(l.store_id)
  ));
-- Formulário da vitrine: cliente novo, ativo, sem responsável, em revenda ativa.
CREATE POLICY fcs_customers_public_insert ON public.fcs_customers FOR INSERT
  WITH CHECK (
    status = 'active'
    AND assigned_seller_id IS NULL
    AND created_by IS NULL
    AND (marketplace_user_id IS NULL OR marketplace_user_id = auth.uid())
    AND public.fcs_dealer_is_active(dealer_id)
  );
CREATE POLICY fcs_customers_super_all ON public.fcs_customers FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.8 Etapas do funil (store_id NULL = padrão da revenda)
CREATE POLICY fcs_pipeline_stages_read ON public.fcs_pipeline_stages FOR SELECT
  USING (
    public.fcs_is_dealer_owner(dealer_id)
    OR (store_id IS NULL AND public.fcs_is_dealer_member(dealer_id))
    OR public.fcs_is_store_member(store_id)
  );
CREATE POLICY fcs_pipeline_stages_manage ON public.fcs_pipeline_stages FOR ALL
  USING (
    public.fcs_is_dealer_owner(dealer_id)
    OR (store_id IS NOT NULL AND public.fcs_is_store_admin(store_id)
        AND dealer_id = public.fcs_store_dealer_id(store_id))
  )
  WITH CHECK (
    public.fcs_is_dealer_owner(dealer_id)
    OR (store_id IS NOT NULL AND public.fcs_is_store_admin(store_id)
        AND dealer_id = public.fcs_store_dealer_id(store_id))
  );
CREATE POLICY fcs_pipeline_stages_super_all ON public.fcs_pipeline_stages FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.9 Leads
-- Lojista lê todos os leads da própria revenda (inclusive com revenda pendente).
CREATE POLICY fcs_leads_owner_read ON public.fcs_leads FOR SELECT
  USING (public.fcs_is_dealer_owner(dealer_id));
CREATE POLICY fcs_leads_store_admin_all ON public.fcs_leads FOR ALL
  USING (public.fcs_is_store_admin(store_id))
  WITH CHECK (
    public.fcs_is_store_admin(store_id)
    AND dealer_id = public.fcs_store_dealer_id(store_id)
  );
-- Vendedor (com loja) ou autônomo: só leads atribuídos a ele.
CREATE POLICY fcs_leads_seller_read ON public.fcs_leads FOR SELECT
  USING (
    assigned_seller_id = auth.uid()
    AND (public.fcs_is_store_member(store_id) OR public.fcs_is_autonomous_seller())
  );
CREATE POLICY fcs_leads_seller_update ON public.fcs_leads FOR UPDATE
  USING (
    assigned_seller_id = auth.uid()
    AND (public.fcs_is_store_member(store_id) OR public.fcs_is_autonomous_seller())
  )
  WITH CHECK (assigned_seller_id = auth.uid());
-- Formulário da vitrine: lead aberto, sem responsável, em loja aprovada da revenda informada.
CREATE POLICY fcs_leads_public_insert ON public.fcs_leads FOR INSERT
  WITH CHECK (
    status = 'open'
    AND assigned_seller_id IS NULL
    AND closed_at IS NULL
    AND lost_reason IS NULL
    AND public.fcs_store_is_public(store_id)
    AND dealer_id = public.fcs_store_dealer_id(store_id)
  );
CREATE POLICY fcs_leads_super_all ON public.fcs_leads FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.10 Distribuição de leads (histórico)
CREATE POLICY fcs_lead_assignments_store_admin ON public.fcs_lead_assignments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.fcs_leads l
    WHERE l.id = fcs_lead_assignments.lead_id AND public.fcs_is_store_admin(l.store_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.fcs_leads l
    WHERE l.id = fcs_lead_assignments.lead_id AND public.fcs_is_store_admin(l.store_id)
  ));
CREATE POLICY fcs_lead_assignments_seller_read ON public.fcs_lead_assignments FOR SELECT
  USING (seller_id = auth.uid());
CREATE POLICY fcs_lead_assignments_super_all ON public.fcs_lead_assignments FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.11 Linha do tempo do lead (append-only para não-super: sem UPDATE/DELETE)
CREATE POLICY fcs_lead_events_read ON public.fcs_lead_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.fcs_leads l WHERE l.id = fcs_lead_events.lead_id
  ));
CREATE POLICY fcs_lead_events_insert ON public.fcs_lead_events FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.fcs_leads l WHERE l.id = fcs_lead_events.lead_id)
    AND (actor_user_id IS NULL OR actor_user_id = auth.uid())
  );
CREATE POLICY fcs_lead_events_super_all ON public.fcs_lead_events FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.12 Tarefas
CREATE POLICY fcs_tasks_store_admin_all ON public.fcs_tasks FOR ALL
  USING (public.fcs_is_store_admin(store_id))
  WITH CHECK (
    public.fcs_is_store_admin(store_id)
    AND dealer_id = public.fcs_store_dealer_id(store_id)
  );
CREATE POLICY fcs_tasks_assignee_read ON public.fcs_tasks FOR SELECT
  USING (
    assigned_user_id = auth.uid()
    AND (public.fcs_is_store_member(store_id) OR public.fcs_is_autonomous_seller())
  );
CREATE POLICY fcs_tasks_assignee_update ON public.fcs_tasks FOR UPDATE
  USING (
    assigned_user_id = auth.uid()
    AND (public.fcs_is_store_member(store_id) OR public.fcs_is_autonomous_seller())
  )
  WITH CHECK (assigned_user_id = auth.uid());
CREATE POLICY fcs_tasks_super_all ON public.fcs_tasks FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.13 Propostas
CREATE POLICY fcs_proposals_store_admin_all ON public.fcs_proposals FOR ALL
  USING (public.fcs_is_store_admin(store_id))
  WITH CHECK (
    public.fcs_is_store_admin(store_id)
    AND dealer_id = public.fcs_store_dealer_id(store_id)
  );
CREATE POLICY fcs_proposals_seller_read ON public.fcs_proposals FOR SELECT
  USING (
    seller_id = auth.uid()
    AND (public.fcs_is_store_member(store_id) OR public.fcs_is_autonomous_seller())
  );
CREATE POLICY fcs_proposals_seller_update ON public.fcs_proposals FOR UPDATE
  USING (
    seller_id = auth.uid()
    AND (public.fcs_is_store_member(store_id) OR public.fcs_is_autonomous_seller())
  )
  WITH CHECK (seller_id = auth.uid());
-- Formulário da vitrine: proposta 'sent', sem vendedor (seller_id NULL), em loja aprovada,
-- ligada a um lead e a um veículo publicado DESSA loja.
CREATE POLICY fcs_proposals_public_insert ON public.fcs_proposals FOR INSERT
  WITH CHECK (
    status = 'sent'
    AND seller_id IS NULL
    AND public.fcs_store_is_public(store_id)
    AND dealer_id = public.fcs_store_dealer_id(store_id)
    AND public.fcs_lead_store_id(lead_id) = store_id
    AND public.fcs_public_vehicle_store_id(vehicle_id) = store_id
  );
CREATE POLICY fcs_proposals_super_all ON public.fcs_proposals FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.14 Vendas e comissões (vendedor vê as próprias)
CREATE POLICY fcs_sales_store_admin_all ON public.fcs_sales FOR ALL
  USING (public.fcs_is_store_admin(store_id))
  WITH CHECK (
    public.fcs_is_store_admin(store_id)
    AND dealer_id = public.fcs_store_dealer_id(store_id)
  );
CREATE POLICY fcs_sales_seller_read ON public.fcs_sales FOR SELECT
  USING (
    seller_id = auth.uid()
    AND (public.fcs_is_store_member(store_id) OR public.fcs_is_autonomous_seller())
  );
CREATE POLICY fcs_sales_super_all ON public.fcs_sales FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.15 Contatos (WhatsApp / telefone / e-mail)
CREATE POLICY fcs_contact_events_store_admin_all ON public.fcs_contact_events FOR ALL
  USING (public.fcs_is_store_admin(store_id))
  WITH CHECK (
    public.fcs_is_store_admin(store_id)
    AND dealer_id = public.fcs_store_dealer_id(store_id)
  );
CREATE POLICY fcs_contact_events_seller_read ON public.fcs_contact_events FOR SELECT
  USING (seller_id = auth.uid());
-- Vendedor registra contato só em lead atribuído a ele.
CREATE POLICY fcs_contact_events_seller_insert ON public.fcs_contact_events FOR INSERT
  WITH CHECK (
    seller_id = auth.uid()
    AND lead_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.fcs_leads l
      WHERE l.id = fcs_contact_events.lead_id AND l.assigned_seller_id = auth.uid()
    )
  );
CREATE POLICY fcs_contact_events_super_all ON public.fcs_contact_events FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.16 Regras de distribuição (só admin da loja e super)
CREATE POLICY fcs_routing_rules_store_admin_all ON public.fcs_routing_rules FOR ALL
  USING (public.fcs_is_store_admin(store_id))
  WITH CHECK (
    public.fcs_is_store_admin(store_id)
    AND dealer_id = public.fcs_store_dealer_id(store_id)
  );
CREATE POLICY fcs_routing_rules_super_all ON public.fcs_routing_rules FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.17 Auditoria: lojista lê a própria revenda; quem grava é o próprio usuário logado (ou service role)
CREATE POLICY fcs_audit_logs_dealer_read ON public.fcs_audit_logs FOR SELECT
  USING (public.fcs_is_dealer_owner(dealer_id));
CREATE POLICY fcs_audit_logs_actor_insert ON public.fcs_audit_logs FOR INSERT
  WITH CHECK (actor_user_id = auth.uid());
CREATE POLICY fcs_audit_logs_super_all ON public.fcs_audit_logs FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.18 Log de consultas externas (placas/FIPE/CNPJ): só super_admin.
--      Nenhum INSERT de cliente foi encontrado no front; a gravação deve usar service role.
CREATE POLICY fcs_external_queries_super_all ON public.fcs_external_api_queries FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.19 Planos e assinaturas
-- TODO(plano): fcs_plans tem store_limit e seller_limit (e vehicle_limit), mas nenhuma regra SQL os
-- aplica aqui. Enforcement fica para o app ou para trigger futura.
-- TODO: fcs_subscriptions.status não é sincronizado com fcs_dealers.subscription_status.
CREATE POLICY fcs_plans_public_read ON public.fcs_plans FOR SELECT
  USING (is_active);
CREATE POLICY fcs_plans_super_all ON public.fcs_plans FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());
-- Lojista lê a própria assinatura; escrita só super_admin.
CREATE POLICY fcs_subscriptions_owner_read ON public.fcs_subscriptions FOR SELECT
  USING (public.fcs_is_dealer_owner(dealer_id));
CREATE POLICY fcs_subscriptions_super_all ON public.fcs_subscriptions FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- 7.20 Área do comprador: cada comprador só mexe no próprio dado
CREATE POLICY fcs_buyer_favorites_own ON public.fcs_buyer_favorites FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY fcs_buyer_favorites_super_all ON public.fcs_buyer_favorites FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

CREATE POLICY fcs_buyer_searches_own ON public.fcs_buyer_searches FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY fcs_buyer_searches_super_all ON public.fcs_buyer_searches FOR ALL
  USING (public.fcs_is_super_admin()) WITH CHECK (public.fcs_is_super_admin());

-- ------------------------------------------------------------------------------
-- 9) CADASTRO DE LOJA PELA VITRINE (só e-mail). Função no servidor, SECURITY DEFINER.
--    Cria: conta (auth.users), perfil, revenda 'pending', assinatura trial do plano 'start',
--    loja 'pending_approval' e vínculo 'lojista' ativo. Lojista só vê os próprios clientes/leads
--    enquanto a revenda não for aprovada (fcs_is_active_dealer_owner barra estoque e equipe).
--    ATENÇÃO (validar em staging antes de aplicar):
--    * Inserir em auth.users diretamente depende do schema do Auth do projeto. A alternativa
--      mais segura é criar a conta pela API admin (edge function com service role) e chamar
--      esta função só para o cadastro comercial. Sem senha: o acesso vem por link de login.
--    * Sem CAPTCHA/rate limit no banco: a função é aberta a anon. Recomendado no endpoint.
--    * Responde o mesmo erro para e-mail e CNPJ/CPF já existentes (evita enumeração parcial,
--      mas ainda é um sinal). Decidir se aceitável.
--    * legal_name recebe o nome fantasia (coluna NOT NULL e não há razão social no formulário).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fcs_public_register_store(
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_trade_name TEXT,
  p_store_name TEXT,
  p_document_type TEXT,
  p_document_number TEXT,
  p_city TEXT,
  p_state TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email TEXT := lower(btrim(coalesce(p_email, '')));
  v_doc TEXT := regexp_replace(coalesce(p_document_number, ''), '\D', '', 'g');
  v_user UUID := gen_random_uuid();
  v_dealer UUID := gen_random_uuid();
  v_store UUID := gen_random_uuid();
BEGIN
  IF length(v_email) > 254 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'E-mail inválido' USING ERRCODE = '22023';
  END IF;
  IF btrim(coalesce(p_full_name, '')) = '' OR btrim(coalesce(p_trade_name, '')) = ''
     OR btrim(coalesce(p_store_name, '')) = '' THEN
    RAISE EXCEPTION 'Nome, nome fantasia e nome da loja são obrigatórios' USING ERRCODE = '22023';
  END IF;
  IF p_document_type = 'cpf' THEN
    IF NOT public.fcs_is_valid_cpf(v_doc) THEN
      RAISE EXCEPTION 'CPF inválido' USING ERRCODE = '22023';
    END IF;
  ELSIF p_document_type = 'cnpj' THEN
    IF v_doc !~ '^[0-9]{14}$' THEN   -- ponytail: DV do CNPJ não validado aqui; validar se quiser rigor
      RAISE EXCEPTION 'CNPJ inválido' USING ERRCODE = '22023';
    END IF;
  ELSE
    RAISE EXCEPTION 'Tipo de documento inválido' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = v_email)
     OR EXISTS (SELECT 1 FROM public.fcs_dealers d WHERE d.document_number = v_doc) THEN
    RAISE EXCEPTION 'Não foi possível concluir o cadastro. Fale com o suporte.' USING ERRCODE = '23505';
  END IF;

  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data)
  VALUES (v_user, 'authenticated', 'authenticated', v_email, now(), now(),
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          jsonb_build_object('full_name', btrim(p_full_name)));

  INSERT INTO public.fcs_profiles (id, full_name, phone)
  VALUES (v_user, btrim(p_full_name), NULLIF(btrim(coalesce(p_phone, '')), ''));

  INSERT INTO public.fcs_dealers (id, legal_name, trade_name, document_number, document_type,
                                  owner_user_id, email, phone, status, subscription_status)
  VALUES (v_dealer, btrim(p_trade_name), btrim(p_trade_name), v_doc, p_document_type,
          v_user, v_email, NULLIF(btrim(coalesce(p_phone, '')), ''), 'pending', 'trial');

  -- Assinatura trial do plano 'start' ANTES da loja: o trigger de limite exige plano ativo/trial.
  INSERT INTO public.fcs_subscriptions (dealer_id, plan_id, status)
  SELECT v_dealer, p.id, 'trial' FROM public.fcs_plans p
  WHERE p.slug = 'start' AND p.is_active;

  INSERT INTO public.fcs_stores (id, dealer_id, name, slug, email, phone,
                                 address_city, address_state, status, domain_verified)
  VALUES (v_store, v_dealer, btrim(p_store_name),
          left(lower(regexp_replace(btrim(p_store_name), '[^a-zA-Z0-9]+', '-', 'g')), 40)
            || '-' || left(v_store::text, 8),
          v_email, NULLIF(btrim(coalesce(p_phone, '')), ''),
          NULLIF(btrim(coalesce(p_city, '')), ''),
          upper(left(btrim(coalesce(p_state, '')), 2)),
          'pending_approval', false);

  INSERT INTO public.fcs_memberships (user_id, dealer_id, store_id, role, status)
  VALUES (v_user, v_dealer, NULL, 'lojista', 'active');
END;
$$;

-- ------------------------------------------------------------------------------
-- 8) PRIMEIRO SUPER ADMIN (rodar UMA vez, manualmente, com o id do usuário no Supabase Auth)
-- UPDATE public.fcs_profiles SET role = 'super_admin' WHERE id = '<UUID-DO-USUARIO-AUTH>';
-- ------------------------------------------------------------------------------

COMMIT;
