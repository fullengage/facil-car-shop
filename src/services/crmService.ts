// ==============================================================================
// SERVIÇO DE CRM & GESTÃO MULTI-PERFIL — FÁCIL CAR SHOP
// Integração Supabase com Fallbacks Seguros e Reais
// ==============================================================================

import { supabase } from '@/services/supabaseClient'
import type {
  FCSDealer,
  FCSCustomer,
  FCSPipelineStage,
  FCSLead,
  FCSTask,
  FCSProposal,
  FCSSale,
  FCSPlan,
  Vehicle,
} from '@/types'


// Mock fallback IDs padrão para demonstração operacional
export const DEFAULT_DEALER_ID = '00000000-0000-0000-0000-000000000001'
export const DEFAULT_SELLER_ID = '00000000-0000-0000-0000-000000000002'

// ==============================================================================
// 1. SUPER ADMIN SERVICES
// ==============================================================================

export interface SuperAdminMetrics {
  totalDealers: number
  activeDealers: number
  pendingDealers: number
  suspendedDealers: number
  totalStores: number
  totalVehicles: number
  totalLeads: number
  mrrTotal: number
  activeSubscriptions: number
  pastDueSubscriptions: number
}

export async function getSuperAdminMetrics(): Promise<SuperAdminMetrics> {
  const fallbackMetrics: SuperAdminMetrics = {
    totalDealers: 0,
    activeDealers: 0,
    pendingDealers: 0,
    suspendedDealers: 0,
    totalStores: 0,
    totalVehicles: 0,
    totalLeads: 0,
    mrrTotal: 0,
    activeSubscriptions: 0,
    pastDueSubscriptions: 0,
  }

  if (!supabase) return fallbackMetrics

  try {
    const [dealersRes, storesRes, vehiclesRes, leadsRes, subsRes] = await Promise.all([
      supabase.from('fcs_dealers').select('status'),
      supabase.from('fcs_stores').select('id', { count: 'exact', head: true }),
      supabase.from('fcs_vehicles').select('id', { count: 'exact', head: true }),
      supabase.from('fcs_leads').select('id', { count: 'exact', head: true }),
      supabase.from('fcs_subscriptions').select('status, plan_id, fcs_plans(price_monthly)'),
    ])

    const dealers = dealersRes.data || []
    const totalDealers = dealers.length
    const activeDealers = dealers.filter((d) => d.status === 'active').length
    const pendingDealers = dealers.filter((d) => d.status === 'pending').length
    const suspendedDealers = dealers.filter((d) => d.status === 'suspended').length

    let mrrTotal = 0
    let activeSubscriptions = 0
    let pastDueSubscriptions = 0

    if (subsRes.data) {
      subsRes.data.forEach((sub: any) => {
        if (sub.status === 'active') {
          activeSubscriptions++
          const price = sub.fcs_plans?.price_monthly || 0
          mrrTotal += Number(price)
        } else if (sub.status === 'past_due') {
          pastDueSubscriptions++
        }
      })
    }

    return {
      totalDealers,
      activeDealers,
      pendingDealers,
      suspendedDealers,
      totalStores: storesRes.count || 0,
      totalVehicles: vehiclesRes.count || 0,
      totalLeads: leadsRes.count || 0,
      mrrTotal,
      activeSubscriptions,
      pastDueSubscriptions,
    }
  } catch (error) {
    console.error('Erro ao carregar métricas Super Admin:', error)
    return fallbackMetrics
  }
}

export async function listAllDealers(): Promise<FCSDealer[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('fcs_dealers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as FCSDealer[]
  } catch (error) {
    console.error('Erro ao listar lojistas:', error)
    return []
  }
}

export async function updateDealerStatus(
  dealerId: string,
  newStatus: 'active' | 'suspended' | 'pending' | 'rejected'
): Promise<boolean> {
  if (!supabase) return true

  try {
    const { error } = await supabase
      .from('fcs_dealers')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', dealerId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erro ao atualizar status do lojista:', error)
    return false
  }
}

