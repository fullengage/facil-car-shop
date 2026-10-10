// ==============================================================================
// SERVIÇO DE VEÍCULOS (FCS_VEHICLES)
// Gerenciamento completo de anúncios, cálculo de ágio/deságio FIPE e anti-duplicidade
// ==============================================================================

import type { Vehicle } from '@/types'
import { cleanPlate, maskPlate } from '@/utils/plateValidator'
import { isSupabaseConfigured, supabase } from './supabaseClient'

const LOCAL_STORAGE_KEY = 'fcs_vehicles_cache'

// Veículos demonstrativos pré-carregados para experiência imediata do usuário
const INITIAL_DEMO_VEHICLES: Vehicle[] = [
  {
    id: 'demo-veh-001',
    store_id: 'store-demo-001',
    title: 'Toyota Corolla Altis 2.0 16V Flex Aut. 2023',
    brand: 'Toyota',
    model: 'Corolla Altis 2.0 16V Flex Aut.',
    version: 'Altis 2.0 Flex Aut.',
    model_year: 2023,
    manufacturing_year: 2023,
    fuel_type: 'Flex',
    color: 'Prata',
    mileage: 24500,
    transmission: 'Automático',
    price: 144900,
    description: 'Único dono, todas as revisões feitas na concessionária autorizada. Impecável estado de conservação, laudo cautelar 100% aprovado.',
    photos: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'published',
    plate: 'BRA2E19',
    plate_masked: 'BRA***9',
    fipe_code: '002166-0',
    fipe_price: 148900,
    fipe_reference_month: 'outubro de 2026',
    plate_lookup_status: 'success',
    plate_lookup_provider: 'mock_vehicle_provider',
    plate_last_checked_at: new Date().toISOString(),
    fipe_last_checked_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-veh-002',
    store_id: 'store-demo-001',
    title: 'Jeep Compass Longitude 1.3 T270 Flex Aut. 2024',
    brand: 'Jeep',
    model: 'Compass Longitude 1.3 T270 4x2 Flex Aut.',
    version: 'Longitude T270 Turbo Flex',
    model_year: 2024,
    manufacturing_year: 2024,
    fuel_type: 'Flex',
    color: 'Cinza Granite',
    mileage: 11200,
    transmission: 'Automático',
    price: 169900,
    description: 'Veículo em garantia de fábrica. Pacote High Tech com som Beats, teto solar panorâmico e pacote ADAS.',
    photos: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'published',
    plate: 'FCL2026',
    plate_masked: 'FCL***6',
    fipe_code: '017070-4',
    fipe_price: 172900,
    fipe_reference_month: 'outubro de 2026',
    plate_lookup_status: 'success',
    plate_lookup_provider: 'mock_vehicle_provider',
    plate_last_checked_at: new Date().toISOString(),
    fipe_last_checked_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function getStoredVehicles(): Vehicle[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_VEHICLES
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_VEHICLES))
      return INITIAL_DEMO_VEHICLES
    }
    return JSON.parse(raw) as Vehicle[]
  } catch {
    return INITIAL_DEMO_VEHICLES
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
