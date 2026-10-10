// ==============================================================================
// MOCK VEHICLE PLATE PROVIDER
// Provedor simulado com veículos de demonstração e casos de teste
// ==============================================================================

import type { PlateLookupResult } from '@/types'
import { cleanPlate, isMercosulPlate, maskPlate } from '@/utils/plateValidator'
import type { VehiclePlateProvider } from './VehiclePlateProvider'

interface MockVehicleData {
  brand: string
  model: string
  version: string
  modelYear: number
  manufactureYear: number
  fuel: string
  color: string
  fipeCode?: string
  fipePriceEstimated?: number
  chassisMasked?: string
}

const MOCK_DATABASE: Record<string, MockVehicleData> = {
  // Toyota Corolla Altis 2.0 (Mercosul)
  'BRA2E19': {
    brand: 'Toyota',
    model: 'Corolla Altis 2.0 16V Flex Aut.',
    version: 'Altis 2.0 Flex Aut.',
    modelYear: 2023,
    manufactureYear: 2023,
    fuel: 'Flex',
    color: 'Prata',
    fipeCode: '002166-0',
    fipePriceEstimated: 148900,
    chassisMasked: '9BRBL42E***0192',
  },
  // Fiat Strada Freedom 1.3 (Mercosul)
  'RIO2A18': {
    brand: 'Fiat',
    model: 'Strada Freedom 1.3 Flex 8V CD',
    version: 'Freedom Cabine Dupla 1.3',
    modelYear: 2024,
    manufactureYear: 2023,
    fuel: 'Flex',
    color: 'Branca',
    fipeCode: '001533-4',
    fipePriceEstimated: 105200,
    chassisMasked: '9BD2814A***5518',
  },
  // Jeep Compass Longitude T270 (Mercosul)
  'FCL2026': {
    brand: 'Jeep',
    model: 'Compass Longitude 1.3 T270 4x2 Flex Aut.',
    version: 'Longitude T270 Turbo Flex',
    modelYear: 2024,
    manufactureYear: 2024,
    fuel: 'Flex',
    color: 'Cinza Granite',
    fipeCode: '017070-4',
    fipePriceEstimated: 172900,
    chassisMasked: '98867426***9981',
  },
  // Volkswagen Gol 1.6 MSI (Padrão Antigo)
  'ABC1234': {
    brand: 'Volkswagen',
    model: 'Gol 1.6 MSI TotalFlex 8V 4p',
    version: '1.6 MSI TotalFlex',
    modelYear: 2021,
    manufactureYear: 2020,
    fuel: 'Flex',
    color: 'Preto',
    fipeCode: '005470-4',
    fipePriceEstimated: 56800,
    chassisMasked: '9BWAB45U***1234',
  },
  // Chevrolet Onix Plus Premier 1.0 Turbo (Mercosul)
  'ONX1A00': {
    brand: 'Chevrolet',
    model: 'Onix Plus Premier 1.0 Turbo Flex Aut.',
    version: 'Premier Turbo Aut.',
    modelYear: 2024,
    manufactureYear: 2024,
    fuel: 'Flex',
    color: 'Azul Seeker',
    fipeCode: '004500-4',
    fipePriceEstimated: 112500,
    chassisMasked: '9BGKL69T***0001',
  },
  // Hyundai HB20 Comfort 1.0 (Padrão Antigo)
  'KAP9876': {
    brand: 'Hyundai',
    model: 'HB20 Comfort 1.0 Flex 12V Mec.',
    version: 'Comfort 1.0 Flex',
    modelYear: 2022,
    manufactureYear: 2022,
    fuel: 'Flex',
    color: 'Vermelho',
    fipeCode: '015112-2',
    fipePriceEstimated: 64900,
    chassisMasked: '9BHBH51B***9876',
  },
}

export class MockVehiclePlateProvider implements VehiclePlateProvider {
  readonly name = 'mock_vehicle_provider'

  async lookupPlate(plateInput: string): Promise<PlateLookupResult> {
    const plate = cleanPlate(plateInput)
    const isMercosul = isMercosulPlate(plate)
    const maskedPlate = maskPlate(plate)

    // Simula pequena latência de rede realista (300ms a 600ms)
    await new Promise((resolve) => setTimeout(resolve, 400))

    // Simulação de erro de timeout intencional com placa de teste "TIMEOUT"
    if (plate.startsWith('TIME')) {
      return {
        success: false,
        plate,
        maskedPlate,
        provider: this.name,
        isMercosul,
        errorMessage: 'Tempo limite esgotado ao contatar o servidor de placas.',
      }
    }

    const data = MOCK_DATABASE[plate]

    if (!data) {
      return {
        success: false,
        plate,
        maskedPlate,
        provider: this.name,
        isMercosul,
        errorMessage: 'Placa não localizada na base de dados veiculares. Prossiga com o preenchimento manual.',
      }
    }

    return {
      success: true,
      plate,
      maskedPlate,
      provider: this.name,
      isMercosul,
      brand: data.brand,
      model: data.model,
      version: data.version,
      modelYear: data.modelYear,
      manufactureYear: data.manufactureYear,
      fuel: data.fuel,
      color: data.color,
      fipeCode: data.fipeCode,
      fipePriceEstimated: data.fipePriceEstimated,
      chassisMasked: data.chassisMasked,
    }
  }
}
