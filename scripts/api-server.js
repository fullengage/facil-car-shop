#!/usr/bin/env node
/**
 * Servidor Express para Mercado Pago Integration
 *
 * Uso:
 * npm run server
 *
 * Endpoints:
 * POST /api/subscriptions/create
 * POST /webhooks/mercado-pago
 * GET  /api/subscriptions/:id
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import MercadoPago from 'mercadopago'

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

// Middleware
app.use(express.json())
app.use(cors({
  origin: process.env.VITE_APP_URL || 'http://localhost:5173',
  credentials: true,
}))

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// ============================================================================
// INICIALIZAR CLIENTES
// ============================================================================

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const mpClient = new MercadoPago({
  accessToken: process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN,
})

console.log(`✅ Mercado Pago initialized`)
console.log(`✅ Supabase initialized`)

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * POST /api/subscriptions/create
 * Criar nova assinatura no Mercado Pago
 */
app.post('/api/subscriptions/create', async (req, res) => {
  try {
    const { dealerId, planId, payerEmail } = req.body

    // 1. Validar input
    if (!dealerId || !planId || !payerEmail) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    console.log(`📝 Criando subscription para dealer ${dealerId}, plano ${planId}`)

    // 2. Verificar dealer
    const { data: dealer, error: dealerError } = await supabase
      .from('fcs_dealers')
      .select('id, email')
      .eq('id', dealerId)
      .single()

    if (dealerError || !dealer) {
      console.warn(`❌ Dealer não encontrado: ${dealerId}`)
      return res.status(404).json({ error: 'Dealer not found' })
    }

    // 3. Verificar plano
    const { data: plan, error: planError } = await supabase
      .from('fcs_plans')
      .select('id, name, description, price_monthly')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      console.warn(`❌ Plano não encontrado: ${planId}`)
      return res.status(404).json({ error: 'Plan not found' })
    }

    // 4. Verificar assinatura ativa
    const { data: existingSubscription } = await supabase
      .from('fcs_subscriptions')
      .select('id, status')
      .eq('dealer_id', dealerId)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      console.warn(`⚠️  Dealer já tem assinatura ativa: ${existingSubscription.id}`)
      return res.status(409).json({
        error: 'Dealer already has an active subscription',
      })
    }

    // 5. Obter plano do Mercado Pago
    const { data: mpPlanMapping, error: mpError } = await supabase
      .from('fcs_mercadopago_plans')
      .select('mercadopago_plan_id')
      .eq('fcs_plan_id', planId)
      .single()

    if (mpError || !mpPlanMapping) {
      console.warn(`⚠️  Plano MP não mapeado: ${planId}`)
      return res.status(400).json({
        error: 'Plan not configured in Mercado Pago',
      })
    }

    // 6. Criar assinatura no Mercado Pago
    console.log(`💳 Criando subscription no MP com plano ${mpPlanMapping.mercadopago_plan_id}`)

    const subscriptionData = {
      plan_id: mpPlanMapping.mercadopago_plan_id,
      payer: {
        email: payerEmail,
      },
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      back_urls: {
        success: `${process.env.VITE_APP_URL}/painel/assinatura/sucesso?dealer=${dealerId}`,
        failure: `${process.env.VITE_APP_URL}/painel/assinatura/erro?dealer=${dealerId}`,
        pending: `${process.env.VITE_APP_URL}/painel/assinatura/pendente?dealer=${dealerId}`,
      },
      notification_url: `${process.env.VITE_API_URL}/webhooks/mercado-pago`,
      external_reference: `${dealerId}|${planId}`,
      reason: `Assinatura ${plan.name} - Fácil Car Shop`,
    }

    const mpSubscription = await mpClient.subscriptions.create(subscriptionData)

    console.log(`✅ Subscription criada no MP: ${mpSubscription.id}`)
    console.log(`🔗 Checkout URL: ${mpSubscription.init_point}`)

    // 7. Registrar em fcs_subscriptions
    const { data: savedSubscription, error: saveError } = await supabase
      .from('fcs_subscriptions')
      .insert({
        dealer_id: dealerId,
        plan_id: planId,
        status: 'pending',
        payment_method: 'mercado_pago',
        mercadopago_subscription_id: mpSubscription.id,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (saveError) {
      console.error('❌ Erro ao salvar subscription:', saveError)
      // TODO: Cancelar subscription no MP
      return res.status(500).json({ error: 'Database error' })
    }

    console.log(`✅ Subscription salva no BD: ${savedSubscription.id}`)

    return res.status(201).json({
      success: true,
      subscription: {
        id: savedSubscription.id,
        checkoutUrl: mpSubscription.init_point,
        status: mpSubscription.status || 'pending',
      },
    })
  } catch (error) {
    console.error('❌ Erro em /api/subscriptions/create:', error)
    return res.status(500).json({
      error: error.message || 'Internal server error',
    })
  }
})

/**
 * POST /webhooks/mercado-pago
 * Webhook para processar eventos do Mercado Pago
 */
