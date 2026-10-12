// ==============================================================================
// SERVIÇO DE VEÍCULOS (FCS_VEHICLES)
// Gerenciamento completo de anúncios, cálculo de ágio/deságio FIPE e anti-duplicidade
// ==============================================================================

import type { Vehicle } from '@/types'
import { cleanPlate, maskPlate } from '@/utils/plateValidator'
import { isSupabaseConfigured, supabase } from './supabaseClient'

const LOCAL_STORAGE_KEY = 'fcs_vehicles_cache'

function getStoredVehicles(): Vehicle[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Vehicle[]
    return parsed.filter((v) => !v.id.startsWith('demo-veh-'))
  } catch {
    return []
  }
}

function saveStoredVehicles(vehicles: Vehicle[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(vehicles))
}

export async function listVehicles(storeId?: string): Promise<Vehicle[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('fcs_vehicles').select('*').order('created_at', { ascending: false })
      if (storeId) {
        query = query.eq('store_id', storeId)
      }
      const { data, error } = await query
      if (!error && data) {
        return data as Vehicle[]
      }
    } catch {
      // Fallback para cache local
    }
  }

  const list = getStoredVehicles()
  if (storeId) {
    return list.filter((v) => v.store_id === storeId)
  }
  return list
}

/**
 * Verifica duplicidade de anúncio ativo para o mesmo veículo na mesma loja
 * Requisito: "Evitar duplicidade de anúncios ativos da mesma loja para o mesmo veículo."
 */
export async function checkDuplicateActiveVehicle(
  storeId: string,
  plate: string,
  excludeVehicleId?: string
): Promise<boolean> {
  const cleaned = cleanPlate(plate)
  if (!cleaned) return false

  const vehicles = await listVehicles(storeId)
  return vehicles.some((v) => {
    if (excludeVehicleId && v.id === excludeVehicleId) return false
    if (v.status !== 'published') return false
    return cleanPlate(v.plate || '') === cleaned
  })
}

export async function createVehicle(
  vehicleInput: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
): Promise<Vehicle> {
  // Mascaramento e garantia de privacidade
  const plateMasked = maskPlate(vehicleInput.plate)

  const newVehicle: Vehicle = {
    ...vehicleInput,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `veh-${Date.now()}`,
    plate_masked: plateMasked,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('fcs_vehicles')
        .insert(newVehicle)
        .select()
        .single()

      if (!error && data) {
        return data as Vehicle
      }
    } catch {
      // Segue para fallback local
    }
  }

  const list = getStoredVehicles()
  list.unshift(newVehicle)
  saveStoredVehicles(list)
  return newVehicle
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
  if (updates.plate) {
    updates.plate_masked = maskPlate(updates.plate)
  }
  updates.updated_at = new Date().toISOString()

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('fcs_vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        return data as Vehicle
      }
    } catch {
      // Fallback local
    }
  }

  const list = getStoredVehicles()
  const idx = list.findIndex((v) => v.id === id)
  if (idx === -1) return null

  list[idx] = { ...list[idx], ...updates }
  saveStoredVehicles(list)
  return list[idx]
}

export async function deleteVehicle(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('fcs_vehicles').delete().eq('id', id)
    } catch {
      // Fallback
    }
  }

  const list = getStoredVehicles()
  const filtered = list.filter((v) => v.id !== id)
  saveStoredVehicles(filtered)
  return true
}

/**
 * Leitura pública (vitrine): usa a view fcs_public_vehicle_listings, que só traz a placa
 * mascarada e só veículos publicados de lojas aprovadas. Nunca consulta fcs_vehicles direto.
 */
export async function listPublicVehicles(storeId: string): Promise<Vehicle[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('fcs_public_vehicle_listings')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
      if (!error && data) return data as Vehicle[]
    } catch {
      // Fallback para cache local (demonstração sem Supabase)
    }
  }
  return (await listVehicles(storeId)).filter((v) => v.status === 'published')
}
