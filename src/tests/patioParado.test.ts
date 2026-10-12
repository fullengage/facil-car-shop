import { describe, expect, it } from 'vitest'
import { DIAS_PARADO, diasEmEstoque } from '@/components/dashboard/EstoquePatio'
import type { Vehicle } from '@/types'

const DIA = 24 * 60 * 60 * 1000
const agora = Date.UTC(2026, 9, 11)

function veiculo(entradaDiasAtras: number): Vehicle {
  return {
    id: 'v',
    store_id: 's',
    title: 'Teste',
    brand: 'Marca',
    model: 'Modelo',
    model_year: 2020,
    mileage: 0,
    price: 1,
    photos: [],
    status: 'published',
    plate_lookup_status: 'manual',
    created_at: new Date(agora - entradaDiasAtras * DIA).toISOString(),
    updated_at: new Date(agora).toISOString(),
  }
}

describe('alerta de carro parado', () => {
  it('conta dias inteiros desde a entrada', () => {
    expect(diasEmEstoque(veiculo(0), agora)).toBe(0)
    expect(diasEmEstoque(veiculo(12), agora)).toBe(12)
  })

  it('o limite padrão é 60 dias', () => {
    expect(DIAS_PARADO).toBe(60)
    expect(diasEmEstoque(veiculo(DIAS_PARADO), agora)).toBeGreaterThanOrEqual(DIAS_PARADO)
    expect(diasEmEstoque(veiculo(DIAS_PARADO - 1), agora)).toBeLessThan(DIAS_PARADO)
  })
})
