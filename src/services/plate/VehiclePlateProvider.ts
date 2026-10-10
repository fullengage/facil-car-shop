// ==============================================================================
// INTERFACE DE INTEGRAÇÃO — VEHICLE PLATE PROVIDER
// ==============================================================================

import type { PlateLookupResult } from '@/types'

/**
 * Interface obrigatória para qualquer provedor de consulta veicular por placa.
 * Permite plugar facilmente provedores reais, webhooks ou mocks sem alterar
 * os componentes de UI ou regras de negócio do Fácil Car Shop.
 */
export interface VehiclePlateProvider {
  /** Nome identificador do provedor (ex: "mock_provider", "sinesp_api", "custom_webhook") */
  readonly name: string;

  /**
   * Consulta os dados públicos e técnicos do veículo associado à placa informada.
   * Não consulta nem retorna informações pessoais de proprietários (LGPD).
   */
  lookupPlate(plate: string): Promise<PlateLookupResult>;
}
