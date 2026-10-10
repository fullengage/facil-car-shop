// ==============================================================================
// HELPERS DA VITRINE — WHATSAPP, COMPARAÇÃO COM FIPE E FOTOS
// ==============================================================================

import type { Store, Vehicle } from '@/types'

export const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=75'

/** Link para WhatsApp da loja, com mensagem opcional. Null se a loja não tem telefone. */
export function whatsappUrl(store: Store, message?: string): string | null {
  const digits = (store.phone ?? '').replace(/\D/g, '')
  if (!digits) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/55${digits}${text}`
}

export function vehicleInterestMessage(store: Store, vehicle: Vehicle, price: string): string {
  return `Olá! Vi o ${vehicle.title} por ${price} na ${store.name} e gostaria de mais informações.`
}

export interface FipeComparison {
  hasFipe: boolean
  below: boolean
  diff: number
  percent: number
}

/** Diferença entre o preço anunciado e a FIPE. Sem FIPE, hasFipe é false. */
export function compareWithFipe(vehicle: Vehicle): FipeComparison {
  const fipe = vehicle.fipe_price ?? 0
  if (fipe <= 0) return { hasFipe: false, below: false, diff: 0, percent: 0 }
  const diff = vehicle.price - fipe
  return { hasFipe: true, below: diff < 0, diff, percent: (diff / fipe) * 100 }
}

export function mapsUrl(store: Store): string | null {
  const parts = [store.address_street, store.address_number, store.address_city, store.address_state]
  const query = parts.filter(Boolean).join(', ')
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null
}
