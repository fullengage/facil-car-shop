# Mercado Pago — webhooks (Fácil Car Shop)

## Estado atual
A função `supabase/functions/mercadopago-webhook/index.ts` valida HMAC do webhook, consulta o recurso na API oficial com credenciais de produção, exige `collector_id` correto e registra o evento idempotente na tabela `fcs_mp_webhook_events`. **Não libera acesso nem atribui uma loja automaticamente.** É deliberado: os links estáticos `mpago.la` não garantem referência exclusiva ao cadastro da loja.

## Instalação (ambiente de produção)
1. Aplicar a migração `supabase/migrations/20261016_fcs_mp_webhook_events.sql` no projeto correto, via fluxo de migrações da equipe.
2. Configurar secrets de Edge Functions, fora do GitHub: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `MERCADOPAGO_COLLECTOR_ID`. O Supabase fornece `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` ao ambiente.
3. Deploy: `supabase functions deploy mercadopago-webhook --no-verify-jwt`. O webhook é público porque o Mercado Pago não envia JWT Supabase; o HMAC é **obrigatório** no código.
4. Em Mercado Pago > Sua aplicação > Webhooks configurar URL `https://<project-ref>.supabase.co/functions/v1/mercadopago-webhook` e eventos: Pagamentos e Assinaturas (preapproval, authorized payment, plano quando aplicável).
5. Confirmar que o webhook gera eventos 'pending' e que requisições sem HMAC são rejeitadas. Não usar credenciais de teste para pagamentos reais.
6. Antes de ativação automática: criar checkout com `external_reference` gerada pelo backend, vinculá-la a um pedido / loja, conferir valor, moeda, plano, pagamento efetivamente aprovado, vencimento e idempotência; então atualizar a assinatura mediante função transacional no banco e políticas RLS adequadas. Adicionar conciliação periódica.

## Pontos de atenção
- Os 3 links `mpago.la` podem ser links de pagamento avulso, sem renovação. Validar no painel Mercado Pago antes de tratá-los como mensalidades.
- O link Profissional representa checkout de plano, mas ainda não transmite automaticamente o ID interno da loja.
- Nunca passar Access Token ou service_role para React/Vite e nunca registrar esses valores em logs.
- Confirmar semântica do `collector_id` para todos os eventos escolhidos. Se o recurso não oferecer um collector verificável, será rejeitado em vez de ativar indevidamente.
- Tratar webhooks como notificações reentregáveis, não como ordem de ativação.
