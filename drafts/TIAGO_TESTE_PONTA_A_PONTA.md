# Teste de ponta a ponta — Classificados de Tiago

Data de preparação: 2026-10-11
Origem: captura de tela do Facebook Marketplace fornecida pelo usuário.

## Identidade
- Nome de vitrine exibido: Classificados de Tiago
- Cidade: Novo Horizonte/SP
- Estado do perfil: **DEMONSTRAÇÃO / NÃO AUTORIZADO**
- CPF/CNPJ, proprietário legal, e-mail, celular e autorização: **NÃO FORNECIDOS**
- Não assumir que o perfil do Facebook comprova poderes para criar uma conta em nome de Tiago.

## Plano proposto
- Básico, até 10 veículos, R$ 59,90/mês (valor da interface, ainda sujeito à conferência com banco).
- Estoque identificado na captura: 7 carros; restam 3 vagas.
- Situação de faturamento: 0 pedidos reais, 0 pagamentos confirmados, 0 assinaturas ativas.

## Implementado no PR
1. Dados dos sete veículos em `drafts/tiago-marketplace-2026-10-11.json`.
2. Rota de demonstração `/previews/classificados-de-tiago`, no componente `src/pages/site/TiagoDemoPage.tsx`.
3. Cartões e ficha de conferência para cada carro; campos ausentes marcados como não confirmados.
4. Escolha simulada do Plano Básico e checkout explicitamente **não financeiro**.

## Ainda não realizado (bloqueadores de produção)
- Consentimento/autoridade do anunciante para publicar e reutilizar imagens.
- Criação de usuário/autenticação real e associação da empresa no Supabase.
- 7 inserções verdadeiras em `fcs_vehicles`; publicar somente após autorização.
- Fluxo de pedido real, PIX e confirmação bancária humana.
- Integração entre dados do Supabase e marketplace público.
- Teste de RLS para isolamento de lojas e segurança da visibilidade pública.
- Build e testes automatizados da branch.

## Critério de aceite para o teste real
1. Registrar titular autorizado em conta própria ou convite de aceitação.
2. Provisionar loja em estado pendente, sem fingir aceite, cobrança ou parceria.
3. Importar carros autorizados com fotos licenciadas, versões e detalhes confirmados.
4. Selecionar plano no backend, gerar pedido pendente e apresentar chave PIX oficial em checkout autenticado.
5. Ativar apenas após crédito no extrato e aprovação administrativa.
6. Publicar anúncios nas duas vitrines a partir de dados reais; validar isolamento entre dois lojistas.

**Não usar a prévia como anúncio público de parceria antes de aprovação.**
