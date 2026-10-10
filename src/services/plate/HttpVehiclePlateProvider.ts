// ==============================================================================
// HTTP VEHICLE PLATE PROVIDER (PROVEDOR EXTERNO CONFIGURÁVEL)
// Permite plugar APIs comerciais de placas (Sinesp, PlacaFipe, etc.) via backend/env
// ==============================================================================

import type { PlateLookupResult } from '@/types'
import { cleanPlate, isMercosulPlate, maskPlate } from '@/utils/plateValidator'
import type { VehiclePlateProvider } from './VehiclePlateProvider'

export interface HttpPlateProviderConfig {
  baseUrl?: string
  apiKey?: string
  timeoutMs?: number
}

export class HttpVehiclePlateProvider implements VehiclePlateProvider {
  readonly name = 'http_vehicle_provider'
  private baseUrl: string
  private apiKey?: string
  private timeoutMs: number

  constructor(config: HttpPlateProviderConfig = {}) {
    this.baseUrl =
      config.baseUrl ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PLATE_API_URL) ||
      ''
    this.apiKey =
      config.apiKey ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PLATE_API_KEY) ||
      undefined
    this.timeoutMs = config.timeoutMs || 8000
  }

  async lookupPlate(plateInput: string): Promise<PlateLookupResult> {
    const plate = cleanPlate(plateInput)
    const isMercosul = isMercosulPlate(plate)
    const maskedPlate = maskPlate(plate)

    if (!this.baseUrl) {
      return {
        success: false,
        plate,
        maskedPlate,
        provider: this.name,
        isMercosul,
        errorMessage: 'Provedor HTTP não configurado. Defina VITE_PLATE_API_URL.',
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(`${this.baseUrl}/${plate}`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return {
          success: false,
          plate,
          maskedPlate,
          provider: this.name,
          isMercosul,
          errorMessage: `Serviço retornou status ${response.status}.`,
        }
      }

      const json = await response.json()

      return {
        success: true,
        plate,
        maskedPlate,
        provider: this.name,
        isMercosul,
        brand: json.marca || json.brand,
        model: json.modelo || json.model,
        version: json.versao || json.version,
        modelYear: json.anoModelo || json.modelYear,
        manufactureYear: json.anoFabricacao || json.manufactureYear,
        fuel: json.combustivel || json.fuel,
        color: json.cor || json.color,
        fipeCode: json.codigoFipe || json.fipeCode,
        fipePriceEstimated: json.precoFipe || json.fipePrice,
        chassisMasked: json.chassiMascarado || json.chassisMasked,
      }
    } catch (error: unknown) {
      clearTimeout(timeoutId)
      const isTimeout =
        error instanceof DOMException && error.name === 'AbortError'
      return {
        success: false,
        plate,
        maskedPlate,
        provider: this.name,
        isMercosul,
        errorMessage: isTimeout
          ? 'Tempo limite de resposta excedido ao consultar o provedor de placas.'
          : 'Falha de comunicação com o serviço de placas.',
      }
    }
  }
}
