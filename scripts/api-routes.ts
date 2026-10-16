/**
 * Rotas de API para Mercado Pago
 * Usar com Express.js ou Vercel API Routes
 *
 * Exemplo com Express:
 * ```
 * import express from 'express'
 * import { handleMercadoPagoWebhook, handleCreateSubscription } from './api-routes'
 *
 * const router = express.Router()
 * router.post('/webhooks/mercado-pago', handleMercadoPagoWebhook)
 * router.post('/subscriptions/create', handleCreateSubscription)
 * app.use('/api', router)
 * ```
 */

import { createClient } from '@supabase/supabase-js'
import {
  createSubscription,
  processMercadoPagoWebhook,
  type MercadoPagoWebhookPayload,
} from '../src/services/mercadoPagoService'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '', // Use service role for backend
)

/**
 * POST /api/subscriptions/create
 * Criar nova assinatura no Mercado Pago
 *
 * Body:
 * {
 *   dealerId: string
 *   planId: string
 *   payerEmail: string
 * }
 */
export async function handleCreateSubscription(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { dealerId, planId, payerEmail } = req.body

    // Validações
    if (!dealerId || !planId || !payerEmail) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // 1. Verificar se dealer existe
    const { data: dealer, error: dealerError } = await supabase
      .from('fcs_dealers')
      .select('id, email')
      .eq('id', dealerId)
      .single()

    if (dealerError || !dealer) {
      return res.status(404).json({ error: 'Dealer not found' })
    }

    // 2. Verificar se plano existe
    const { data: plan, error: planError } = await supabase
      .from('fcs_plans')
      .select('id, name, description, price_monthly')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan not found' })
    }

    // 3. Verificar se já tem assinatura ativa
    const { data: existingSubscription } = await supabase
      .from('fcs_subscriptions')
      .select('id, status')
      .eq('dealer_id', dealerId)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      return res.status(409).json({
        error: 'Dealer already has an active subscription',
        subscription: existingSubscription,
      })
    }

    // 4. Obter plano do Mercado Pago (salvado quando criamos o plano)
    const { data: mpPlanMapping, error: mpError } = await supabase
      .from('fcs_mercadopago_plans')
      .select('mercadopago_plan_id')
      .eq('fcs_plan_id', planId)
      .single()

    if (mpError || !mpPlanMapping) {
      return res.status(400).json({
        error: 'Plan not configured in Mercado Pago. Contact support.',
      })
    }

    // 5. Criar assinatura no Mercado Pago
    const subscription = await createSubscription(
      {
        dealerId,
        planId,
        payerEmail: payerEmail || dealer.email,
      },
      mpPlanMapping.mercadopago_plan_id,
    )

    // 6. Registrar em fcs_subscriptions
    const { data: savedSubscription, error: saveError } = await supabase
      .from('fcs_subscriptions')
      .insert({
        dealer_id: dealerId,
        plan_id: planId,
        status: 'pending', // Aguardando primeiro pagamento
        payment_method: 'mercado_pago',
        mercadopago_subscription_id: subscription.subscriptionId,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (saveError) {
      console.error('Erro ao salvar subscription:', saveError)
      // TODO: Cancelar assinatura no MP se falhar
    }

    console.log(`✅ Assinatura criada: ${subscription.subscriptionId}`)

    return res.status(201).json({
      success: true,
      subscription: {
        id: savedSubscription?.id,
        checkoutUrl: subscription.checkoutUrl, // Redirecionar usuário aqui
        status: subscription.status,
      },
    })
  } catch (error) {
    console.error('Erro ao criar assinatura:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}

/**
 * POST /api/webhooks/mercado-pago
 * Webhook para processar eventos do Mercado Pago
 * Mercado Pago enviará para: {VITE_API_URL}/webhooks/mercado-pago
 */
export async function handleMercadoPagoWebhook(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const payload: MercadoPagoWebhookPayload = req.body

    // Processar webhook
    const result = await processMercadoPagoWebhook(payload)

    // Se foi cobrança bem-sucedida, atualizar status
    if (result.action === 'charge_processed') {
      const { data: subscription } = await supabase
        .from('fcs_subscriptions')
        .select('id, dealer_id, plan_id')
        .eq('mercadopago_subscription_id', result.subscriptionId)
        .single()

      if (subscription) {
        // Atualizar status para ativo
        await supabase
          .from('fcs_subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', subscription.id)

        // TODO: Enviar email de confirmação
        // TODO: Registrar no fcs_audit_logs

        console.log(`✅ Subscription ativada: ${subscription.id}`)
      }
    }

    // Se foi cancelamento, atualizar
    if (result.action === 'subscription_cancelled') {
      await supabase
        .from('fcs_subscriptions')
        .update({ status: 'cancelled' })
        .eq('mercadopago_subscription_id', result.subscriptionId)

      console.log(`❌ Subscription cancelada: ${result.subscriptionId}`)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Erro no webhook:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Webhook processing failed',
    })
  }
}

export default {
  handleCreateSubscription,
  handleMercadoPagoWebhook,
}
