#!/usr/bin/env node
/**
 * Setup de Planos no Mercado Pago
 * Execute uma única vez: node scripts/setup-mercadopago-plans.js
 */

import { createClient } from '@supabase/supabase-js'
import { MercadoPago } from 'mercadopago'
import dotenv from 'dotenv'

// Carrega variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const mpAccessToken = process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN

if (!supabaseUrl || !supabaseKey || !mpAccessToken) {
  console.error('❌ Variáveis de ambiente incompletas!')
  console.error('Defina: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_MERCADO_PAGO_ACCESS_TOKEN')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const mpClient = new MercadoPago({ accessToken: mpAccessToken })

/**
 * Criar plano no Mercado Pago e mapear em fcs_mercadopago_plans
 */
async function setupPlan(fcsPlanId, fcsPlanData) {
  console.log(`\n📋 Configurando plano: ${fcsPlanData.name}`)

  try {
    // 1. Criar no Mercado Pago
    const mpPlanData = {
      back_url: `${process.env.VITE_APP_URL}/painel/assinatura/sucesso`,
      reason: fcsPlanData.name,
      auto_recurring: {
        frequency: fcsPlanData.billing_cycle === 'yearly' ? 12 : 1,
        frequency_type: 'months',
        repetitions: 0, // Infinito
      },
      charges_metadata: {
        fcs_plan_id: fcsPlanId,
      },
      currency_id: 'BRL',
      description: fcsPlanData.description || `Plano ${fcsPlanData.name}`,
      invoice_limit: 12,
      items: [
        {
          id: `fcs_${fcsPlanId}`,
          title: fcsPlanData.name,
          description: fcsPlanData.description || '',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: fcsPlanData.price_monthly,
        },
      ],
    }

    const mpPlan = await mpClient.plans.create(mpPlanData)
    console.log(`✅ Plano MP criado: ${mpPlan.id}`)

    // 2. Mapear em fcs_mercadopago_plans
    const { data: mapping, error: mapError } = await supabase
      .from('fcs_mercadopago_plans')
      .insert({
        fcs_plan_id: fcsPlanId,
        mercadopago_plan_id: mpPlan.id,
        mercadopago_status: 'active',
      })
      .select()

    if (mapError) throw mapError

    console.log(`✅ Mapeamento salvo no banco`)
    console.log(`   MP Plan ID: ${mpPlan.id}`)

    return {
      fcsPlanId,
      mpPlanId: mpPlan.id,
      name: fcsPlanData.name,
      success: true,
    }
  } catch (error) {
    console.error(`❌ Erro ao configurar plano ${fcsPlanData.name}:`, error.message)
    return {
      fcsPlanId,
      name: fcsPlanData.name,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Main: buscar todos os planos e criar no MP
 */
async function main() {
  console.log('🚀 Iniciando setup de planos Mercado Pago...\n')

  try {
    // 1. Buscar planos do banco
    const { data: plans, error: plansError } = await supabase
      .from('fcs_plans')
      .select('*')
      .eq('is_active', true)

    if (plansError) throw plansError

    if (!plans || plans.length === 0) {
      console.warn('⚠️ Nenhum plano ativo encontrado no banco')
      return
    }

    console.log(`📦 Encontrados ${plans.length} plano(s) ativo(s)\n`)

    // 2. Configurar cada plano
    const results = []
    for (const plan of plans) {
      const result = await setupPlan(plan.id, plan)
      results.push(result)

      // Aguardar um pouco entre requisições
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 3. Resumo
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMO\n')

    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    console.log(`✅ Sucesso: ${successful.length}/${results.length}`)
    successful.forEach(r => {
      console.log(`   • ${r.name} → ${r.mpPlanId}`)
    })

    if (failed.length > 0) {
      console.log(`\n❌ Falhas: ${failed.length}/${results.length}`)
      failed.forEach(r => {
        console.log(`   • ${r.name}: ${r.error}`)
      })
    }

    console.log('\n' + '='.repeat(60))
    console.log('\n✨ Setup concluído!')
    console.log('\nPróximos passos:')
    console.log('1. Implementar componente de seleção de plano no painel')
    console.log('2. Configurar webhook no Mercado Pago:')
    console.log(`   URL: ${process.env.VITE_API_URL}/webhooks/mercado-pago`)
    console.log('3. Testar fluxo completo em sandbox\n')
  } catch (error) {
    console.error('❌ Erro fatal:', error.message)
    process.exit(1)
  }
}

main()
