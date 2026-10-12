// ==============================================================================
// SERVIÇO DE LOJAS (FCS_STORES)
// Integração Supabase fcs_stores com fallback local e suporte a BrasilAPI
// ==============================================================================

import type { Store } from '@/types'
import { slugify } from '@/utils/storeIdentity'
import { isSupabaseConfigured, supabase } from './supabaseClient'

const LOCAL_STORAGE_KEY = 'fcs_stores_cache'

function getStoredStores(): Store[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Store[]
  } catch {
    return []
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

      if (!error && data) {
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

export async function getActiveStore(): Promise<Store | null> {
  const stores = await listStores()
  return stores[0] || null
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

export async function updateStore(id: string, updates: Partial<Store>): Promise<Store | null> {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
    ...(updates.name ? { slug: slugify(updates.name) } : {}),
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('fcs_stores')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        const list = getStoredStores()
        const idx = list.findIndex((s) => s.id === id)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...data }
          saveStoredStores(list)
        }
        return data as Store
      }
    } catch {
      // Fallback para cache local
    }
  }

  const list = getStoredStores()
  const idx = list.findIndex((s) => s.id === id)
  if (idx === -1) {
    const updated: Store = {
      name: 'Loja',
      status: 'pending_approval',
      created_at: new Date().toISOString(),
      ...payload,
      id,
      updated_at: new Date().toISOString(),
    }
    list.unshift(updated)
    saveStoredStores(list)
    return updated
  }

  list[idx] = { ...list[idx], ...payload }
  saveStoredStores(list)
  return list[idx]
}

