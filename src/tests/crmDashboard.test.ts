// ==============================================================================
// TESTES UNITÁRIOS — CRM AUTOMOTIVO & COCKPIT DE DASHBOARDS (FASE 2)
// ==============================================================================

import { describe, it, expect } from 'vitest'
import {
  listPipelineStages,
  listLeads,
  updateLeadStage,
  getSuperAdminMetrics,
  listAllPlans,
} from '@/services/crmService'


describe('CRM Automotivo FCS & Dashboards (Fase 2)', () => {
  it('deve listar as 8 etapas oficiais do funil de vendas', async () => {
    const stages = await listPipelineStages()
    expect(stages.length).toBe(8)
    expect(stages.map((s) => s.stage_key)).toEqual([
      'novo_lead',
      'primeiro_contato',
      'em_atendimento',
      'visita_agendada',
      'negociacao',
      'proposta_enviada',
      'venda_concluida',
      'perdido',
    ])
  })

  it('deve listar oportunidades com cliente e veículo associados', async () => {
    const leads = await listLeads()
    expect(leads.length).toBeGreaterThan(0)
    const firstLead = leads[0]
    expect(firstLead).toHaveProperty('id')
    expect(firstLead).toHaveProperty('stage_id')
    expect(firstLead.customer).toBeDefined()
    expect(firstLead.customer?.full_name).toBeTruthy()
    expect(firstLead.vehicle).toBeDefined()
    expect(firstLead.vehicle?.price).toBeGreaterThan(0)
  })

  it('deve permitir atualizar etapa do lead no pipeline', async () => {
    const leads = await listLeads()
    const targetLead = leads[0]
    const success = await updateLeadStage(targetLead.id, 'em_atendimento')
    expect(typeof success).toBe('boolean')
  })

  it('deve retornar métricas da plataforma para o Super Admin', async () => {
    const metrics = await getSuperAdminMetrics()
    expect(metrics.totalDealers).toBeGreaterThanOrEqual(0)
    expect(metrics.totalStores).toBeGreaterThanOrEqual(0)
    expect(metrics.mrrTotal).toBeGreaterThanOrEqual(0)
    expect(metrics.totalVehicles).toBeGreaterThanOrEqual(0)
  })

  it('deve conter planos comerciais com limites de veículos e unidades', async () => {
    const plans = await listAllPlans()
    expect(plans.length).toBeGreaterThanOrEqual(4)

    const basicPlan = plans.find((p) => p.slug === 'basico')
    expect(basicPlan).toBeDefined()
    expect(basicPlan?.price_monthly).toBe(59.9)
    expect(basicPlan?.vehicle_limit).toBe(10)

    const proPlan = plans.find((p) => p.slug === 'profissional')
    expect(proPlan).toBeDefined()
    expect(proPlan?.price_monthly).toBe(119.9)
    expect(proPlan?.vehicle_limit).toBe(25)

    const premiumPlan = plans.find((p) => p.slug === 'premium')
    expect(premiumPlan).toBeDefined()
    expect(premiumPlan?.price_monthly).toBe(195.9)
    expect(premiumPlan?.vehicle_limit).toBe(50)

    const enterprisePlan = plans.find((p) => p.slug === 'enterprise')
    expect(enterprisePlan).toBeDefined()
    expect(enterprisePlan?.price_monthly).toBe(290.0)
    expect(enterprisePlan?.vehicle_limit).toBe(100)
  })
})
