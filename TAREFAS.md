# TAREFAS.md — Fácil Car Shop: Integração BrasilAPI e Consulta de Placas

## 📋 Status Geral do Projeto
- **Status:** Concluído com Sucesso ✅
- **Stack:** Vite • TypeScript • React • Tailwind CSS • shadcn/ui patterns • Supabase
- **Prefixo do Banco de Dados:** `fcs_`
- **Cobertura de Testes:** 21/21 testes unitários aprovados (Vitest)

---

## 📌 Checklist de Funcionalidades Implementadas

### 1. Cadastro Inteligente de Veículos por Placa (Prioridade Alta)
- [x] Campo para digitação da placa com design realista padrão Mercosul e tradicional
- [x] Validação do formato brasileiro de placas (`isValidBrazilianPlate`: Mercosul `[A-Z]{3}[0-9][A-Z][0-9]{2}` e Tradicional `[A-Z]{3}[0-9]{4}`)
- [x] Botão "Consultar placa" com loading, feedback de status e botões de teste rápido (`BRA2E19`, `FCL2026`, `RIO2A18`, `ABC1234`)
- [x] Preenchimento automático dos dados do veículo: marca, modelo, versão, ano, combustível, cor e código FIPE
- [x] Possibilidade de corrigir e completar manualmente todos os dados do veículo
- [x] Identificação de consultas indisponíveis ou incompletas com fallback gracioso para cadastro manual
- [x] Interface de integração `VehiclePlateProvider` permitindo plugar provedores reais sem refatoração
- [x] Implementação `MockVehiclePlateProvider` e `HttpVehiclePlateProvider` configurável por backend/env (`VITE_PLATE_API_URL`)
- [x] Não exposição de dados pessoais de proprietários nem utilização de APIs não documentadas
- [x] Prevenção de duplicidade de anúncios ativos do mesmo veículo na mesma loja (`checkDuplicateActiveVehicle`)
- [x] Modal de pré-visualização completa antes da publicação oficial

### 2. Integração com Tabela FIPE (BrasilAPI)
- [x] Endpoint `GET /fipe/marcas/v1/carros` integrado com cache TTL de 24h
- [x] Endpoint `GET /fipe/veiculos/v1/{vehicleType}/{makerCode}` integrado com cache
- [x] Endpoint `GET /fipe/anos/v1/{vehicleType}/{makerCode}/{modelCode}` integrado
- [x] Endpoint `GET /fipe/detalhes/v1/{vehicleType}/{makerCode}/{modelCode}/{yearCode}` integrado com cálculo de referência
- [x] Endpoint `GET /fipe/preco/v1/{fipeCode}` integrado para consulta direta pelo código FIPE
- [x] Endpoint `GET /fipe/tabelas/v1` mapeado e disponível
- [x] Seleção encadeada de Marca -> Modelo -> Ano -> Versão com preenchimento com 1 clique
- [x] Exibição do Marca/Modelo, Ano/Modelo, Combustível, Código FIPE, Preço FIPE e Mês de Referência
- [x] Liberdade para o vendedor definir o próprio preço de venda
- [x] Card de comparação visual destacando o Ágio/Deságio (em R$ e percentual % vs Tabela FIPE)

### 3. Consulta de CNPJ para Lojas (BrasilAPI)
- [x] Endpoint `GET /cnpj/v1/{cnpj}` integrado no `StoreRegisterModal`
- [x] Validação e higienização de CNPJ (14 dígitos)
- [x] Preenchimento automático de Razão Social, Nome Fantasia, Telefone, E-mail e Endereço
- [x] Regra de negócio exibida: O cadastro depende da aprovação do administrador geral e não substitui a verificação de identidade

### 4. Consulta de CEP para Lojas (BrasilAPI)
- [x] Endpoint `GET /cep/v2/{cep}` com fallback automático para `v1`
- [x] Validação e higienização de CEP (8 dígitos)
- [x] Preenchimento automático de Logradouro, Bairro, Cidade e UF durante o cadastro da loja

