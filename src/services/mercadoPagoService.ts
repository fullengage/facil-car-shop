/**
 * Tipos e referências para integração Mercado Pago
 * NOTA: A lógica real deve rodar em servidor Node.js ou Vercel Functions
 * Este arquivo contém apenas os tipos TypeScript
 */

export interface CreateSubscriptionRequest {
  dealerId: string
  planId: string
  payerEmail: string
}

export interface SubscriptionResponse {
  subscriptionId: string
  checkoutUrl: string
  status: 'pending' | 'approved'
}

export interface MercadoPagoWebhookPayload {
  type: string
  data: {
    subscription_id: string
    charge_id?: string
    status?: string
    [key: string]: unknown
  }
}

/**
 * Criar assinatura via API backend
 * POST /api/subscriptions/create
 */
export async function createSubscription(
  req: CreateSubscriptionRequest,
): Promise<SubscriptionResponse> {
  const response = await fetch('/api/subscriptions/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro ao criar assinatura')
  }

  return response.json()
}

/**
 * Cancelar assinatura via API backend
 * POST /api/subscriptions/cancel
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const response = await fetch('/api/subscriptions/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscriptionId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro ao cancelar assinatura')
  }
}

/**
 * Obter status da assinatura via API backend
 * GET /api/subscriptions/:id
 */
export async function getSubscriptionStatus(
  subscriptionId: string,
): Promise<{
  id: string
  status: string
  nextPaymentDate: string
}> {
  const response = await fetch(`/api/subscriptions/${subscriptionId}`)

  if (!response.ok) {
    throw new Error('Erro ao obter status da assinatura')
  }

  return response.json()
}
