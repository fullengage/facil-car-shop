# 🚀 Backend Setup — Servidor Express + Mercado Pago

**Status:** ✅ Implementado  
**Local:** `scripts/api-server.js`  
**Porta:** 3001 (customizável com `PORT`)

---

## 📋 Índice

1. [Setup Rápido](#setup-rápido)
2. [Endpoints](#endpoints)
3. [Teste Local](#teste-local)
4. [Webhook Setup](#webhook-setup)
5. [Deploy](#deploy)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Setup Rápido

### 1. Copiar credenciais para `.env.local`

```bash
# Copiar .env para .env.local
cp .env .env.local

# Editar .env.local e adicionar:
VITE_MERCADO_PAGO_ACCESS_TOKEN=APP_USR_TEST_xxxxx...
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2. Rodar servidor

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run server

# OU ambos em paralelo:
npm run dev:all
```

### 3. Verificar health check

```bash
curl http://localhost:3001/health

# Response:
# {
#   "status": "ok",
#   "timestamp": "2026-10-16T...",
#   "environment": "development"
# }
```

---

## 📡 Endpoints

### **POST `/api/subscriptions/create`**

Criar assinatura no Mercado Pago

**Request:**
```json
{
  "dealerId": "uuid-do-dealer",
  "planId": "uuid-do-plano",
  "payerEmail": "dealer@email.com"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "subscription": {
    "id": "uuid-da-subscription",
    "checkoutUrl": "https://mercadopago.com.br/checkout/...",
    "status": "pending"
  }
}
```

**Response (Erro):**
```json
{
  "error": "Dealer already has an active subscription"
}
```

---

### **POST `/webhooks/mercado-pago`**

Webhook para processar eventos do Mercado Pago

**Mercado Pago enviará:**
```json
{
  "type": "subscription_charge",
  "data": {
    "subscription_id": "sub_123456",
    "charge_id": "charge_789",
    "status": "approved",
    "amount": 99.90
  }
}
```

**Ações:**
- ✅ Cobrança aprovada → Ativa subscription
- ✅ Registra em `fcs_subscription_charges`
- ✅ Atualiza período de renovação
- 📧 TODO: Enviar email de confirmação

**Response:**
```json
{
  "received": true
}
```

---

### **GET `/api/subscriptions/:id`**

Obter status da assinatura

**Request:**
```bash
curl http://localhost:3001/api/subscriptions/uuid-da-subscription
```

**Response:**
```json
{
  "id": "uuid-da-subscription",
  "status": "active",
  "planId": "uuid-do-plano",
  "currentPeriodStart": "2026-10-16T...",
  "currentPeriodEnd": "2026-11-16T...",
  "nextPaymentDate": "2026-11-16T...",
  "lastPaymentDate": "2026-10-16T..."
}
```

---

### **POST `/api/subscriptions/:id/cancel`**

Cancelar assinatura

**Request:**
```bash
curl -X POST http://localhost:3001/api/subscriptions/uuid-da-subscription/cancel
```

**Response:**
```json
{
  "success": true
}
```

---

## 🧪 Teste Local

### 1. Criar assinatura de teste

```bash
# Substituir com IDs reais do BD
curl -X POST http://localhost:3001/api/subscriptions/create \
  -H "Content-Type: application/json" \
  -d '{
    "dealerId": "dealer-id-teste",
    "planId": "plan-id-teste",
    "payerEmail": "teste@email.com"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_...",
    "checkoutUrl": "https://sandbox.mercadopago.com.br/...",
    "status": "pending"
  }
}
```

### 2. Ir para checkout Mercado Pago

Copiar `checkoutUrl` e abrir no navegador

### 3. Usar cartão de teste

Use um dos cartões de teste:

| Cartão | Validade | CVV | Resultado |
|--------|----------|-----|-----------|
| 4111 1111 1111 1111 | 11/25 | 123 | ✅ Aprovado |
| 5555 5555 5555 4444 | 11/25 | 123 | ✅ Aprovado |

### 4. Simular webhook (se não tiver ngrok)

```bash
curl -X POST http://localhost:3001/webhooks/mercado-pago \
  -H "Content-Type: application/json" \
  -d '{
    "type": "subscription_charge",
    "data": {
      "subscription_id": "seu_subscription_id",
      "charge_id": "charge_teste",
      "status": "approved",
      "amount": 99.90
    }
  }'
```

### 5. Verificar se subscription foi ativada

```bash
curl http://localhost:3001/api/subscriptions/seu_subscription_id
```

Deve retornar `status: "active"`

---

## 🔗 Webhook Setup

### Local (Desenvolvimento com ngrok)

```bash
# 1. Instalar ngrok: https://ngrok.com
# 2. Rodar ngrok
ngrok http 3001

# Saída:
# Forwarding: https://xxxx.ngrok.io -> http://localhost:3001

# 3. Registrar webhook em Mercado Pago:
# URL: https://xxxx.ngrok.io/webhooks/mercado-pago
# Eventos: subscription_charge, subscription_cancelled
```

### Produção

```
URL: https://seudominio.com/api/webhooks/mercado-pago
Eventos: subscription_charge, subscription_cancelled, subscription_suspended
```

---

## 🚀 Deploy

### **Vercel Functions** (Recomendado)

Converter para serverless functions:

```typescript
// api/subscriptions/create.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCreateSubscription } from '@/scripts/api-routes'

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  return handleCreateSubscription(req, res)
}
```

### **Heroku** (Alternativa)

```bash
# 1. Criar arquivo Procfile
echo "web: node scripts/api-server.js" > Procfile

# 2. Deploy
git push heroku main
```

### **Servidor próprio** (VPS/EC2)

```bash
# 1. SSH para servidor
ssh user@seu-servidor.com

# 2. Clonar repo
git clone https://github.com/seu-repo/facil-car-shop.git
cd facil-car-shop

# 3. Instalar dependências
npm install --production

# 4. Usar PM2 para manter rodando
npm install -g pm2
pm2 start scripts/api-server.js --name "fcs-api"
pm2 startup
pm2 save

# 5. Setup Nginx reverse proxy
# /etc/nginx/sites-available/fcs-api
server {
    server_name api.seudominio.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🐛 Troubleshooting

### Erro: "Supabase não configurado"

```
❌ Error: Cannot read properties of undefined
```

**Solução:**
```bash
# Verificar variáveis de ambiente
echo $VITE_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Adicionar ao .env.local
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

### Erro: "Mercado Pago access token inválido"

```
❌ invalid access_token
```

**Solução:**
1. Ir para https://www.mercadopago.com.br/developers/pt
2. Copiar novo Access Token (SANDBOX ou PROD)
3. Atualizar em `.env.local`
4. Reiniciar servidor: `npm run server`

---

### Webhook não é recebido

```
📨 POST /webhooks/mercado-pago não recebe requests
```

**Solução:**
1. Verificar ngrok rodando: `ngrok http 3001`
2. Registrar webhook URL em Mercado Pago
3. Testar manual: `curl -X POST https://xxxx.ngrok.io/webhooks/mercado-pago ...`
4. Verificar logs: `npm run server`

---

### Subscription criada mas não aparece em BD

```
Supabase não mostra fcs_subscriptions
```

**Solução:**
1. Verificar RLS: `SELECT * FROM fcs_subscriptions` no console Supabase
2. Verificar SUPABASE_SERVICE_ROLE_KEY (precisa de privilégios)
3. Verificar migração foi executada: `supabase db push`

---

## 📚 Arquivos

```
scripts/api-server.js          ← Servidor Express
docs/BACKEND-SETUP.md          ← Este arquivo
docs/MERCADO-PAGO-SETUP.md     ← Integração MP
src/services/mercadoPagoService.ts  ← Client-side helpers
```

---

## ✅ Checklist

- [ ] `.env.local` configurado com credentials Sandbox
- [ ] `npm install` executado (express, mercadopago, etc)
- [ ] `npm run server` rodando sem erros
- [ ] Health check respondendo: `curl http://localhost:3001/health`
- [ ] Planos criados no Mercado Pago: `node scripts/setup-mercadopago-plans.js`
- [ ] Webhook configurado em MP (se usar Sandbox)
- [ ] Testar criação de assinatura end-to-end
- [ ] Verificar logs: `npm run server`

---

**Próximos passos:**
1. ✅ Backend implementado
2. ⏳ Email de confirmação
3. ⏳ Dashboard de assinaturas (upgrade/downgrade)
4. ⏳ Relatórios de receita

**Status:** 🟢 **Pronto para testar**