### 5. Alterações no Supabase com Prefixo `fcs_`
- [x] Tabela `fcs_stores`: Lojas parceiras, dados empresariais e status de aprovação
- [x] Tabela `fcs_vehicles`: Cadastro com colunas `plate`, `plate_masked`, `fipe_code`, `fipe_price`, `fipe_reference_month`, `plate_lookup_status`, `plate_lookup_provider`, `plate_last_checked_at`, `fipe_last_checked_at`
- [x] Tabela `fcs_external_api_queries`: Auditoria com `id`, `user_id`, `store_id`, `provider`, `query_type`, `status`, `requested_at`, `response_time_ms`, `endpoint`, `metadata`
- [x] Proteção LGPD: Mascaramento da placa nos logs e metadados (`plate_masked`)
- [x] View pública `fcs_public_vehicle_listings`: Oculta a placa completa e exibe exclusivamente `plate_masked` (ex: `BRA***9`)
- [x] Índices de performance e políticas Row Level Security (RLS) configuradas
- [x] Migração aplicada e verificada diretamente no banco de dados ativo do Supabase

### 6. Otimização Avançada para Motores de Busca (SEO & Schema.org)
- [x] Motor de geração de Slugs amigáveis de URL hierárquicos (`src/utils/seo.ts`)
- [x] Geração dinâmica de Meta Titles com marca, modelo, ano e cidade/estado
- [x] Geração de Meta Descriptions persuasivas com gatilho de preço e % de desconto FIPE
- [x] Schema.org/Car e Schema.org/Product oficial com ofertas, quilometragem e moeda BRL
- [x] BreadcrumbList estruturado (4 níveis: Início > Carros > Estado > Marca > Modelo)
- [x] WebSite Schema.org com SearchAction para sitelinks no Google
- [x] Proteção e privacidade ativa: a placa completa não é exposta no JSON-LD nem em metatags
- [x] Visualização detalhada do veículo (`VehicleDetailView.tsx`) com `h1` único, breadcrumbs semânticos e tags OpenGraph/WhatsApp
- [x] Modal de inspeção do código JSON-LD para auditoria
- [x] Criação de `public/robots.txt` e `public/sitemap.xml` para indexação pelos robôs
- [x] Testes automatizados do motor de SEO (6 testes no `src/tests/seo.test.ts`)

### 7. CRM Automotivo FCS — Fase 2 (17 Tabelas no Supabase)
- [x] Todas as 17 tabelas previstas criadas com prefixo `fcs_` e verificadas no Supabase:
  - [x] `fcs_profiles` (Perfis dos usuários vinculados a `auth.users`)
  - [x] `fcs_dealers` (Empresas/lojistas multi-tenant)
  - [x] `fcs_stores` (Lojas reconciliadas com `dealer_id`, `slug`, `whatsapp`, etc.)
  - [x] `fcs_memberships` (Equipes, vínculos e papéis de lojista, admin_loja e vendedor)
  - [x] `fcs_vehicles` (Estoque reconciliado com `dealer_id`, `seller_id`, `renavam`, `doors`, etc.)
  - [x] `fcs_vehicle_media` (Fotos e mídias vinculadas ao Supabase Storage)
  - [x] `fcs_customers` (Carteira de clientes com telefone normalizado)
  - [x] `fcs_leads` (Oportunidades comerciais e núcleo do Kanban)
  - [x] `fcs_lead_assignments` (Histórico de distribuição e transferências de vendedores)
  - [x] `fcs_pipeline_stages` (Etapas do funil de vendas com ordenação, categorias e cores)
  - [x] `fcs_lead_events` (Timeline e histórico de negociações)
  - [x] `fcs_tasks` (Tarefas comerciais com prazos e status)
  - [x] `fcs_proposals` (Propostas comerciais com valores e descontos)
  - [x] `fcs_sales` (Vendas concluídas e comissões)
  - [x] `fcs_contact_events` (Contatos via WhatsApp, telefone e e-mail)
  - [x] `fcs_routing_rules` (Regras de distribuição de leads round-robin / menor carga)
  - [x] `fcs_audit_logs` (Auditoria e segurança operacional)
- [x] Estruturas da Fase 1 preservadas e reconciliadas (`fcs_external_api_queries`, view `fcs_public_vehicle_listings`)
- [x] Seed automático executado para as 8 etapas padrão do Kanban (`fcs_seed_pipeline_stages_for_dealer`)
- [x] RLS ativado em todas as 17 tabelas do CRM
- [x] Tipagem TypeScript estrita gerada em `src/types/crm.ts` e exportada em `src/types/index.ts`
- [x] Build de produção (`npm run build`) e suíte de testes (`31/31 passing`) validados

