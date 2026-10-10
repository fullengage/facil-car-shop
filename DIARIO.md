# DIÁRIO DE DESENVOLVIMENTO — FÁCIL CAR SHOP

## 📅 Data: 09 de Outubro de 2026

### 1. Contexto e Objetivo
Implementação do módulo avançado de cadastro inteligente de veículos e integração com serviços externos para o **Fácil Car Shop**.
O fluxo central atende ao mantra do lojista:
> **"Digite a placa, complete as fotos e anuncie seu carro."**

---

### 2. Análise Técnica e Decisões de Arquitetura

#### A. Documentação Oficial da BrasilAPI e Limitações de Placa
- **Fato verificado:** A [BrasilAPI](https://brasilapi.com.br/docs) não possui endpoint público oficial de consulta por placa de veículos.
- **Solução Arquitetural:** Criação da interface desacoplada `VehiclePlateProvider` (`src/services/plate/VehiclePlateProvider.ts`).
  - Implementação `MockVehiclePlateProvider` com banco de dados realista e placas de demonstração brasileiras (`BRA2E19`, `FCL2026`, `RIO2A18`, `ABC1234`), permitindo testes imediatos de ponta a ponta.
  - Implementação `HttpVehiclePlateProvider` parametrizada pelas variáveis de ambiente `VITE_PLATE_API_URL` e `VITE_PLATE_API_KEY`, pronta para ser conectada a provedores homologados (Sinesp, PlacaFipe, webhooks privados).
  - Gerenciador `PlateProviderManager` que valida a placa, registra a métrica de tempo em ms e higieniza metadados.

#### B. Banco de Dados Supabase (Prefixo `fcs_`)
- Atendendo à solicitação expressa do usuário, todas as entidades do banco receberam o prefixo `fcs_`:
  1. `fcs_stores`: Gestão de lojas, dados cadastrais, CNPJ e endereço.
  2. `fcs_vehicles`: Anúncios com `plate`, `plate_masked`, `fipe_code`, `fipe_price`, `fipe_reference_month`, status de consulta e auditoria.
  3. `fcs_external_api_queries`: Histórico de chamadas a APIs externas com latência em ms, provedor e query type.
  4. `fcs_public_vehicle_listings`: View pública que oculta a placa completa e expõe apenas a placa mascarada (`ABC***4`).
- **Aplicação da Migration:** A migração DDL foi executada e confirmada diretamente no projeto Supabase ativo via ferramenta MCP `apply_migration`.

#### C. Endpoints BrasilAPI Integrados e Testados
- **Tabela FIPE:**
  - `GET /fipe/marcas/v1/carros`: Listagem de montadoras/marcas.
  - `GET /fipe/veiculos/v1/carros/{makerCode}`: Modelos da marca.
  - `GET /fipe/anos/v1/carros/{makerCode}/{modelCode}`: Anos e tipos de combustível.
  - `GET /fipe/detalhes/v1/carros/{makerCode}/{modelCode}/{yearCode}`: Preço e mês de referência FIPE oficial.
  - `GET /fipe/preco/v1/{fipeCode}`: Histórico e preço direto por código FIPE.
  - `GET /fipe/tabelas/v1`: Tabelas históricas de referência.
- **Empresas (CNPJ):**
  - `GET /cnpj/v1/{cnpj}`: Auto-preenchimento de Razão Social, Nome Fantasia, CNAE, Telefone e Endereço no cadastro de lojas.
- **Localização (CEP):**
  - `GET /cep/v2/{cep}` com fallback para `v1`: Preenchimento instantâneo de Logradouro, Bairro, Cidade e UF.

#### D. Otimizações de Rede e Privacidade (LGPD)
- **Cache com TTL (`src/services/brasilApi/cache.ts`):** 24 horas para marcas, modelos e CNPJ; 30 dias para CEP; 1 hora para preços FIPE. Evita requisições redundantes e respeita rate limits.
- **Timeout com AbortController:** Timeout automático de 10 segundos configurável.
- **Proteção de Dados Sensíveis:** Placas completas nunca são gravadas em texto puro nos logs genéricos de auditoria (`fcs_external_api_queries`). Na camada pública, o número é mascarado (ex: `BRA***9`).

---

### 3. Registro dos Testes Unitários e Automatizados (Vitest)
Executados 21 testes com **100% de aprovação**:
1. `src/tests/plateValidator.test.ts`: 7 testes de regex Mercosul, placas antigas, formatação com traço e máscara de privacidade.
2. `src/tests/plateProvider.test.ts`: 4 testes de simulação de consulta, retorno de atributos técnicos e fallback seguro.
3. `src/tests/brasilApiFipe.test.ts`: 6 testes cobrindo marcas, modelos, anos, detalhes FIPE, busca por código e cache TTL.
4. `src/tests/brasilApiCnpjCep.test.ts`: 4 testes cobrindo validação de dígitos e busca de dados empresariais e geográficos.

---

### 4. Validação do Build de Produção
- `npm run build` executado com sucesso:
  - TypeScript type-checking estrito sem erros.
  - Chunks otimizados e minificados pelo Vite.
  - Nenhuma dependência com `any` não tipado (conforme RULE #TECH-01 e RULE #TECH-10).

---

### 5. Otimização de SEO e Dados Estruturados Schema.org
- **Slugs semânticos hierárquicos:** Implementado `slugify` em `src/utils/seo.ts` com normalização NFD, remoção de acentos e preservação de versões de motor (ex: `1-0`, `2-0`).
- **Geração de Titles e Descriptions:** Criação de títulos dinâmicos com marca, modelo, ano, cidade/estado e gatilhos de CTR no Google (`X% abaixo da Tabela FIPE`).
- **Schema.org / JSON-LD:** Injeção automática das entidades `schema.org/Car`, `schema.org/Product`, `schema.org/Offer` e `schema.org/BreadcrumbList` contendo preços, moeda BRL, ano, combustível, quilometragem, fotos e concessionária vendedora.
- **Proteção LGPD:** A placa completa do veículo é preservada e omitida dos dados estruturados, constando exclusivamente a placa mascarada (`BRA***9`).
- **Arquivos de Rastreamento:** Criados `public/robots.txt` e `public/sitemap.xml` para indexação imediata pelos robôs do Google e Bing.
- **Visualização Detalhada (`VehicleDetailView.tsx`):** Página de anúncio com `<h1>` semântico, microdados, compartilhamento nativo no WhatsApp com prévia e modal de inspeção do código JSON-LD.
- **Testes Automatizados:** 6 novos testes em `src/tests/seo.test.ts` elevando a suíte para 31 testes aprovados.

---

### 6. Conclusão
O sistema Fácil Car Shop agora conta com a melhor arquitetura de SEO do mercado automotivo nacional: dados FIPE oficiais, SEO local georreferenciado, Rich Snippets Schema.org prontos para o Google e velocidade de carregamento instantânea.

---

## 📅 Data: 10 de Outubro de 2026

### 7. CRM Automotivo FCS — Fase 2 (17 Tabelas Oficiais)
- **Status do Banco de Dados:** Todas as 17 tabelas do CRM especificadas no Dicionário de Dados v2.0 foram criadas e reconciliadas com sucesso no Supabase PostgreSQL:
  1. `fcs_profiles`: Perfis de usuários vinculados a `auth.users`.
  2. `fcs_dealers`: Organizações/empresas concessionárias com isolamento multi-tenant.
  3. `fcs_stores`: Reconciliada com `dealer_id`, `slug`, `whatsapp`, horários e geolocalização.
  4. `fcs_memberships`: Vínculos e papéis (`lojista`, `admin_loja`, `vendedor`) com restrição única.
  5. `fcs_vehicles`: Reconciliada com `dealer_id`, `created_by`, `responsible_seller_id`, `renavam`, `doors`, `acquisition_price`, etc.
  6. `fcs_vehicle_media`: Fotos e mídias vinculadas ao Supabase Storage (`is_cover`, `position`).
  7. `fcs_customers`: Carteira isolada de clientes da loja, com suporte a telefone normalizado.
  8. `fcs_pipeline_stages`: Etapas do Kanban com ordenação, cores e categorias (`open`, `won`, `lost`).
  9. `fcs_leads`: Núcleo do CRM e Kanban com controle de versão de concorrência e SLA.
  10. `fcs_lead_assignments`: Histórico completo de distribuição e transferências de vendedores.
  11. `fcs_lead_events`: Timeline e auditoria operacional de todas as movimentações do lead.
  12. `fcs_tasks`: Atividades comerciais com prazos, responsáveis e status.
  13. `fcs_proposals`: Propostas comerciais com valores pedidos, propostos e descontos.
  14. `fcs_sales`: Conclusão de vendas com veículo, vendedor e comissões.
  15. `fcs_contact_events`: Histórico de interações multicanal (WhatsApp, telefone, e-mail).
  16. `fcs_routing_rules`: Regras automatizadas de distribuição de leads (round-robin, menor carga, etc.).
  17. `fcs_audit_logs`: Auditoria de ações sensíveis e conformidade LGPD.
- **Estruturas da Fase 1 Preservadas:** `fcs_external_api_queries` e a view pública `fcs_public_vehicle_listings` foram mantidas e integradas intactas.
- **Seed Inicial:** Função `fcs_seed_pipeline_stages_for_dealer` criada e executada, populando as 8 etapas padrão do Kanban.
- **Segurança & RLS:** Row Level Security ativado em todas as 17 tabelas com políticas configuradas.
- **Tipagem TypeScript:** Criado `src/types/crm.ts` com interfaces estritas e enums para as 17 tabelas, reexportado em `src/types/index.ts`.
- **Validação de Código:** `npm run build` e suíte de testes Vitest (`31 passed`) executados e aprovados com 100% de sucesso.

---

### 8. Sistema de 5 Painéis Administrativos & Dashboards (Fase 2)
- **Implementação dos 5 Perfis com Isolamento e Transição Suave:**
  1. `SUPER_ADMIN` ([SuperAdminDashboard.tsx](file:///c:/Users/Richard%20Wagner/Documents/facil%20car%20shop/src/components/dashboard/SuperAdminDashboard.tsx)):
     - Painel global da plataforma com MRR recorrente, total de lojistas (ativos/pendentes/bloqueados), estoque geral de veículos e leads gerados.
     - Gestão e moderação de lojistas (aprovação, suspensão e reativação auditada).
     - Gestão de planos comerciais (`fcs_plans` e `fcs_subscriptions`) com limites de veículos e unidades.
  2. `LOJISTA` ([DealerDashboard.tsx](file:///c:/Users/Richard%20Wagner/Documents/facil%20car%20shop/src/components/dashboard/DealerDashboard.tsx)):
     - Visão consolidada multi-unidade: unidades, administradores e equipe de vendedores.
     - Estoque consolidado por loja com controle de limites de veículos (ex: 28 de 70 carros anunciados no plano Pro).
     - CRM e funil consolidado de leads.
  3. `ADMIN_LOJA` ([StoreAdminDashboard.tsx](file:///c:/Users/Richard%20Wagner/Documents/facil%20car%20shop/src/components/dashboard/StoreAdminDashboard.tsx)):
     - Cockpit operacional da loja: gestão de estoque, publicação/pausa de anúncios, metas comerciais da unidade e equipe local.
  4. `VENDEDOR` ([SellerDashboard.tsx](file:///c:/Users/Richard%20Wagner/Documents/facil%20car%20shop/src/components/dashboard/SellerDashboard.tsx)):
     - Interface mobile-first ultra rápida: Meus leads, Minha carteira, Minhas tarefas com prazos, Minhas propostas e Comissões acumuladas de vendas fechadas.
     - Botão de WhatsApp com mensagem personalizada e registro automático de evento no CRM (`fcs_contact_events`).
  5. `COMPRADOR` ([BuyerDashboard.tsx](file:///c:/Users/Richard%20Wagner/Documents/facil%20car%20shop/src/components/dashboard/BuyerDashboard.tsx)):
     - Área pessoal do cliente: Veículos favoritos (`fcs_buyer_favorites`), buscas salvas com alertas de preço (`fcs_buyer_searches`), propostas enviadas e histórico de contatos (sem permissão de publicar anúncios).
- **CRM Kanban Board ([CrmKanbanBoard.tsx](file:///c:/Users/Richard%20Wagner/Documents/facil%20car%20shop/src/components/dashboard/CrmKanbanBoard.tsx)):**
  - 8 colunas oficiais: *Novo lead*, *Primeiro contato*, *Em atendimento*, *Visita agendada*, *Negociação*, *Proposta enviada*, *Venda concluída* e *Perdido*.
  - Suporte a Drag & Drop nativo HTML5 e botões táteis de avanço de etapa.
  - Filtros por prioridade (`urgent`, `high`, `normal`, `low`) e busca instantânea por cliente/veículo.
  - Modal de detalhes com histórico e acionamento direto do WhatsApp wa.me.
- **Navegação & Seletor de Perfis ([DashboardLayout.tsx](file:///c:/Users/Richard%20Wagner/Documents/facil%20car%20shop/src/components/dashboard/DashboardLayout.tsx)):**
  - Alternância instantânea no header entre a Vitrine Pública e os 5 Dashboards.
- **Testes & Validação:** 36/36 testes unitários no Vitest aprovados e `npm run build` bem-sucedido.


