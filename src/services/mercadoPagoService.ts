/**
 * Serviço de Mercado Pago para Planos de Assinatura Recorrente
 * Integração com fcs_subscriptions e fcs_plans
 */

import { MercadoPago } from 'mercadopago'

const client = new MercadoPago({
  accessToken: process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN,
})

export interface CreatePlanRequest {
  planId: string // fcs_plans.id
  name: string // "Plano Starter"
  description: string
  priceMonthly: number
  billingCycle: 'monthly' | 'yearly'
}

export interface CreateSubscriptionRequest {
  dealerId: string // fcs_dealers.id
  planId: string // fcs_plans.id
  payerEmail: string
  payerId?: string // Mercado Pago payer ID (opcional, para usuários retornados)
}

export interface MercadoPagoPlan {
  id: string // MP plan ID
  fcsId: string // fcs_plans.id
  name: string
  price: number
  frequency: number // 1 = monthly, 12 = yearly
  status: 'active' | 'inactive'
}

/**
 * 1. Criar plano no Mercado Pago (executar uma vez por plano)
 * Retorna o ID do plano MP para usar em subscriptions
 */
export async function createMercadoPagoPlan(
  req: CreatePlanRequest,
): Promise<MercadoPagoPlan> {
  try {
    const frequency = req.billingCycle === 'yearly' ? 12 : 1
    const intervalCount = req.billingCycle === 'yearly' ? 1 : 1

    const planData = {
      back_url: `${process.env.VITE_APP_URL}/painel/assinatura/sucesso`,
      reason: req.name,
      auto_recurring: {
        frequency: frequency,
        frequency_type: 'months',
        repetitions: 0, // Infinito
      },
      charges_metadata: {
        fcs_plan_id: req.planId,
      },
      currency_id: 'BRL',
      description: req.description,
      invoice_limit: 12, // Máximo 12 cobranças antes de cancelar
      items: [
        {
          id: `fcs_${req.planId}`,
          title: req.name,
          description: req.description,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: req.priceMonthly,
        },
      ],
    }

    // @ts-ignore - SDK type definitions podem variar
    const response = await client.plans.create(planData)

    console.log(`✅ Plano MP criado: ${response.id} para ${req.name}`)

    return {
      id: response.id,
      fcsId: req.planId,
      name: req.name,
      price: req.priceMonthly,
      frequency: frequency,
      status: 'active',
    }
  } catch (error) {
    console.error('❌ Erro ao criar plano MP:', error)
    throw new Error(`Erro ao criar plano no Mercado Pago: ${error instanceof Error ? error.message : 'desconhecido'}`)
  }
}

/**
 * 2. Criar assinatura para um lojista
 * Retorna URL de checkout ou subscription ID
 */
export async function createSubscription(
  req: CreateSubscriptionRequest,
  mpPlanId: string, // ID retornado de createMercadoPagoPlan
): Promise<{
  subscriptionId: string
  checkoutUrl: string
  status: 'pending' | 'approved'
}> {
  try {
    const subscriptionData = {
      plan_id: mpPlanId,
      payer: {
        email: req.payerEmail,
        identification: {
          type: 'CPF', // ou CNPJ
          // number: '12345678900', // Opcional: adicionar se tiver
        },
      },
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
      },
      back_urls: {
        success: `${process.env.VITE_APP_URL}/painel/assinatura/sucesso?dealer=${req.dealerId}`,
        failure: `${process.env.VITE_APP_URL}/painel/assinatura/erro?dealer=${req.dealerId}`,
        pending: `${process.env.VITE_APP_URL}/painel/assinatura/pendente?dealer=${req.dealerId}`,
      },
      notification_url: `${process.env.VITE_API_URL}/webhooks/mercado-pago`,
      external_reference: `${req.dealerId}|${req.planId}`, // Para rastrear no webhook
      reason: `Assinatura do Plano - Fácil Car Shop`,
      metadata: {
        dealer_id: req.dealerId,
        fcs_plan_id: req.planId,
      },
    }

    // @ts-ignore
    const response = await client.subscriptions.create(subscriptionData)

    console.log(`✅ Assinatura criada: ${response.id} para dealer ${req.dealerId}`)

    return {
      subscriptionId: response.id,
      checkoutUrl: response.init_point, // URL de checkout
      status: response.status || 'pending',
    }
  } catch (error) {
    console.error('❌ Erro ao criar assinatura:', error)
    throw new Error(
      `Erro ao criar assinatura: ${error instanceof Error ? error.message : 'desconhecido'}`,
    )
  }
}

/**
 * 3. Cancelar assinatura
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  try {
    // @ts-ignore
    await client.subscriptions.update(subscriptionId, {
      status: 'cancelled',
    })
    console.log(`✅ Assinatura ${subscriptionId} cancelada`)
  } catch (error) {
    console.error('❌ Erro ao cancelar assinatura:', error)
    throw new Error(
      `Erro ao cancelar assinatura: ${error instanceof Error ? error.message : 'desconhecido'}`,
    )
  }
}

/**
 * 4. Obter status da assinatura
 */
export async function getSubscriptionStatus(subscriptionId: string): Promise<{
  id: string
  status: string
  nextPaymentDate: string
  lastCharge: {
    id: string
    status: string
    amount: number
    date: string
  } | null
}> {
  try {
    // @ts-ignore
    const subscription = await client.subscriptions.get(subscriptionId)

    return {
      id: subscription.id,
      status: subscription.status,
      nextPaymentDate: subscription.next_payment_date,
      lastCharge: subscription.last_charge
        ? {
            id: subscription.last_charge.id,
            status: subscription.last_charge.status,
            amount: subscription.last_charge.amount,
            date: subscription.last_charge.date_created,
          }
        : null,
    }
  } catch (error) {
    console.error('❌ Erro ao obter status da assinatura:', error)
    throw new Error(
      `Erro ao obter assinatura: ${error instanceof Error ? error.message : 'desconhecido'}`,
    )
  }
}

/**
 * 5. Processar webhook do Mercado Pago
 * Chamado quando cobranças são processadas
 */
export interface MercadoPagoWebhookPayload {
  type: string // 'subscription_charge' | 'subscription_cancelled' etc
  data: {
    subscription_id: string
    charge_id?: string
    status?: string
    [key: string]: unknown
  }
}

export async function processMercadoPagoWebhook(
  payload: MercadoPagoWebhookPayload,
): Promise<{
  processed: boolean
  subscriptionId: string
  action: string
}> {
  const { type, data } = payload
  const subscriptionId = data.subscription_id

  console.log(`📨 Webhook MP recebido: ${type} para subscription ${subscriptionId}`)

  // Tipos de webhook relevantes
  if (type === 'subscription_charge') {
    // Cobrança processada com sucesso
    const chargeStatus = data.status || 'approved'
    console.log(`💳 Cobrança processada: ${data.charge_id} (${chargeStatus})`)

    // TODO: Aqui você deve:
    // 1. Atualizar fcs_subscriptions.status = 'active'
    // 2. Registrar em fcs_contact_events se necessário
    // 3. Enviar email de confirmação

    return {
      processed: true,
      subscriptionId,
      action: 'charge_processed',
    }
  }

  if (type === 'subscription_cancelled') {
    console.log(`❌ Assinatura cancelada: ${subscriptionId}`)

    // TODO: Atualizar fcs_subscriptions.status = 'cancelled'

    return {
      processed: true,
      subscriptionId,
      action: 'subscription_cancelled',
    }
  }

  console.warn(`⚠️ Webhook desconhecido: ${type}`)
  return {
    processed: false,
    subscriptionId,
    action: 'unknown',
  }
}

export default client