app.post('/webhooks/mercado-pago', async (req, res) => {
  try {
    const payload = req.body

    console.log(`📨 Webhook recebido: ${payload.type}`)
    console.log(`   Subscription: ${payload.data?.subscription_id}`)

    // Aceitar webhook imediatamente
    res.status(200).json({ received: true })

    // Processar em background (não bloqueia resposta)
    setImmediate(() => processWebhook(payload))
  } catch (error) {
    console.error('❌ Erro em webhook:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

/**
 * Processar webhook do Mercado Pago
 */
async function processWebhook(payload) {
  try {
    const { type, data } = payload
    const subscriptionId = data?.subscription_id

    if (!subscriptionId) {
      console.warn('⚠️  Webhook sem subscription_id')
      return
    }

    // Tipo: subscription_charge (cobrança processada)
    if (type === 'subscription_charge') {
      const chargeStatus = data.status || 'approved'
      console.log(`💳 Cobrança processada: ${data.charge_id} (${chargeStatus})`)

      if (chargeStatus === 'approved') {
        // 1. Atualizar subscription status
        const { data: subscription } = await supabase
          .from('fcs_subscriptions')
          .select('id, dealer_id, plan_id')
          .eq('mercadopago_subscription_id', subscriptionId)
          .single()

        if (subscription) {
          // Ativar subscription
          const { error: updateError } = await supabase
            .from('fcs_subscriptions')
            .update({
              status: 'active',
              last_payment_date: new Date().toISOString(),
              next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', subscription.id)

          if (updateError) {
            console.error('❌ Erro ao atualizar subscription:', updateError)
            return
          }

          console.log(`✅ Subscription ativada: ${subscription.id}`)

          // 2. Registrar cobrança
          await supabase.from('fcs_subscription_charges').insert({
            subscription_id: subscription.id,
            mercadopago_charge_id: data.charge_id,
            amount: data.amount || 0,
            status: chargeStatus,
            processed_at: new Date().toISOString(),
          })

          // 3. Registrar em audit logs
          await supabase.from('fcs_audit_logs').insert({
            dealer_id: subscription.dealer_id,
            entity_type: 'fcs_subscriptions',
            entity_id: subscription.id,
            action: 'payment_approved',
            new_values: { status: 'active' },
          })

          // TODO: Enviar email de confirmação
          console.log(`📧 TODO: Enviar email de confirmação para dealer`)
        }
      }
    }

    // Tipo: subscription_cancelled (assinatura cancelada)
    if (type === 'subscription_cancelled') {
      console.log(`❌ Assinatura cancelada: ${subscriptionId}`)

      await supabase
        .from('fcs_subscriptions')
        .update({ status: 'cancelled' })
        .eq('mercadopago_subscription_id', subscriptionId)

      console.log(`✅ Subscription marcada como cancelada`)
    }

    // Tipo: subscription_suspended (assinatura suspensa)
    if (type === 'subscription_suspended') {
      console.log(`⏸️  Assinatura suspensa: ${subscriptionId}`)

      await supabase
        .from('fcs_subscriptions')
        .update({ status: 'past_due' })
        .eq('mercadopago_subscription_id', subscriptionId)
    }
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
  }
}

/**
 * GET /api/subscriptions/:id
 * Obter status da assinatura
 */
app.get('/api/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: subscription, error } = await supabase
      .from('fcs_subscriptions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !subscription) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    return res.json({
      id: subscription.id,
      status: subscription.status,
      planId: subscription.plan_id,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      nextPaymentDate: subscription.next_payment_date,
      lastPaymentDate: subscription.last_payment_date,
    })
  } catch (error) {
    console.error('❌ Erro em GET /api/subscriptions/:id:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/subscriptions/:id/cancel
 * Cancelar assinatura
 */
app.post('/api/subscriptions/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params

    console.log(`🗑️  Cancelando subscription ${id}`)

    // 1. Buscar subscription
    const { data: subscription, error: getError } = await supabase
      .from('fcs_subscriptions')
      .select('mercadopago_subscription_id')
      .eq('id', id)
      .single()

    if (getError || !subscription) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    // 2. Cancelar no Mercado Pago
    if (subscription.mercadopago_subscription_id) {
      try {
        await mpClient.subscriptions.update(subscription.mercadopago_subscription_id, {
          status: 'cancelled',
        })
        console.log(`✅ Subscription cancelada no MP`)
      } catch (mpError) {
        console.error('⚠️  Erro ao cancelar no MP:', mpError.message)
        // Continuar mesmo se MP falhar
      }
    }

    // 3. Atualizar no BD
    const { error: updateError } = await supabase
      .from('fcs_subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (updateError) {
      return res.status(500).json({ error: 'Database error' })
    }

    console.log(`✅ Subscription cancelada`)
    return res.json({ success: true })
  } catch (error) {
    console.error('❌ Erro em POST /api/subscriptions/:id/cancel:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

app.get('/', (req, res) => {
  res.json({
    message: 'Fácil Car Shop API Server',
    version: '1.0.0',
    endpoints: {
      'POST /api/subscriptions/create': 'Criar assinatura',
      'POST /webhooks/mercado-pago': 'Webhook do Mercado Pago',
      'GET /api/subscriptions/:id': 'Obter status',
      'POST /api/subscriptions/:id/cancel': 'Cancelar assinatura',
      'GET /health': 'Health check',
    },
  })
})

// ============================================================================
// START SERVER
// ============================================================================

app.listen(port, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${port}`)
  console.log(`\n📚 Endpoints:`)
  console.log(`   POST /api/subscriptions/create`)
  console.log(`   POST /webhooks/mercado-pago`)
  console.log(`   GET  /api/subscriptions/:id`)
  console.log(`   POST /api/subscriptions/:id/cancel`)
  console.log(`\n💬 Logs:`)
})

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason)
})

export default app
