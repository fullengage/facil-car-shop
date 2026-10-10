import { describe, it, expect } from 'vitest'
import { MockVehiclePlateProvider } from '@/services/plate/MockVehiclePlateProvider'
import { plateProviderManager } from '@/services/plate/PlateProviderManager'

describe('Provedores de Placas Veiculares (VehiclePlateProvider)', () => {
  it('deve consultar veículo cadastrado no Mock com sucesso e preencher dados', async () => {
    const provider = new MockVehiclePlateProvider()
    const result = await provider.lookupPlate('BRA2E19')

    expect(result.success).toBe(true)
    expect(result.brand).toBe('Toyota')
    expect(result.model).toContain('Corolla')
    expect(result.modelYear).toBe(2023)
    expect(result.fipeCode).toBe('002166-0')
    expect(result.maskedPlate).toBe('BRA***9')
  })

  it('deve retornar insucesso sem quebrar quando a placa não existir', async () => {
    const provider = new MockVehiclePlateProvider()
    const result = await provider.lookupPlate('ZZZ9999')

    expect(result.success).toBe(false)
    expect(result.errorMessage).toBeDefined()
    expect(result.errorMessage).toContain('não localizada')
  })

  it('deve validar e rejeitar placas com formato incorreto através do PlateProviderManager', async () => {
    const result = await plateProviderManager.lookupPlate('INVALID')

    expect(result.success).toBe(false)
    expect(result.errorMessage).toContain('Formato de placa inválido')
  })

  it('deve mascarar a placa no resultado protegendo dados sensíveis', async () => {
    const result = await plateProviderManager.lookupPlate('ABC1234')

    expect(result.success).toBe(true)
    expect(result.maskedPlate).toBe('ABC***4')
    expect(result.brand).toBe('Volkswagen')
  })
})
