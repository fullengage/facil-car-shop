# Dashboards por perfil — especificação

Este documento é a especificação de cada painel. Cada ação tem tela, dado, permissão e situação.

**Legenda de situação**
- `PRONTO` — funciona hoje com dados reais.
- `TELA` — dá para construir agora; grava só quando o banco estiver pronto (aparece desativado até lá).
- `BANCO` — depende de tabela, coluna ou política RLS que o Gemini precisa aplicar.
- `DECISÃO` — depende de uma escolha de negócio ou de fornecedor.

Regra geral: nenhum número é inventado. Sem dado, a tela mostra "sem dados ainda", não zero.

---

## 0. Hierarquia e permissões

| Perfil | Escopo | Pode escrever | Não pode |
|---|---|---|---|
| Super Admin | Plataforma | Tudo | — |
| Lojista | Todas as lojas da revenda | Lojas, equipe, plano da revenda, mensagens da revenda | Dados de outra revenda, planos da plataforma |
| Admin da loja | Uma loja | Veículos, leads e equipe da loja | Plano, cobrança, outras lojas |
| Vendedor da loja | Leads atribuídos e veículos da loja (leitura) | Contatos, etapas e propostas dos próprios leads | Excluir veículo, ver comissão de colegas |
| Vendedor autônomo | Próprios anúncios e leads | Próprios anúncios e contatos | Lojas de terceiros, equipe |
| Comprador | Próprios favoritos, alertas e conversas | Favoritos, alertas, mensagens | Dados de outros usuários |

Todo bloqueio (usuário, loja, veículo) tem **motivo obrigatório** e fica registrado em auditoria.

---

## 1. Super Admin — plataforma e receita

**Pergunta:** a plataforma está saudável e o que precisa da minha decisão hoje?

### 1.1 Indicadores (topo)
| Indicador | Fonte | Situação |
|---|---|---|
| MRR (receita recorrente do mês) | `fcs_subscriptions` + `fcs_plans` | BANCO |
| Revendas ativas / em trial / pendentes | `fcs_dealers.status`, `subscription_status` | BANCO |
| Cadastros novos na semana | `fcs_dealers.created_at` | BANCO |
| Churn do mês | assinaturas canceladas | BANCO |
| Veículos publicados na plataforma | `fcs_vehicles` | BANCO |

### 1.2 Ações

**A. Aprovar ou rejeitar revenda** — `PRONTO` no código (`updateDealerStatus`). Tela: fila de pendentes.
- Aceite: aprovar muda `status` para `active`; rejeitar pede motivo; ambos geram registro na auditoria.

**B. Criar, editar e arquivar planos** — `BANCO` + `TELA`.
- Campos: nome, preço mensal, limite de veículos, limite de lojas, limite de vendedores, recursos (destaque incluído, relatório).
- Regra: plano arquivado some para novas assinaturas, mas as ativas continuam até a renovação.
- Tabela: `fcs_plans`. Escrita só super admin.
- Aceite: criar plano novo aparece na escolha de plano da revenda; preço alterado não muda assinatura ativa sem aviso.

**C. Criar e gerir cupons de desconto** — `BANCO` + `TELA`.
- Campos: código, tipo (percentual ou valor fixo), validade, limite de usos, planos aplicáveis, primeira cobrança ou recorrente.
- Tabelas novas: `fcs_coupons` e `fcs_coupon_redemptions`.
- Aceite: cupom expirado ou sem usos é recusado no checkout; cada uso fica registrado com a revenda.

**D. Promoção segmentada para lojistas** — `BANCO` + `TELA`.
- Campanha: título, mensagem, cupom opcional, segmento (ex.: revendas no plano básico, sem loja cadastrada, em trial).
- Canal: aviso no painel do lojista e e-mail (WhatsApp só com opt-in, ver seção 7).
- Tabelas novas: `fcs_campaigns`, `fcs_campaign_targets`.
- Aceite: a contagem de alcance é mostrada antes do envio.

**E. Bloquear e desbloquear** — `BANCO` + `TELA`.
- Alvos: usuário, revenda, loja, veículo. Cada um com status próprio e motivo.
- Efeito: revenda suspensa não cria veículos nem lê leads novos; loja suspensa sai da vitrine; veículo bloqueado sai da vitrine e do pátio público; usuário bloqueado não entra.
- Tabelas: `fcs_dealers.status`, `fcs_stores.status`, `fcs_vehicles.status` (incluir `blocked`), `fcs_profiles.status`.
- Aceite: bloquear loja tira todos os anúncios dela da vitrine no próximo carregamento.

**F. Mensagens internas para lojistas** — `BANCO` + `TELA`.
- Caixa de envio para uma revenda, para um grupo (plano, status) ou para todos.
- Lojista lê no painel e marca como lida. Respostas ficam na mesma conversa.
- Tabelas novas: `fcs_messages`, `fcs_message_recipients`.
- Aceite: super admin vê quem leu e quem não leu.

