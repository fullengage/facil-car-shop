import { describe, it, expect } from 'vitest'
import {
  slugify,
  generateVehicleSlug,
  generateVehicleMetaTitle,
  generateVehicleMetaDescription,
  generateVehicleSchemaJsonLd,
  generateBreadcrumbSchemaJsonLd,
} from '@/utils/seo'
import type { Store, Vehicle } from '@/types'

const mockStore: Store = {
  id: 'store-01',
  name: 'Auto Fácil Premium',
  address_city: 'São Paulo',
  address_state: 'SP',
  status: 'approved',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockVehicle: Vehicle = {
  id: 'veh-101',
  store_id: 'store-01',
  title: 'Toyota Corolla Altis 2.0 16V Flex Aut. 2023',
  brand: 'Toyota',
  model: 'Corolla Altis 2.0',
  model_year: 2023,
  mileage: 24500,
  price: 144900,
  fipe_price: 148900,
  fuel_type: 'Flex',
  transmission: 'Automático',
  color: 'Prata',
  photos: ['https://exemplo.com/corolla.jpg'],
  plate: 'BRA2E19',
  plate_masked: 'BRA***9',
  plate_lookup_status: 'success',
  status: 'published',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('Motor de SEO e Schema.org — Fácil Car Shop', () => {
  it('deve converter títulos com acentos e caracteres especiais em slugs perfeitos', () => {
    expect(slugify('São Paulo - Veículos & Acessórios!')).toBe('sao-paulo-veiculos-acessorios')
    expect(slugify('Chevrolet Onix Plus Premier 1.0 Turbo @ 2024')).toBe('chevrolet-onix-plus-premier-1-0-turbo-2024')
  })

  it('deve gerar slug hierárquico rico em palavras-chave para o Google', () => {
    const slug = generateVehicleSlug(mockVehicle, mockStore)
    expect(slug).toContain('toyota')
    expect(slug).toContain('corolla')
    expect(slug).toContain('2023')
    expect(slug).toContain('sao-paulo')
    expect(slug).toContain('sp')
  })

  it('deve gerar Meta Title descritivo com localização e marca', () => {
    const title = generateVehicleMetaTitle(mockVehicle, mockStore)
    expect(title).toContain('Toyota Corolla Altis 2.0')
    expect(title).toContain('São Paulo/SP')
    expect(title).toContain('Fácil Car Shop')
  })

  it('deve gerar Meta Description com gatilho de preço e desconto vs FIPE', () => {
    const desc = generateVehicleMetaDescription(mockVehicle, mockStore)
    expect(desc).toContain('144.900')
    expect(desc).toContain('abaixo da Tabela FIPE')
    expect(desc).toContain('São Paulo - SP')
    expect(desc).toContain('24.500 km')
  })

  it('deve gerar JSON-LD Schema.org/Car com proteção e privacidade de placa', () => {
    const schema = generateVehicleSchemaJsonLd(mockVehicle, mockStore) as Record<string, any>
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toContain('Car')
    expect(schema.brand.name).toBe('Toyota')
    expect(schema.vehicleModelDate).toBe(2023)
    expect(schema.offers.price).toBe(144900)
    expect(schema.offers.priceCurrency).toBe('BRL')

    // Garantia de privacidade LGPD: placa mascarada apenas
    expect(schema.vehicleIdentificationNumber).toBe('BRA***9')
    expect(schema.vehicleIdentificationNumber).not.toBe('BRA2E19')
  })

  it('deve gerar Breadcrumbs hierárquicos para o Google', () => {
    const breadcrumb = generateBreadcrumbSchemaJsonLd(mockVehicle, mockStore) as Record<string, any>
    expect(breadcrumb['@type']).toBe('BreadcrumbList')
    expect(breadcrumb.itemListElement).toHaveLength(4)
    expect(breadcrumb.itemListElement[0].name).toBe('Início')
    expect(breadcrumb.itemListElement[2].name).toBe('Toyota')
  })
})
