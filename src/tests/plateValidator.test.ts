import { describe, it, expect } from 'vitest'
import {
  formatPlate,
  isMercosulPlate,
  isValidBrazilianPlate,
  maskPlate,
  parseFipePrice,
  formatCurrency,
} from '@/utils/plateValidator'

describe('Validação e Formatação de Placas Brasileiras', () => {
  it('deve validar placas no padrão tradicional antigo (ABC1234)', () => {
    expect(isValidBrazilianPlate('ABC1234')).toBe(true)
    expect(isValidBrazilianPlate('abc-1234')).toBe(true)
    expect(isValidBrazilianPlate('KAP9876')).toBe(true)
    expect(isMercosulPlate('ABC1234')).toBe(false)
  })

  it('deve validar placas no padrão Mercosul (BRA2E19)', () => {
    expect(isValidBrazilianPlate('BRA2E19')).toBe(true)
    expect(isValidBrazilianPlate('rio2a18')).toBe(true)
    expect(isValidBrazilianPlate('FCL2026')).toBe(true) // Placa padrão antigo válida (3 letras + 4 números)
    expect(isMercosulPlate('FCL2026')).toBe(false) // Mas não é Mercosul
    expect(isValidBrazilianPlate('FCL2A26')).toBe(true)
    expect(isMercosulPlate('FCL2A26')).toBe(true)
    expect(isMercosulPlate('BRA2E19')).toBe(true)
  })

  it('deve rejeitar placas inválidas', () => {
    expect(isValidBrazilianPlate('')).toBe(false)
    expect(isValidBrazilianPlate('1234567')).toBe(false)
    expect(isValidBrazilianPlate('ABC12345')).toBe(false)
    expect(isValidBrazilianPlate('AB1234')).toBe(false)
    expect(isValidBrazilianPlate('ABCD123')).toBe(false)
  })

  it('deve formatar corretamente as placas', () => {
    expect(formatPlate('abc1234')).toBe('ABC-1234')
    expect(formatPlate('bra2e19')).toBe('BRA2E19')
  })

  it('deve mascarar a placa para garantir a privacidade pública (LGPD)', () => {
    expect(maskPlate('BRA2E19')).toBe('BRA***9')
    expect(maskPlate('ABC1234')).toBe('ABC***4')
    expect(maskPlate('')).toBe('***-****')
  })

  it('deve converter corretamente o valor da FIPE em número', () => {
    expect(parseFipePrice('R$ 84.500,00')).toBe(84500)
    expect(parseFipePrice('R$ 148.900,50')).toBe(148900.5)
    expect(parseFipePrice(120000)).toBe(120000)
    expect(parseFipePrice('')).toBe(0)
  })

  it('deve formatar moeda em padrão Real brasileiro', () => {
    const formatted = formatCurrency(145000)
    expect(formatted).toContain('145.000')
  })
})
