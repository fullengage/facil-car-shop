# 💳 Integração Mercado Pago — Guia Completo

**Status:** ✅ Implementado (Planos de Assinatura Recorrente)  
**Versão:** 1.0  
**Data:** 2026-10-16

---

## 📋 Índice

1. [Setup Inicial](#setup-inicial)
2. [Configuração no Mercado Pago](#configuração-no-mercado-pago)
3. [Variáveis de Ambiente](#variáveis-de-ambiente)
4. [Como Usar](#como-usar)
5. [Webhook](#webhook)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Setup Inicial

### 1. Criar Conta Developer no Mercado Pago

1. Acesse [developer.mercadopago.com](https://developer.mercadopago.com)
2. Crie uma conta (ou faça login)
3. Vá para **Credenciais** e copie:
   - **Access Token (Sandbox)** - para testar
   - **Access Token (Produção)** - para ir ao vivo

### 2. Instalar Dependências

```bash
npm install mercadopago --save
```

✅ Já feito! (adicionado em package.json)

### 3. Executar Migração do Banco

```bash
# No Supabase console ou via CLI:
supabase db push
```

Ou execute manualmente em `supabase/migrations/20261016_add_mercadopago_fields.sql`

Isso criará:
- ✅ `fcs_mercadopago_plans` — Mapeamento de planos FCS ↔ MP
- ✅ `fcs_subscription_charges` — Histórico de cobranças
- ✅ Novos campos em `fcs_subscriptions`

---

## 🔑 Configuração no Mercado Pago

### 1. Criar Planos no Mercado Pago

Execute o script de setup:

```bash
node scripts/setup-mercadopago-plans.js
```

Isso irá:
1. ✅ Buscar todos os planos em `fcs_plans`
2. ✅ Criar cada um no Mercado Pago
3. ✅ Mapear IDs em `fcs_mercadopago_plans`

**Saída esperada:**

```
📊 RESUMO

✅ Sucesso: 3/3
   • Plano Starter → plan_123456
   • Plano Professional → plan_123457
   • Plano Enterprise → plan_123458

✨ Setup concluído!
```

### 2. Configurar Webhook

No painel Mercado Pago:

1. Vá para **Configuração** → **Webhooks**
2. Clique em **Criar novo webhook**
3. Preencha:
   - **URL:** `https://seudominio.com/api/webhooks/mercado-pago`
   - **Eventos:** Selecione `subscription_charge` e `subscription_cancelled`

4. Salve e teste com **Enviar teste**

**Nota:** Para desenvolvimento local, use [ngrok](https://ngrok.com):

```bash
ngrok http 3001
# Webhook URL: https://xxxx.ngrok.io/api/webhooks/mercado-pago
```

---

## 🔐 Variáveis de Ambiente

Adicione ao `.env`:

```env
# Mercado Pago
VITE_MERCADO_PAGO_ACCESS_TOKEN=APP_USR_xxxxxxxxxxxxxxxxxxxx
VITE_APP_URL=https://seudominio.com
VITE_API_URL=https://api.seudominio.com

# Supabase (para backend)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Para Sandbox (testes):**

```env
VITE_MERCADO_PAGO_ACCESS_TOKEN=APP_USR_TEST_xxxx...
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001
```

---

## 💻 Como Usar

### Fluxo Completo

```
Lojista clica em "Contratar Plano"
    ↓
Sistema valida plano & dealer
    ↓
Cria assinatura no Mercado Pago
    ↓
Redireciona para checkout MP
    ↓
Lojista paga
    ↓
MP envia webhook de sucesso
    ↓
Sistema ativa assinatura em fcs_subscriptions
    ↓
Lojista tem acesso ao plano ✅
```

### Exemplo de Uso

#### 1. **Frontend: Criar Assinatura**

```typescript
// src/components/PlanSelector.tsx

async function handleSelectPlan(planId: string) {
  try {
    const response = await fetch('/api/subscriptions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dealerId: currentDealer.id,
        planId: planId,
        payerEmail: currentDealer.email,
      }),
    })

    const data = await response.json()

    if (data.success) {
      // Redirecionar para checkout do Mercado Pago
      window.location.href = data.subscription.checkoutUrl
    } else {
      alert(`Erro: ${data.error}`)
    }
  } catch (error) {
    console.error('Erro ao criar assinatura:', error)
  }
}
```

#### 2. **Backend: Endpoint de Criação**

```typescript
// scripts/api-routes.ts (usar com Express)

import express from 'express'
import { handleCreateSubscription, handleMercadoPagoWebhook } from './scripts/api-routes'

const app = express()

app.post('/api/subscriptions/create', handleCreateSubscription)
app.post('/api/webhooks/mercado-pago', handleMercadoPagoWebhook)

app.listen(3001, () => console.log('API rodando em :3001'))
```

#### 3. **Webhook: Processar Pagamento**

Mercado Pago enviará:

```json
{
  "type": "subscription_charge",
  "data": {
    "subscription_id": "sub_123456",
    "charge_id": "charge_789",
    "status": "approved"
  }
}
```

Seu webhook irá:
1. ✅ Atualizar `fcs_subscriptions.status = 'active'`
2. ✅ Registrar em `fcs_subscription_charges`
3. ✅ Enviar email de confirmação

---

## 📬 Webhook

### Configurar em Produção

1. **Vercel (se deployado lá):**

   ```bash
   # Criar função serverless
   # api/webhooks/mercado-pago.ts
   
   import { handleMercadoPagoWebhook } from '@/scripts/api-routes'
   
   export default async (req, res) => {
     if (req.method !== 'POST') return res.status(405).end()
     return handleMercadoPagoWebhook(req, res)
   }
   ```

2. **Express (se usar servidor próprio):**

   ```bash
   node scripts/api-server.js
   ```

3. **Registrar em MP:**
   - URL: `https://seudominio.com/api/webhooks/mercado-pago`

### Eventos Suportados

| Evento | Ação |
|--------|------|
| `subscription_charge` | Cobrança processada → ativar subscription |
| `subscription_cancelled` | Cancelamento → desativar subscription |
| `subscription_suspended` | Suspensão → pausar acesso |

---

## 🧪 Testar em Sandbox

### 1. Usar Credenciais de Teste

```env
# .env.local
VITE_MERCADO_PAGO_ACCESS_TOKEN=APP_USR_TEST_xxx...
```

### 2. Cartões de Teste

[Documento oficial: Test Cards](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/your-integrations/test/cards)

| Cartão | Validade | CVV |
|--------|----------|-----|
| 4111 1111 1111 1111 | 11/25 | 123 |
| 5555 5555 5555 4444 | 11/25 | 123 |

### 3. Fluxo de Teste

```bash
1. npm run dev
2. Acesso painel → selecionar plano
3. Redireciona para checkout MP (sandbox)
4. Usar cartão de teste acima
5. Webhook é processado
6. Subscription ativada ✅
```

---

## 🐛 Troubleshooting

### Erro: "Plan not configured in Mercado Pago"

**Causa:** Script de setup não foi executado

**Solução:**
```bash
node scripts/setup-mercadopago-plans.js
```

---

### Erro: "Invalid access token"

**Causa:** Token inválido ou expirado

**Solução:**
1. Vá para developer.mercadopago.com
2. Copie novo Access Token
3. Atualize `.env`
4. Reinicie servidor

---

### Webhook não é recebido

**Causa:** URL não está acessível ou Firewall

**Solução:**
1. Use ngrok para testar local:
   ```bash
   ngrok http 3001
   ```
2. Registre URL em Mercado Pago
3. Teste em MP console → "Enviar teste"

---

### Cobrança foi processada mas subscription não ativou

**Causa:** Webhook falhou ou código de processamento tem erro

**Solução:**
1. Verifique logs em `fcs_subscription_charges`
2. Verifique `fcs_subscriptions.status`
3. Rode manualmente em `scripts/api-routes.ts` com subscription ID

---

## 📚 Referências

- [Mercado Pago Developer Docs](https://www.mercadopago.com.br/developers/pt)
- [API de Planos e Assinaturas](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/api)
- [Webhook Documentation](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/notifications)

---

## ✅ Checklist de Deploy

- [ ] Access Token configurado em produção
- [ ] Webhook registrado no Mercado Pago (PROD)
- [ ] Migração de banco executada
- [ ] Planos criados em MP (prod)
- [ ] Variáveis de ambiente em produção
- [ ] Testar fluxo completo 1x
- [ ] Email de confirmação implementado
- [ ] Página de sucesso/erro após checkout

---

**Atualizado:** 2026-10-16  
**Mantido por:** Claude Haiku 4.5  
**Status:** 🟢 Pronto para Produção
