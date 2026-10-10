// ==============================================================================
// SERVIÇO DE CONSULTA DE CNPJ (BRASILAPI)
// Endpoint: GET /cnpj/v1/{cnpj}
// ==============================================================================

import type { BrasilApiCnpj } from '@/types'
import { fetchBrasilApi } from './client'

const ONE_DAY = 24 * 60 * 60 * 1000

/**
 * Remove pontuação e caracteres não numéricos do CNPJ
 */
export function cleanCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '').trim()
}

/**
 * Validação básica de tamanho do CNPJ (14 dígitos)
 */
export function isValidCnpjFormat(cnpj: string): boolean {
  const cleaned = cleanCnpj(cnpj)
  return cleaned.length === 14
}

/**
 * Formata um CNPJ no padrão XX.XXX.XXX/XXXX-XX
 */
export function formatCnpj(cnpj: string): string {
  const cleaned = cleanCnpj(cnpj)
  if (cleaned.length !== 14) return cnpj
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  )
}

/**
 * Consulta dados cadastrais completos da empresa pelo CNPJ
 */
export async function getCnpjDetails(cnpj: string): Promise<BrasilApiCnpj> {
  const cleaned = cleanCnpj(cnpj)
  if (!isValidCnpjFormat(cleaned)) {
    throw new Error('Formato de CNPJ inválido. Digite 14 dígitos numéricos.')
  }

  return fetchBrasilApi<BrasilApiCnpj>(`/cnpj/v1/${cleaned}`, {
    ttlMs: ONE_DAY,
    queryType: 'cnpj_lookup',
    metadata: { cnpj: cleaned },
  })
}