**G. Cobranças** — `DECISÃO` (gateway) + `BANCO` + `TELA`.
- Ações: gerar cobrança avulsa (ex.: implantação), reenviar cobrança, marcar pago manualmente, ver inadimplência.
- Depende de escolher o gateway (Asaas, Mercado Pago, Stripe ou outro). Sem gateway, a tela só registra cobrança manual.
- Tabela: `fcs_invoices`, com webhook do gateway para atualizar o status.
- Aceite: cobrança paga atualiza a assinatura sem intervenção manual.

**H. Editor da vitrine (home)** — `BANCO` + `TELA`.
- Edita: título e subtítulo do hero, números dos contadores (ou modo automático), faixas de marcas, FAQ, planos exibidos, textos de rodapé.
- Modo "sem dados": esconde contadores até ter volume.
- Tabela: `fcs_site_settings` (chave e valor JSON), leitura pública, escrita só super admin.
- Aceite: alterar um texto aparece na home sem deploy.

**I. Destaques (lojas e produtos)** — `BANCO` + `TELA`.
- Marca uma loja ou um veículo como destaque, com ordem, data de início e fim, e posição (home, listagem, categoria).
- Regra de quem paga está em DECISÃO (seção 7).
- Campos: `fcs_featured_items` (tipo, id, posição, ordem, início, fim).
- Aceite: destaque expirado sai sozinho; vitrine ordena pelo destaque e depois pela regra atual.

**J. Auditoria** — `BANCO` + `TELA`.
- Lista de alterações sensíveis: status de revenda, plano, cupom, bloqueio, CPF, exclusão. Filtro por usuário e período.
- Tabela: `fcs_audit_logs`. CPF nunca entra no registro.

### 1.3 Critérios gerais do Super Admin
- Toda ação de escrita gera registro em auditoria.
- Nenhuma ação de escrita funciona antes da migração de segurança do Gemini.

---

## 2. Lojista — rede de lojas

**Pergunta:** como está minha rede e onde preciso agir?

### 2.1 Indicadores
Veículos em estoque (rede) · valor do estoque · vendas do mês · leads sem contato · parados (≥ 60 dias) · uso do plano (veículos e lojas).

### 2.2 Ações
**A. Ver e trocar de loja** — `PRONTO` (pátio). Seletor no topo: "Todas as lojas" ou uma loja.

**B. Criar loja** — `BANCO` + `TELA`. Campos: nome, endereço, telefone, WhatsApp, horário. Respeita limite de lojas do plano.

**C. Convidar e gerir equipe** — `BANCO` + `TELA`.
- Convidar admin da loja ou vendedor por e-mail, escolher a loja.
- Suspender ou remover vínculo (não apaga histórico de leads).
- Respeita limite de vendedores do plano.

**D. Trocar ou ver plano da revenda** — `BANCO` + `TELA`. Ver plano atual e uso. Pedir upgrade gera cobrança (ver G do super admin).

**E. Ler mensagens da plataforma** — `BANCO` + `TELA`. Caixa de entrada com avisos do super admin, marcada como lida.

**F. Aplicar cupom** — `BANCO` + `TELA`. Campo de cupom no checkout de plano.

**G. Ver desempenho por loja** — `BANCO`. Vendas e leads por loja, mês a mês.

### 2.3 Critérios
- Lojista vê só a própria revenda. Não vê leads de outra revenda.

---

## 3. Admin da loja — unidade e showroom

**Pergunta:** o que essa loja precisa fazer hoje?

### 3.1 Indicadores
Veículos em estoque · parados (≥ 60 dias) · leads novos hoje · leads sem primeiro contato · propostas em aberto · vendas do mês.

### 3.2 Ações
**A. Lista "Hoje"** — `TELA` (depende de leads). Ordem: leads sem contato há mais de 2 h, propostas vencendo, veículos parados.

**B. Pátio da loja** — `PRONTO`. Filtros, busca, alerta de parado. Falta: editar e arquivar veículo direto da linha (`TELA`).

**C. Cadastrar e editar veículo** — `PRONTO` (wizard existente). Respeita limite de veículos do plano; se atingido, mostra o motivo e o caminho de upgrade.

**D. Distribuir leads** — `BANCO` + `TELA`.
- Fila de leads novos. Sugestão de vendedor pelo rodízio. Atribuição manual.
- Regra do rodízio: ver seção 7.

**E. Gerir vendedores da loja** — `BANCO` + `TELA`. Convidar, suspender, ver leads atendidos e comissão do período.

**F. Responder propostas** — `BANCO` + `TELA`. Aceitar, recusar ou contrapor. Registra cada movimento.

**G. Bloquear veículo da própria loja** — `BANCO` + `TELA`. Tira da vitrine sem excluir.

### 3.3 Critérios
- Admin não altera plano, cobrança nem outra loja.
- Ao excluir ou arquivar veículo, o histórico de leads permanece.

---

## 4. Vendedor da loja — CRM de bolso

**Pergunta:** quem eu atendo agora e quanto já ganhei?

