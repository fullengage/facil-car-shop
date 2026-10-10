// ==============================================================================
// SERVIÇO DE LOJAS (FCS_STORES)
// Integração Supabase fcs_stores com fallback local e suporte a BrasilAPI
// ==============================================================================

import type { Store } from '@/types'
import { slugify } from '@/utils/storeIdentity'
import { isSupabaseConfigured, supabase } from './supabaseClient'

const LOCAL_STORAGE_KEY = 'fcs_stores_cache'

// Loja padrão inicial para agilizar testes e demonstração do vendedor
const DEFAULT_DEMO_STORE: Store = {
  id: 'store-demo-001',
  slug: 'auto-facil-premium',
  name: 'Auto Fácil Premium',
  corporate_name: 'Auto Facil Veículos Ltda',
  cnpj: '12.345.678/0001-90',
  phone: '(11) 98765-4321',
  email: 'contato@autofacilpremium.com.br',
  cep: '01310-100',
  address_street: 'Avenida Paulista',
  address_number: '1000',
  address_complement: 'Sala 102',
  address_neighborhood: 'Bela Vista',
  address_city: 'São Paulo',
  address_state: 'SP',
  status: 'approved',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

function getStoredStores(): Store[] {
  if (typeof window === 'undefined') return [DEFAULT_DEMO_STORE]
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([DEFAULT_DEMO_STORE]))
      return [DEFAULT_DEMO_STORE]
    }
    return JSON.parse(raw) as Store[]
  } catch {
    return [DEFAULT_DEMO_STORE]
  }
}

function saveStoredStores(stores: Store[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stores))
}

export async function listStores(): Promise<Store[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('fcs_stores')
        .select('*')
        .order('created_at', { ascending: false })

      // Banco vazio também cai no cache local (ex.: loja de demonstração)
      if (!error && data && data.length > 0) {
        return data as Store[]
      }
    } catch {
      // Fallback para cache local
    }
  }

  return getStoredStores()
}

/** Vitrine pública: só lojas aprovadas (a RLS já filtra no Supabase). */
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const stores = await listStores()
  // ponytail: lojas antigas sem slug (migração ainda não aplicada) usam o slug do nome
  return stores.find((s) => (s.slug || slugify(s.name)) === slug) ?? null
}

/** Domínio próprio só vale depois de verificado pelo administrador. */
export async function getStoreByDomain(host: string): Promise<Store | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('fcs_stores')
        .select('*')
        .eq('custom_domain', host)
        .eq('domain_verified', true)
        .maybeSingle()

      if (!error) return (data as Store | null) ?? null
    } catch {
      // Fallback para cache local
    }
  }

  return getStoredStores().find((s) => s.custom_domain === host && s.domain_verified) ?? null
}

export async function getActiveStore(): Promise<Store> {
  const stores = await listStores()
  return stores[0] || DEFAULT_DEMO_STORE
}

export async function createStore(storeInput: Omit<Store, 'id' | 'created_at' | 'updated_at'>): Promise<Store> {
  const newStore: Store = {
    ...storeInput,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `store-${Date.now()}`,
    status: 'pending_approval',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('fcs_stores')
        .insert(newStore)
        .select()
        .single()

      if (!error && data) {
        return data as Store
      }
    } catch {
      // Segue para salvar no cache local
    }
  }

  const list = getStoredStores()
  list.unshift(newStore)
  saveStoredStores(list)
  return newStore
}
