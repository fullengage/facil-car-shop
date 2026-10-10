// ==============================================================================
// SERVIÇO DE CONSULTA DE CEP (BRASILAPI)
// Endpoint: GET /cep/v2/{cep}
// ==============================================================================

import type { BrasilApiCep } from '@/types'
import { fetchBrasilApi } from './client'

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

/**
 * Remove caracteres não numéricos do CEP
 */
export function cleanCep(cep: string): string {
  return cep.replace(/\D/g, '').trim()
}

/**
 * Valida se o CEP possui 8 dígitos
 */
export function isValidCepFormat(cep: string): boolean {
  const cleaned = cleanCep(cep)
  return cleaned.length === 8
}

/**
 * Formata um CEP no padrão XXXXX-XXX
 */
export function formatCep(cep: string): string {
  const cleaned = cleanCep(cep)
  if (cleaned.length !== 8) return cep
  return cleaned.replace(/^(\d{5})(\d{3})$/, '$1-$2')
}

/**
 * Consulta endereço completo pelo CEP utilizando a versão v2 da BrasilAPI
 */
export async function getCepDetails(cep: string): Promise<BrasilApiCep> {
  const cleaned = cleanCep(cep)
  if (!isValidCepFormat(cleaned)) {
    throw new Error('Formato de CEP inválido. O CEP deve conter 8 dígitos.')
  }

  try {
    return await fetchBrasilApi<BrasilApiCep>(`/cep/v2/${cleaned}`, {
      ttlMs: THIRTY_DAYS,
      queryType: 'cep_lookup',
      metadata: { cep: cleaned },
    })
  } catch (error) {
    // Fallback gracioso para a v1 caso v2 apresente instabilidade temporária
    return await fetchBrasilApi<BrasilApiCep>(`/cep/v1/${cleaned}`, {
      ttlMs: THIRTY_DAYS,
      queryType: 'cep_lookup',
      metadata: { cep: cleaned, fallback: 'v1' },
    })
  }
}