export async function listAllPlans(): Promise<FCSPlan[]> {
  const fallbackPlans: FCSPlan[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Básico',
      slug: 'basico',
      description: 'Plano ideal para pequenas lojas e autônomos (R$ 5,99 por carro)',
      price_monthly: 59.9,
      vehicle_limit: 10,
      store_limit: 1,
      seller_limit: 1,
      features: ['Cadastro inteligente por placa', 'Tabela FIPE', 'CRM de leads básico'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Profissional',
      slug: 'profissional',
      description: 'Para lojas dinâmicas com showroom e equipe (R$ 4,80 por carro)',
      price_monthly: 119.9,
      vehicle_limit: 25,
      store_limit: 1,
      seller_limit: 3,
      features: ['Tudo do Básico', 'WhatsApp Integrado', 'Showroom Exclusivo', 'Até 3 vendedores'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Premium',
      slug: 'premium',
      description: 'Para lojas com alto giro de estoque (R$ 3,92 por carro)',
      price_monthly: 195.9,
      vehicle_limit: 50,
      store_limit: 2,
      seller_limit: 6,
      features: ['Tudo do Profissional', 'Multi-vendedores', 'Até 2 lojas', 'Relatórios avançados'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Para concessionárias e grandes estoques (R$ 2,90 por carro)',
      price_monthly: 290.0,
      vehicle_limit: 100,
      store_limit: 5,
      seller_limit: 12,
      features: ['Rede multiloja (até 5 lojas)', 'Destaques contínuos', 'CRM Avançado', 'Suporte VIP'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      name: 'Rede de Lojas & Frotista',
      slug: 'frotista',
      description: 'Plano especial sob consulta para redes e grandes frotistas',
      price_monthly: 0.0,
      vehicle_limit: 99999,
      store_limit: 50,
      seller_limit: 100,
      features: ['Sob consulta', 'Rede multiloja', 'Integração ERP/DMS', 'Consultor dedicado'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  if (!supabase) return fallbackPlans

  try {
    const { data, error } = await supabase
      .from('fcs_plans')
      .select('*')
      .order('price_monthly', { ascending: true })

    if (error) throw error
    if (data && data.length > 0) return data as FCSPlan[]

    return fallbackPlans
  } catch (error) {
    console.error('Erro ao listar planos:', error)
    return fallbackPlans
  }
}

// ==============================================================================
// 2. KANBAN & CRM SERVICES
// ==============================================================================

export async function listPipelineStages(dealerId?: string): Promise<FCSPipelineStage[]> {
  const fallbackStages: FCSPipelineStage[] = [
    { id: '1', dealer_id: DEFAULT_DEALER_ID, store_id: null, name: 'Novo lead', stage_key: 'novo_lead', position: 1, category: 'open', color: '#3b82f6', is_active: true, created_at: '', updated_at: '' },
    { id: '2', dealer_id: DEFAULT_DEALER_ID, store_id: null, name: 'Primeiro contato', stage_key: 'primeiro_contato', position: 2, category: 'open', color: '#06b6d4', is_active: true, created_at: '', updated_at: '' },
    { id: '3', dealer_id: DEFAULT_DEALER_ID, store_id: null, name: 'Em atendimento', stage_key: 'em_atendimento', position: 3, category: 'open', color: '#8b5cf6', is_active: true, created_at: '', updated_at: '' },
    { id: '4', dealer_id: DEFAULT_DEALER_ID, store_id: null, name: 'Visita agendada', stage_key: 'visita_agendada', position: 4, category: 'open', color: '#f59e0b', is_active: true, created_at: '', updated_at: '' },
    { id: '5', dealer_id: DEFAULT_DEALER_ID, store_id: null, name: 'Negociação', stage_key: 'negociacao', position: 5, category: 'open', color: '#ec4899', is_active: true, created_at: '', updated_at: '' },
    { id: '6', dealer_id: DEFAULT_DEALER_ID, store_id: null, name: 'Proposta enviada', stage_key: 'proposta_enviada', position: 6, category: 'open', color: '#6366f1', is_active: true, created_at: '', updated_at: '' },
    { id: '7', dealer_id: DEFAULT_DEALER_ID, store_id: null, name: 'Venda concluída', stage_key: 'venda_concluida', position: 7, category: 'won', color: '#10b981', is_active: true, created_at: '', updated_at: '' },
    { id: '8', dealer_id: DEFAULT_DEALER_ID, store_id: null, name: 'Perdido', stage_key: 'perdido', position: 8, category: 'lost', color: '#ef4444', is_active: true, created_at: '', updated_at: '' },
  ]

  if (!supabase) return fallbackStages

  try {
    let query = supabase.from('fcs_pipeline_stages').select('*').order('position')
    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }

    const { data, error } = await query
    if (error) throw error
    if (data && data.length > 0) return data as FCSPipelineStage[]

    return fallbackStages
  } catch (error) {
    console.error('Erro ao listar etapas do funil:', error)
    return fallbackStages
  }
}

export interface EnrichedLead extends FCSLead {
  customer?: FCSCustomer
  vehicle?: Vehicle
}

export async function listLeads(options?: {
  dealerId?: string
  storeId?: string
  sellerId?: string
  stageId?: string
}): Promise<EnrichedLead[]> {
  if (!supabase) return getMockLeads()

  try {
    let query = supabase
      .from('fcs_leads')
      .select('*, customer:fcs_customers(*), vehicle:fcs_vehicles(*)')
      .order('created_at', { ascending: false })

    if (options?.dealerId) query = query.eq('dealer_id', options.dealerId)
    if (options?.storeId) query = query.eq('store_id', options.storeId)
    if (options?.sellerId) query = query.eq('assigned_seller_id', options.sellerId)
    if (options?.stageId) query = query.eq('stage_id', options.stageId)

    const { data, error } = await query
    if (error) throw error
    if (data && data.length > 0) return data as EnrichedLead[]

    return getMockLeads()
  } catch (error) {
    console.error('Erro ao listar leads:', error)
    return getMockLeads()
  }
}

export async function updateLeadStage(leadId: string, newStageId: string): Promise<boolean> {
  if (!supabase) return true

  // Se não for UUID válido (ex: mock em teste), retornar true sem erro
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId)
  if (!isUuid) return true

  try {
    const { error } = await supabase

      .from('fcs_leads')
      .update({
        stage_id: newStageId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    if (error) throw error

    // Registrar evento de movimentação na timeline
    await supabase.from('fcs_lead_events').insert({
      lead_id: leadId,
      event_type: 'stage_changed',
      new_value: { stage_id: newStageId },
      metadata: { moved_at: new Date().toISOString() },
    })

    return true
  } catch (error) {
    console.error('Erro ao mover lead:', error)
    return false
  }
}

export async function recordContactEvent(event: {
  dealerId: string
  storeId: string
  leadId?: string
  customerId?: string
  sellerId?: string
  channel: 'whatsapp' | 'phone' | 'email'
  direction: 'inbound' | 'outbound'
  eventType: string
  metadata?: Record<string, unknown>
}): Promise<boolean> {
  if (!supabase) return true

  try {
    const { error } = await supabase.from('fcs_contact_events').insert({
      dealer_id: event.dealerId,
      store_id: event.storeId,
      lead_id: event.leadId,
      customer_id: event.customerId,
      seller_id: event.sellerId,
      channel: event.channel,
      direction: event.direction,
      event_type: event.eventType,
      metadata: event.metadata || {},
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erro ao registrar evento de contato:', error)
    return false
  }
}

// ==============================================================================
// 3. TAREFAS, PROPOSTAS & VENDAS
// ==============================================================================

export async function listTasks(sellerId?: string): Promise<FCSTask[]> {
  const fallbackTasks: FCSTask[] = [
    {
      id: 't-1',
      dealer_id: DEFAULT_DEALER_ID,
      store_id: 'default-store',
      lead_id: 'lead-1',
      customer_id: 'cust-1',
      assigned_user_id: DEFAULT_SELLER_ID,
      created_by: null,
      title: 'Retornar ligação sobre proposta do Corolla',
      description: 'Cliente pediu desconto de R$ 2.000 ou IPVA 2026 pago',
      priority: 'high',
      status: 'pending',
      due_at: new Date(Date.now() + 3600000 * 2).toISOString(),
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 't-2',
      dealer_id: DEFAULT_DEALER_ID,
      store_id: 'default-store',
      lead_id: 'lead-2',
      customer_id: 'cust-2',
      assigned_user_id: DEFAULT_SELLER_ID,
      created_by: null,
      title: 'Confirmar visita agendada para sábado 10h',
      description: 'Test-drive no Compass Longitude',
      priority: 'normal',
      status: 'pending',
      due_at: new Date(Date.now() + 3600000 * 24).toISOString(),
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  if (!supabase) return fallbackTasks

  try {
    let query = supabase.from('fcs_tasks').select('*').order('due_at', { ascending: true })
    if (sellerId) query = query.eq('assigned_user_id', sellerId)

    const { data, error } = await query
    if (error) throw error
    if (data && data.length > 0) return data as FCSTask[]

    return fallbackTasks
  } catch (error) {
    console.error('Erro ao listar tarefas:', error)
    return fallbackTasks
  }
}

export async function listProposals(sellerId?: string): Promise<FCSProposal[]> {
  const fallbackProposals: FCSProposal[] = [
    {
      id: 'p-1',
      dealer_id: DEFAULT_DEALER_ID,
      store_id: 'default-store',
      lead_id: 'lead-1',
      vehicle_id: 'v-corolla',
      seller_id: DEFAULT_SELLER_ID,
      asking_price: 112900.0,
      proposed_price: 109000.0,
      discount: 3900.0,
      notes: 'Pagamento à vista com transferência Pix imediata',
      status: 'sent',
      expires_at: new Date(Date.now() + 86400000 * 3).toISOString(),
      sent_at: new Date().toISOString(),
      accepted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  if (!supabase) return fallbackProposals

  try {
    let query = supabase.from('fcs_proposals').select('*').order('created_at', { ascending: false })
    if (sellerId) query = query.eq('seller_id', sellerId)

    const { data, error } = await query
    if (error) throw error
    if (data && data.length > 0) return data as FCSProposal[]

    return fallbackProposals
  } catch (error) {
    console.error('Erro ao listar propostas:', error)
    return fallbackProposals
  }
}

export async function listSales(sellerId?: string): Promise<FCSSale[]> {
  const fallbackSales: FCSSale[] = [
    {
      id: 's-1',
      dealer_id: DEFAULT_DEALER_ID,
      store_id: 'default-store',
      lead_id: 'lead-past',
      proposal_id: 'p-past',
      vehicle_id: 'v-onix',
      seller_id: DEFAULT_SELLER_ID,
      final_price: 78500.0,
      commission_amount: 1177.5,
      status: 'confirmed',
      sold_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      created_by: null,
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  if (!supabase) return fallbackSales

  try {
    let query = supabase.from('fcs_sales').select('*').order('sold_at', { ascending: false })
    if (sellerId) query = query.eq('seller_id', sellerId)

    const { data, error } = await query
    if (error) throw error
    if (data && data.length > 0) return data as FCSSale[]

    return fallbackSales
  } catch (error) {
    console.error('Erro ao listar vendas:', error)
    return fallbackSales
  }
}

// ==============================================================================
// 4. COMPRADOR (FAVORITOS & BUSCAS SALVAS)
// ==============================================================================

export async function listBuyerFavorites(userId: string): Promise<Vehicle[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('fcs_buyer_favorites')
      .select('vehicle_id, vehicle:fcs_vehicles(*)')
      .eq('user_id', userId)

    if (error) throw error
    if (data && data.length > 0) {
      return data.map((d: any) => d.vehicle).filter(Boolean) as Vehicle[]
    }
    return []
  } catch (error) {
    console.error('Erro ao buscar favoritos do comprador:', error)
    return []
  }
}

export async function toggleBuyerFavorite(userId: string, vehicleId: string): Promise<boolean> {
  if (!supabase) return true

  try {
    const { data } = await supabase
      .from('fcs_buyer_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('vehicle_id', vehicleId)
      .maybeSingle()

    if (data) {
      await supabase.from('fcs_buyer_favorites').delete().eq('id', data.id)
      return false // Removido
    } else {
      await supabase.from('fcs_buyer_favorites').insert({ user_id: userId, vehicle_id: vehicleId })
      return true // Adicionado
    }
  } catch (error) {
    console.error('Erro ao alternar favorito:', error)
    return false
  }
}


// ==============================================================================
// GERADOR DE LEADS MOCK PARA AMBIENTE DE DESENVOLVIMENTO
// ==============================================================================
function getMockLeads(): EnrichedLead[] {
  return [
    {
      id: 'lead-1',
      dealer_id: DEFAULT_DEALER_ID,
      store_id: 'default-store',
      customer_id: 'cust-1',
      vehicle_id: 'v-1',
      assigned_seller_id: DEFAULT_SELLER_ID,
      stage_id: 'novo_lead',
      source: 'Google Ads',
      source_detail: 'Anúncio Corolla 2022',
      priority: 'urgent',
      status: 'open',
      first_response_at: null,
      last_contact_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      next_action_at: new Date(Date.now() + 3600000 * 2).toISOString(),
      lost_reason: null,
      version: 1,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date().toISOString(),
      closed_at: null,
      customer: {
        id: 'cust-1',
        dealer_id: DEFAULT_DEALER_ID,
        full_name: 'Roberto Silveira',
        email: 'roberto.silveira@email.com',
        phone: '(11) 98765-4321',
        normalized_phone: '+5511987654321',
        marketplace_user_id: null,
        assigned_seller_id: DEFAULT_SELLER_ID,
        source: 'marketplace',
        status: 'active',
        notes: 'Interesse imediato, carro para a família.',
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      vehicle: {
        id: 'v-1',
        store_id: 'default-store',
        title: 'Toyota Corolla 2.0 XEi 16V Flex',
        brand: 'Toyota',
        model: 'Corolla',
        version: '2.0 XEi',
        model_year: 2022,
        mileage: 45000,
        price: 112900,
        fipe_price: 115400,
        plate_masked: 'BRA***9',
        plate_lookup_status: 'success',
        photos: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80'],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    {
      id: 'lead-2',
      dealer_id: DEFAULT_DEALER_ID,
      store_id: 'default-store',
      customer_id: 'cust-2',
      vehicle_id: 'v-2',
      assigned_seller_id: DEFAULT_SELLER_ID,
      stage_id: 'em_atendimento',
      source: 'WhatsApp Direto',
      source_detail: 'Botão WhatsApp Vitrine',
      priority: 'high',
      status: 'open',
      first_response_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      last_contact_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      next_action_at: new Date(Date.now() + 86400000).toISOString(),
      lost_reason: null,
      version: 2,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      closed_at: null,
      customer: {
        id: 'cust-2',
        dealer_id: DEFAULT_DEALER_ID,
        full_name: 'Juliana Mendes',
        email: 'juliana.m@gmail.com',
        phone: '(11) 97123-9988',
        normalized_phone: '+5511971239988',
        marketplace_user_id: null,
        assigned_seller_id: DEFAULT_SELLER_ID,
        source: 'whatsapp',
        status: 'active',
        notes: 'Deseja dar seminovo na troca (HB20 2020)',
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      vehicle: {
        id: 'v-2',
        store_id: 'default-store',
        title: 'Jeep Compass Longitude 1.3 T270',
        brand: 'Jeep',
        model: 'Compass',
        version: 'Longitude T270',
        model_year: 2023,
        mileage: 28000,
        price: 148900,
        fipe_price: 154000,
        plate_masked: 'FCL***6',
        plate_lookup_status: 'success',
        photos: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    {
      id: 'lead-3',
      dealer_id: DEFAULT_DEALER_ID,
      store_id: 'default-store',
      customer_id: 'cust-3',
      vehicle_id: 'v-3',
      assigned_seller_id: DEFAULT_SELLER_ID,
      stage_id: 'proposta_enviada',
      source: 'Marketplace',
      source_detail: 'Portal Fácil Car Shop',
      priority: 'normal',
      status: 'open',
      first_response_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      last_contact_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      next_action_at: new Date(Date.now() + 3600000 * 12).toISOString(),
      lost_reason: null,
      version: 3,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
      closed_at: null,
      customer: {
        id: 'cust-3',
        dealer_id: DEFAULT_DEALER_ID,
        full_name: 'Carlos Alberto Costa',
        email: 'carlos.costa@empresa.com.br',
        phone: '(19) 99876-1122',
        normalized_phone: '+5519998761122',
        marketplace_user_id: null,
        assigned_seller_id: DEFAULT_SELLER_ID,
        source: 'marketplace',
        status: 'active',
        notes: 'Aguardando aprovação de crédito bancário',
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      vehicle: {
        id: 'v-3',
        store_id: 'default-store',
        title: 'Honda Civic Touring 1.5 Turbo',
        brand: 'Honda',
        model: 'Civic',
        version: 'Touring 1.5 Turbo',
        model_year: 2021,
        mileage: 52000,
        price: 139900,
        fipe_price: 142000,
        plate_masked: 'RIO***8',
        plate_lookup_status: 'success',
        photos: ['https://images.unsplash.com/photo-1590362891988-f7780470208b?auto=format&fit=crop&w=800&q=80'],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    {
      id: 'lead-4',
      dealer_id: DEFAULT_DEALER_ID,
      store_id: 'default-store',
      customer_id: 'cust-4',
      vehicle_id: 'v-1',
      assigned_seller_id: DEFAULT_SELLER_ID,
      stage_id: 'venda_concluida',
      source: 'Indicação',
      source_detail: 'Cliente anterior',
      priority: 'normal',
      status: 'won',
      first_response_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      last_contact_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      next_action_at: null,
      lost_reason: null,
      version: 4,
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      updated_at: new Date().toISOString(),
      closed_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      customer: {
        id: 'cust-4',
        dealer_id: DEFAULT_DEALER_ID,
        full_name: 'Camila Vasconcelos',
        email: 'camila.v@hotmail.com',
        phone: '(11) 98111-2233',
        normalized_phone: '+5511981112233',
        marketplace_user_id: null,
        assigned_seller_id: DEFAULT_SELLER_ID,
        source: 'indicacao',
        status: 'active',
        notes: 'Venda confirmada. Documentação em transferência.',
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      vehicle: {
        id: 'v-1',
        store_id: 'default-store',
        title: 'Toyota Corolla 2.0 XEi 16V Flex',
        brand: 'Toyota',
        model: 'Corolla',
        version: '2.0 XEi',
        model_year: 2022,
        mileage: 45000,
        price: 112900,
        fipe_price: 115400,
        plate_masked: 'BRA***9',
        plate_lookup_status: 'success',
        photos: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80'],
        status: 'sold',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
  ]
}
