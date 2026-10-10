// ==============================================================================
// GERENCIADOR DE PROVEDORES DE PLACAS (PLATE PROVIDER MANAGER)
// Orquestra a validação, execução, auditoria e fallback dos provedores
// ==============================================================================

import { recordExternalQuery } from '@/services/apiLogger'
import type { PlateLookupResult } from '@/types'
import {
  cleanPlate,
  isMercosulPlate,
  isValidBrazilianPlate,
  maskPlate,
} from '@/utils/plateValidator'
import { HttpVehiclePlateProvider } from './HttpVehiclePlateProvider'
import { MockVehiclePlateProvider } from './MockVehiclePlateProvider'
import type { VehiclePlateProvider } from './VehiclePlateProvider'

class PlateProviderManager {
  private providers: Map<string, VehiclePlateProvider> = new Map()
  private activeProviderName = 'mock_vehicle_provider'

  constructor() {
    // Registra os provedores nativos
    this.registerProvider(new MockVehiclePlateProvider())
    this.registerProvider(new HttpVehiclePlateProvider())

    // Se houver URL de API configurada no ambiente, ativa o provedor HTTP
    if (
      typeof import.meta !== 'undefined' &&
      import.meta.env?.VITE_PLATE_API_URL
    ) {
      this.activeProviderName = 'http_vehicle_provider'
    }
  }

  registerProvider(provider: VehiclePlateProvider): void {
    this.providers.set(provider.name, provider)
  }

  setActiveProvider(name: string): boolean {
    if (this.providers.has(name)) {
      this.activeProviderName = name
      return true
    }
    return false
  }

  getActiveProviderName(): string {
    return this.activeProviderName
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Executa a consulta de placa com validações, medição de latência e auditoria
   */
  async lookupPlate(plateInput: string): Promise<PlateLookupResult> {
    const cleaned = cleanPlate(plateInput)
    const isMercosul = isMercosulPlate(cleaned)
    const masked = maskPlate(cleaned)

    // Validação de formato obrigatória
    if (!isValidBrazilianPlate(cleaned)) {
      return {
        success: false,
        plate: cleaned,
        maskedPlate: masked,
        provider: this.activeProviderName,
        isMercosul,
        errorMessage: 'Formato de placa inválido. Aceito: ABC-1234 (antigo) ou ABC1D23 (Mercosul).',
      }
    }

    const provider = this.providers.get(this.activeProviderName)
    if (!provider) {
      return {
        success: false,
        plate: cleaned,
        maskedPlate: masked,
        provider: 'none',
        isMercosul,
        errorMessage: 'Nenhum provedor de consulta de placas configurado.',
      }
    }

    const startTime = performance.now()
    try {
      const result = await provider.lookupPlate(cleaned)
      const duration = performance.now() - startTime

      // Registro de auditoria sem gravar placa completa (apenas máscara e modelo)
      recordExternalQuery({
        provider: result.provider,
        query_type: 'plate_lookup',
        status: result.success ? 'success' : 'error',
        response_time_ms: duration,
        metadata: {
          plate_masked: masked,
          brand: result.brand,
          model: result.model,
          isMercosul,
        },
      })

      return result
    } catch (error: unknown) {
      const duration = performance.now() - startTime
      const errMessage =
        error instanceof Error ? error.message : 'Erro ao processar consulta de placa'

      recordExternalQuery({
        provider: provider.name,
        query_type: 'plate_lookup',
        status: 'error',
        response_time_ms: duration,
        metadata: {
          plate_masked: masked,
          error: errMessage,
        },
      })

      return {
        success: false,
        plate: cleaned,
        maskedPlate: masked,
        provider: provider.name,
        isMercosul,
        errorMessage: errMessage,
      }
    }
  }
}

export const plateProviderManager = new PlateProviderManager()
