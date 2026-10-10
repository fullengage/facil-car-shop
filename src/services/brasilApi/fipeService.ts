// ==============================================================================
// SERVIÇO DA TABELA FIPE (BRASILAPI)
// Endpoints oficiais: marcas, veículos/modelos, anos, detalhes, preço e tabelas
// ==============================================================================

import type {
  FipeBrand,
  FipeModel,
  FipeReferenceTable,
  FipeVehicleDetail,
  FipeYear,
} from '@/types'
import { fetchBrasilApi } from './client'

const ONE_HOUR = 60 * 60 * 1000
const ONE_DAY = 24 * ONE_HOUR

export type VehicleType = 'carros' | 'motos' | 'caminhoes'

/**
 * Consulta todas as marcas cadastradas na FIPE para o tipo de veículo
 * Endpoint: GET /fipe/marcas/v1/{tipoVeiculo}
 */
export async function getFipeBrands(
  vehicleType: VehicleType = 'carros'
): Promise<FipeBrand[]> {
  return fetchBrasilApi<FipeBrand[]>(`/fipe/marcas/v1/${vehicleType}`, {
    ttlMs: ONE_DAY,
    queryType: 'fipe_brands',
    metadata: { vehicleType },
  })
}

/**
 * Consulta os modelos de uma marca selecionada
 * Endpoint: GET /fipe/veiculos/v1/{tipoVeiculo}/{codigoMarca}
 */
export async function getFipeModels(
  makerCode: string,
  vehicleType: VehicleType = 'carros'
): Promise<FipeModel[]> {
  return fetchBrasilApi<FipeModel[]>(
    `/fipe/veiculos/v1/${vehicleType}/${makerCode}`,
    {
      ttlMs: ONE_DAY,
      queryType: 'fipe_models',
      metadata: { makerCode, vehicleType },
    }
  )
}

/**
 * Consulta os anos disponíveis para determinado modelo da marca
 * Endpoint: GET /fipe/anos/v1/{tipoVeiculo}/{codigoMarca}/{codigoModelo}
 */
export async function getFipeYears(
  makerCode: string,
  modelCode: string | number,
  vehicleType: VehicleType = 'carros'
): Promise<FipeYear[]> {
  return fetchBrasilApi<FipeYear[]>(
    `/fipe/anos/v1/${vehicleType}/${makerCode}/${modelCode}`,
    {
      ttlMs: ONE_DAY,
      queryType: 'fipe_years',
      metadata: { makerCode, modelCode, vehicleType },
    }
  )
}

/**
 * Consulta os detalhes completos e preço FIPE para a combinação selecionada
 * Endpoint: GET /fipe/detalhes/v1/{tipoVeiculo}/{codigoMarca}/{codigoModelo}/{anoModelo}
 */
export async function getFipeDetails(
  makerCode: string,
  modelCode: string | number,
  yearCode: string,
  vehicleType: VehicleType = 'carros'
): Promise<FipeVehicleDetail> {
  return fetchBrasilApi<FipeVehicleDetail>(
    `/fipe/detalhes/v1/${vehicleType}/${makerCode}/${modelCode}/${yearCode}`,
    {
      ttlMs: ONE_HOUR,
      queryType: 'fipe_details',
      metadata: { makerCode, modelCode, yearCode, vehicleType },
    }
  )
}

/**
 * Consulta o histórico de preços pelo código FIPE (ex: "005340-6")
 * Endpoint: GET /fipe/preco/v1/{codigoFipe}
 */
export async function getFipePriceByCode(
  fipeCode: string
): Promise<FipeVehicleDetail[]> {
  const sanitizedCode = fipeCode.replace(/[^\d-]/g, '')
  return fetchBrasilApi<FipeVehicleDetail[]>(
    `/fipe/preco/v1/${sanitizedCode}`,
    {
      ttlMs: ONE_HOUR,
      queryType: 'fipe_price',
      metadata: { fipeCode: sanitizedCode },
    }
  )
}

/**
 * Consulta as tabelas de referência históricas disponíveis
 * Endpoint: GET /fipe/tabelas/v1
 */
export async function getFipeReferenceTables(): Promise<FipeReferenceTable[]> {
  return fetchBrasilApi<FipeReferenceTable[]>('/fipe/tabelas/v1', {
    ttlMs: ONE_DAY,
    queryType: 'fipe_tables',
  })
}
