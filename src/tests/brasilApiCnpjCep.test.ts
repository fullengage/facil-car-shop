import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCnpjDetails,
  cleanCnpj,
  formatCnpj,
  isValidCnpjFormat,
} from '@/services/brasilApi/cnpjService'
import {
  getCepDetails,
  cleanCep,
  formatCep,
  isValidCepFormat,
} from '@/services/brasilApi/cepService'
import { apiCache } from '@/services/brasilApi/cache'

describe('Serviços BrasilAPI — CNPJ e CEP', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    apiCache.clear()
  })

  it('deve formatar e validar CNPJ corretamente', () => {
    expect(cleanCnpj('12.345.678/0001-90')).toBe('12345678000190')
    expect(formatCnpj('12345678000190')).toBe('12.345.678/0001-90')
    expect(isValidCnpjFormat('12345678000190')).toBe(true)
    expect(isValidCnpjFormat('123')).toBe(false)
  })

  it('deve consultar CNPJ e retornar dados empresariais', async () => {
    const mockCnpj = {
      cnpj: '12345678000190',
      razao_social: 'AUTO FACIL VEICULOS LTDA',
      nome_fantasia: 'AUTO FACIL SHOP',
      logradouro: 'AVENIDA PAULISTA',
      numero: '1000',
      bairro: 'BELA VISTA',
      municipio: 'SAO PAULO',
      uf: 'SP',
      cep: '01310100',
      ddd_telefone_1: '11987654321',
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockCnpj,
    } as Response)

    const data = await getCnpjDetails('12345678000190')
    expect(data.razao_social).toBe('AUTO FACIL VEICULOS LTDA')
    expect(data.uf).toBe('SP')
  })

  it('deve formatar e validar CEP corretamente', () => {
    expect(cleanCep('01310-100')).toBe('01310100')
    expect(formatCep('01310100')).toBe('01310-100')
    expect(isValidCepFormat('01310100')).toBe(true)
    expect(isValidCepFormat('123')).toBe(false)
  })

  it('deve consultar CEP e preencher endereço', async () => {
    const mockCep = {
      cep: '01310100',
      state: 'SP',
      city: 'São Paulo',
      neighborhood: 'Bela Vista',
      street: 'Avenida Paulista',
      service: 'viacep',
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockCep,
    } as Response)

    const data = await getCepDetails('01310100')
    expect(data.city).toBe('São Paulo')
    expect(data.street).toBe('Avenida Paulista')
    expect(data.state).toBe('SP')
  })
})
