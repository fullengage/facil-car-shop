import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getFipeBrands,
  getFipeDetails,
  getFipeModels,
  getFipePriceByCode,
  getFipeYears,
} from '@/services/brasilApi/fipeService'
import { apiCache } from '@/services/brasilApi/cache'

describe('Serviço BrasilAPI — Tabela FIPE', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    apiCache.clear()
  })

  it('deve listar marcas de carros com sucesso', async () => {
    const mockBrands = [
      { nome: 'Toyota', valor: '56' },
      { nome: 'Fiat', valor: '21' },
      { nome: 'Jeep', valor: '137' },
    ]

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBrands,
    } as Response)

    const brands = await getFipeBrands('carros')
    expect(brands).toHaveLength(3)
    expect(brands[0].nome).toBe('Toyota')
    expect(brands[0].valor).toBe('56')
  })

  it('deve buscar modelos para uma marca selecionada', async () => {
    const mockModels = [
      { nome: 'Corolla Altis 2.0', valor: '5840' },
      { nome: 'Yaris Sedan 1.5', valor: '6102' },
    ]

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockModels,
    } as Response)

    const models = await getFipeModels('56', 'carros')
    expect(models).toHaveLength(2)
    expect(models[0].nome).toContain('Corolla')
  })

  it('deve buscar anos de um modelo', async () => {
    const mockYears = [
      { nome: '2024 Gasolina', valor: '2024-1' },
      { nome: '2023 Gasolina', valor: '2023-1' },
    ]

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockYears,
    } as Response)

    const years = await getFipeYears('56', '5840', 'carros')
    expect(years).toHaveLength(2)
    expect(years[0].valor).toBe('2024-1')
  })

  it('deve buscar detalhes e preço FIPE oficial do veículo', async () => {
    const mockDetail = {
      valor: 'R$ 148.900,00',
      marca: 'Toyota',
      modelo: 'Corolla Altis 2.0 16V Flex Aut.',
      anoModelo: 2023,
      combustivel: 'Flex',
      codigoFipe: '002166-0',
      mesReferencia: 'outubro de 2026',
      tipoVeiculo: 1,
      siglaCombustivel: 'G',
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockDetail,
    } as Response)

    const detail = await getFipeDetails('56', '5840', '2023-1', 'carros')
    expect(detail.codigoFipe).toBe('002166-0')
    expect(detail.valor).toBe('R$ 148.900,00')
    expect(detail.marca).toBe('Toyota')
  })

  it('deve buscar preço diretamente por código FIPE', async () => {
    const mockList = [
      {
        valor: 'R$ 148.900,00',
        marca: 'Toyota',
        modelo: 'Corolla Altis 2.0',
        anoModelo: 2023,
        combustivel: 'Gasolina',
        codigoFipe: '002166-0',
        mesReferencia: 'outubro de 2026',
        tipoVeiculo: 1,
        siglaCombustivel: 'G',
      },
    ]

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockList,
    } as Response)

    const result = await getFipePriceByCode('002166-0')
    expect(result).toHaveLength(1)
    expect(result[0].codigoFipe).toBe('002166-0')
  })

  it('deve reutilizar cache na segunda chamada sem disparar novo fetch', async () => {
    const mockBrands = [{ nome: 'Honda', valor: '25' }]

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockBrands,
    } as Response)

    // Primeira chamada: busca na rede
    await getFipeBrands('carros')
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Segunda chamada: deve vir do cache em memória
    await getFipeBrands('carros')
    expect(fetchSpy).toHaveBeenCalledTimes(1) // Não chamou fetch novamente!
  })
})