### 8. Qualidade de Código & Regras Globais
- [x] TypeScript estrito e tipado sem `any` (RULE #TECH-01)
- [x] Componentes isolados por responsabilidade única (RULE #TECH-02)
- [x] Base visual com shadcn-ui e Tailwind CSS v4 (RULE #TECH-03 e #TECH-04)
- [x] Estados de loading, sucesso, erro e vazio devidamente tratados (RULE #TECH-07 e #TECH-08)
- [x] Camada desacoplada de hooks e services (RULE #TECH-09)
- [x] Build de produção aprovado `npm run build` (RULE #TECH-10)
- [x] Testes automatizados executados com sucesso: 31/31 testes aprovados (RULE #TECH-07 e Requisito 7)

# FASE 2 — SISTEMA DE PAINÉIS ADMINISTRATIVOS E DASHBOARDS
Decisões técnicas
Tema	Especificação
Autenticação	Supabase Auth
Banco de dados	PostgreSQL do Supabase
Prefixo das tabelas	ncp_, se confirmado na Fase 1
Arquivos	Supabase Storage
Segurança	RLS e autorização no backend
Atualizações	Supabase Realtime
WhatsApp inicial	Links wa.me, sem envio automatizado
Integrações	Edge Functions ou backend existente
Frontend	Manter o framework atual da Fase 1
Idioma e moeda	Português brasileiro, BRL
Fuso de apresentação	America/Sao_Paulo, com timestamps UTC no banco
## Objetivo

Estamos desenvolvendo um marketplace automotivo que também funciona como sistema de gestão de lojas de veículos, inspirado nas funcionalidades comerciais do Cockpit Webmotors.

A Fase 1 contém a estrutura inicial do marketplace.

Sua tarefa agora é implementar a Fase 2: painéis administrativos, dashboards, controle de permissões, gestão de lojas, estoque, vendedores, CRM e relatórios.

**IMPORTANTE: antes de programar, analise todo o projeto existente, os componentes, o banco de dados Supabase, as migrations, as tabelas e os perfis de usuários.**

Não recrie funcionalidades existentes e não altere estruturas sem avaliar os impactos.

## 1. Banco de dados e arquitetura

- Utilizar o Supabase já configurado no projeto.
- Identificar o prefixo atualmente utilizado nas tabelas e manter a convenção.
- Se o projeto utiliza `ncp_`, seguir com esse prefixo.
- Não criar tabelas duplicadas.
- Criar migrations incrementais.
- Preservar todos os dados existentes.
- Implementar Row Level Security (RLS).
- Nunca confiar apenas nas permissões do frontend.
- Não expor a service role key no navegador.
- Usar Supabase Auth para autenticação.
- Criar índices para consultas frequentes.
- Manter histórico e trilha de auditoria para ações críticas.

## 2. Perfis e permissões

Implementar cinco perfis:

**SUPER_ADMIN**

Administrador geral da plataforma. Pode administrar usuários, lojistas, planos, pagamentos, anúncios, moderação e configurações globais.

**LOJISTA**

Proprietário da conta empresarial. Pode administrar suas lojas, gerentes, vendedores, estoques, leads e indicadores consolidados.

**ADMIN_LOJA**

Administrador de uma unidade. Pode administrar o estoque, anúncios, equipe e negociações somente das lojas para as quais recebeu autorização.

**VENDEDOR**

Pode gerenciar sua carteira de clientes, leads atribuídos, tarefas, propostas e veículos autorizados. Não pode consultar os clientes privados de outros vendedores.

**COMPRADOR**

Pode pesquisar veículos, favoritar anúncios, configurar alertas, enviar propostas e acompanhar contatos. Não pode publicar carros.

O sistema deve permitir que um mesmo usuário possua vínculos autorizados com múltiplas lojas, quando necessário.

Evitar criar contas duplicadas para a mesma pessoa.

## 3. Dashboard Super Admin

Criar painel com:

- Quantidade de lojistas cadastrados.
- Lojistas ativos, pendentes e bloqueados.
- Lojas cadastradas.
- Veículos publicados.
- Anúncios aguardando moderação.
- Leads gerados.
- Novos compradores.
- Assinaturas ativas.
- Receita recorrente mensal.
- Inadimplência.
- Histórico de ações administrativas.

Permitir aprovar, suspender e reativar lojistas, mediante confirmação e registro de auditoria.

Criar gestão de planos, preços, limites de anúncios e permissões comerciais.

Nenhuma ação de suspensão deve apagar dados ou históricos.

## 4. Dashboard Lojista

Criar painel com:

- Visão consolidada de todas as suas lojas.
- Cadastro e administração de unidades.
- Cadastro de administradores e vendedores.
- Estoque por unidade.
- Leads por loja.
- Vendas por vendedor.
- Negociações abertas.
- Veículos mais visualizados.
- Relatórios de resultados.
- Plano contratado e limites disponíveis.

Permitir acompanhar tanto resultados por unidade quanto o consolidado da empresa.

## 5. Dashboard Administrador de Loja

Criar painel operacional contendo:

- Gestão de veículos.
- Publicação, edição e pausa de anúncios.
- Cadastro de vendedores.
- Atribuição e transferência de leads.
- CRM Kanban.
- Acompanhamento das propostas.
- Tarefas pendentes.
- Metas comerciais.
- Relatórios de atendimento.
- Histórico de negociações.

Criar uma tela de estoque com filtros por marca, modelo, preço, ano, situação e vendedor responsável.

## 6. Dashboard Vendedor

Criar uma interface simples e rápida, com prioridade para dispositivos móveis.

Menu:

- Visão geral.
- Minha carteira.
- Meus leads.
- Meu Kanban.
- Veículos disponíveis.
- Minhas propostas.
- Minhas tarefas.
- Minhas vendas.
- Minhas comissões.
- Meu perfil.

Cada vendedor deve visualizar apenas os leads e clientes atribuídos a ele, salvo permissão expressa de acesso compartilhado.

O vendedor poderá cadastrar veículos, respeitando as regras de autorização da loja.

Criar botões para abrir conversas no WhatsApp utilizando links com mensagens personalizadas.

Registrar a intenção de contato no CRM, sem afirmar que a mensagem foi enviada ou lida quando isso não puder ser comprovado.

## 7. Dashboard Comprador

Criar área pessoal com:

- Dados cadastrais.
- Veículos favoritos.
- Buscas salvas.
- Alertas de veículos.
- Histórico de contatos.
- Propostas enviadas.
- Notificações.
- Configurações de privacidade.

O comprador não poderá publicar veículos.

## 8. CRM Kanban

Implementar as seguintes etapas configuráveis:

1. Novo lead.
2. Primeiro contato.
3. Em atendimento.
4. Visita agendada.
5. Negociação.
6. Proposta enviada.
7. Venda concluída.
8. Perdido.

Funcionalidades obrigatórias:

- Arrastar e soltar oportunidades.
- Atribuir responsável.
- Registrar observações.
- Agendar tarefas.
- Registrar histórico de alterações.
- Vincular leads a veículos.
- Filtrar por vendedor, data, origem e etapa.
- Registrar motivo de perda.
- Controlar acesso aos dados conforme o perfil.

Cada lead deverá estar associado à loja, ao veículo de interesse quando conhecido e ao vendedor responsável quando atribuído.

## 9. Cadastro de veículos por placa

Implementar um fluxo rápido:

1. Lojista ou vendedor informa a placa.
2. Backend consulta o provedor veicular autorizado.
3. Sistema preenche os campos disponíveis.
4. Usuário verifica e corrige as informações.
5. Adiciona preço, quilometragem, fotos e descrição.
6. Publica o anúncio conforme regras de moderação.

Não presumir que a BrasilAPI oferece consulta completa por placa.

Criar uma camada de integração desacoplada para permitir diferentes provedores de dados veiculares.

## 10. SEO do marketplace

Cada loja deverá possuir uma página pública com:

- Nome comercial.
- Logotipo.
- Cidade e região.
- Contatos públicos autorizados.
- Catálogo de veículos.
- Página individual para cada veículo.
- Links para compartilhamento.

Implementar URLs amigáveis, sitemap, canonical, metadados e dados estruturados adequados.

Criar arquitetura para SEO local por cidade, marca e modelo.

Evitar páginas vazias, duplicadas ou geradas apenas para manipular resultados de busca.

## 11. Dashboards e indicadores

Os indicadores devem ser calculados com dados reais do Supabase.

Implementar filtros por período, loja e vendedor conforme permissão.

Mostrar:

- Leads recebidos.
- Leads atendidos.
- Tempo até o primeiro atendimento.
- Propostas realizadas.
- Vendas concluídas.
- Taxa de conversão.
- Veículos disponíveis.
- Tempo médio de estoque.
- Origem dos leads.
- Desempenho comercial por vendedor.

Não utilizar números fictícios na aplicação em produção.

Quando não houver dados, mostrar estado vazio apropriado.

## 12. Design e experiência do usuário

Criar uma interface moderna, profissional, rápida e responsiva.

Utilizar o design system e os componentes já presentes no projeto.

Não alterar a identidade visual existente sem necessidade.

Priorizar:

- Sidebar por perfil.
- Dashboard com indicadores.
- Gráficos.
- Tabelas com busca e filtros.
- Formulários com validação.
- Kanban intuitivo.
- Estados de carregamento e erro.
- Confirmações para ações críticas.
- Boa experiência mobile.

## 13. Segurança e testes

Garantir isolamento entre lojistas.

Um lojista nunca poderá acessar dados de outro lojista por manipulação de URL, ID ou requisição à API.

Um vendedor não poderá alterar permissões, preços de assinatura ou dados administrativos.

Testar RLS, elevação indevida de privilégio, compartilhamento de lojas, bloqueios e acessos diretos às rotas.

Testar também condições sem dados, falhas de conexão, concorrência na atribuição de leads e responsividade.

## 14. Método de execução

Executar em etapas:

- [x] **Etapa A:** Auditoria da Fase 1, identificação das tabelas, rotas e componentes reaproveitáveis.
- [x] **Etapa B:** Banco de dados, migrations, permissões e RLS (17 tabelas oficiais `fcs_` + planos e assinaturas).
- [x] **Etapa C:** Layout compartilhado, menus e roteamento por perfil com `DashboardLayout` e transição fluida.
- [x] **Etapa D:** Super Admin (`SuperAdminDashboard.tsx`) e Lojista (`DealerDashboard.tsx`).
- [x] **Etapa E:** Administrador de Loja (`StoreAdminDashboard.tsx`) e Vendedor (`SellerDashboard.tsx`).
- [x] **Etapa F:** Comprador (`BuyerDashboard.tsx`) e CRM Kanban completo (`CrmKanbanBoard.tsx`).
- [x] **Etapa G:** Dashboards, métricas reais, testes unitários automatizados (36/36 passing) e validação de build (`npm run build`).

### Entregáveis Concluídos:
1. **Arquivos criados:**
   - `src/components/dashboard/DashboardLayout.tsx`
   - `src/components/dashboard/SuperAdminDashboard.tsx`
   - `src/components/dashboard/DealerDashboard.tsx`
   - `src/components/dashboard/StoreAdminDashboard.tsx`
   - `src/components/dashboard/SellerDashboard.tsx`
   - `src/components/dashboard/BuyerDashboard.tsx`
   - `src/components/dashboard/CrmKanbanBoard.tsx`
   - `src/services/crmService.ts`
   - `src/types/crm.ts`
   - `src/tests/crmDashboard.test.ts`
   - `supabase/migrations/20261010_crm_phase2.sql`
   - `supabase/migrations/20261010_crm_plans_and_buyer.sql`
2. **Migrations executadas no Supabase:**
   - `20261010_crm_phase2.sql` (17 tabelas oficiais com prefixo `fcs_`, seed do pipeline e RLS).
   - `20261010_crm_plans_and_buyer.sql` (`fcs_plans`, `fcs_subscriptions`, `fcs_buyer_favorites`, `fcs_buyer_searches`).
3. **Funcionalidades operacionais:**
   - 5 Dashboards interativos e operacionais conectados ao Supabase.
   - CRM Kanban com as 8 colunas oficiais, drag and drop, avanço tátil e integração direta com WhatsApp.
   - Alternância de perfil e retorno à vitrine pública na Navbar com 1 clique.
4. **Testes realizados:**
   - 36/36 testes unitários no Vitest aprovados com sucesso.
   - Build de produção validado sem erros de compilação ou tipagem.