### 4.1 Indicadores
Leads atribuídos · leads sem contato · propostas abertas · vendas do mês · comissão do mês · meta do mês.

### 4.2 Ações
**A. Kanban de leads** — `BANCO` (leads e etapas). Colunas por etapa. Arrastar muda a etapa e registra o evento.

**B. Registrar contato** — `BANCO` + `TELA`. Ligação, WhatsApp, visita. Atualiza último contato e tempo de resposta.

**C. Enviar WhatsApp com o carro** — `PRONTO` (link de WhatsApp). Mensagem pronta com o anúncio.

**D. Criar proposta** — `BANCO` + `TELA`. Valor, validade, observação.

**E. Próximas ações** — `BANCO` + `TELA`. Tarefas com horário (ligar, retornar, visita).

**F. Catálogo para enviar** — `TELA`. Escolhe carros da loja, gera um link único e envia pelo WhatsApp. Usa os veículos publicados da loja (já existem).

**G. Minhas comissões** — `BANCO`. Vendas fechadas e comissão por venda, com total do período.

**H. Ranking da loja** — `BANCO`. Posição por leads atendidos e vendas. Não mostra comissão de colegas.

### 4.3 Critérios
- Vendedor não exclui carro e não exporta a base.

---

## 5. Vendedor autônomo — pessoa física

**Pergunta:** quem se interessou pelo meu carro e o que eu preciso responder?

### 5.1 Indicadores
Anúncios ativos · leads no mês · mensagens sem resposta · visitas da página de perfil.

### 5.2 Ações
**A. Cadastrar anúncio** — `PRONTO` (wizard existente, com placa). Exige CPF no perfil.

**B. Caixa de leads** — `BANCO` + `TELA`. Interessados por anúncio, com WhatsApp direto.

**C. Minha página** — `TELA`. Perfil público com nome, foto, contato e anúncios.

**D. Abrir loja** — `BANCO` + `TELA`. Converte a conta em lojista sem perder anúncios e histórico.

### 5.3 Critérios
- CPF obrigatório e nunca exibido publicamente.
- Sem acesso a equipe, plano ou lojas de terceiros.

---

## 6. Comprador — favoritos e alertas

**Pergunta:** o que eu salvei e o que apareceu de novo para mim?

### 6.1 Ações
**A. Favoritar veículo** — `BANCO` (`fcs_buyer_favorites`). Já existe a função; falta o botão na vitrine.

**B. Ver favoritos com variação de preço** — `BANCO` + `TELA`. Mostra preço atual e o preço quando salvou.

**C. Alertas de busca** — `BANCO` + `TELA`. Salvar busca (ex.: Corolla até R$ 120 mil em Campinas); aviso quando surgir anúncio novo. Aviso por e-mail ou painel.

**D. Conversas com lojas** — `TELA`. Histórico de contatos e atalho para o WhatsApp.

**E. Propostas enviadas** — `BANCO` + `TELA`. Status de cada proposta.

### 6.2 Critérios
- Comprador não vê pátio, leads nem dados de outros usuários.

---

## 7. Regras de negócio em aberto

| Tema | Proposta | Situação |
|---|---|---|
| Rodízio de leads | Lead sem vendedor entra no próximo da fila. Vendedor que não responde em 2 h volta para a fila. | DECISÃO (confirmar prazo) |
| Comissão | Percentual por venda; valor fixo como opção. | DECISÃO (padrão: percentual) |
| Gateway de cobrança | A escolher: Asaas, Mercado Pago ou Stripe. | DECISÃO |
| Quem paga o destaque | Destaque incluído no plano; extra cobrado à parte. | DECISÃO |
| Canal de promoção | Painel + e-mail; WhatsApp só com opt-in. | DECISÃO |
| Prazo de parado | 60 dias de estoque. | Padrão adotado; ajustável por loja |

---

## 8. Ordem de implementação

| Ordem | Entrega | Depende de |
|---|---|---|
| 1 | Super Admin: planos, bloqueios e destaques (telas) | Migração de segurança do Gemini (para gravar) |
| 2 | Super Admin: mensagens internas e editor da vitrine | Migração |
| 3 | Lojista: caixa de mensagens e equipe | Migração e itens 1 e 2 |
| 4 | Vendedor da loja: Kanban, contatos e propostas | Leads e atribuição no banco |
| 5 | Admin da loja: distribuição de leads e Hoje | Item 4 |
| 6 | Super Admin: cupons, campanhas e cobranças | Gateway (DECISÃO) |
| 7 | Vendedor autônomo e Comprador | Login, CPF e favoritos no banco |

---

## 9. Estado atual (resumo)

- **Funciona hoje:** pátio com alerta de parado (Lojista e Admin); vitrine pública com proposta e cadastro de revenda (aguardando a migração); aprovar e suspender revenda.
- **Falta tela:** planos, cupons, campanhas, bloqueios, mensagens, editor da vitrine, destaques, cobranças.
- **Falta banco:** quase tudo acima. Ver `supabase/migrations/HANDOFF_GEMINI.md`.
- **Falta decisão:** seção 7.
