// ==============================================================================
// UTILITÁRIO DE SEO — FÁCIL CAR SHOP
// Slugs amigáveis, Meta tags dinâmicas e Dados Estruturados Schema.org (JSON-LD)
// ==============================================================================

import type { Store, Vehicle } from '@/types'
import { formatCurrency, maskPlate } from './plateValidator'

export const SITE_NAME = 'Fácil Car Shop'
export const DEFAULT_SITE_URL = 'https://facilcarshop.com.br'

/**
 * Converte textos em slugs amigáveis para URLs do Google
 * Ex: "Toyota Corolla Altis 2.0!" -> "toyota-corolla-altis-2-0"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Separa acentos
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\./g, '-') // Converte pontos em traços (ex: 1.0 -> 1-0)
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-') // Espaços para traços
    .replace(/-+/g, '-') // Traços duplicados para único
}

/**
 * Gera um slug de URL rico em palavras-chave para o veículo
 * Formato: /carros/{estado}/{cidade}/{marca}-{modelo}-{ano}-{id}
 * Ex: "toyota-corolla-altis-2023-sao-paulo-sp-demo-veh-001"
 */
export function generateVehicleSlug(vehicle: Partial<Vehicle>, store?: Store): string {
  const parts: string[] = []

  if (vehicle.brand) parts.push(vehicle.brand)
  if (vehicle.model) parts.push(vehicle.model)
  if (vehicle.model_year) parts.push(String(vehicle.model_year))
  if (store?.address_city) parts.push(store.address_city)
  if (store?.address_state) parts.push(store.address_state)
  if (vehicle.id) parts.push(vehicle.id)

  return slugify(parts.join(' '))
}

/**
 * Gera um Meta Title otimizado para o Google (máx 60 caracteres ideais)
 * Ex: "Toyota Corolla Altis 2023 Prata em São Paulo/SP | Fácil Car Shop"
 */
export function generateVehicleMetaTitle(vehicle: Partial<Vehicle>, store?: Store): string {
  const brandModel = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim()
  const year = vehicle.model_year ? ` ${vehicle.model_year}` : ''
  const location = store?.address_city && store?.address_state ? ` em ${store.address_city}/${store.address_state}` : ''

  return `${brandModel}${year}${location} | ${SITE_NAME}`
}

/**
 * Gera uma Meta Description com alto poder de conversão (CTR) para o Google
 * Inclui: Preço, Comparação FIPE, Quilometragem, Localização e Call-to-action
 */
export function generateVehicleMetaDescription(vehicle: Partial<Vehicle>, store?: Store): string {
  const title = vehicle.title || `${vehicle.brand} ${vehicle.model} ${vehicle.model_year}`
  const price = vehicle.price ? `por ${formatCurrency(vehicle.price)}` : 'com o melhor preço'

  let fipeText = ''
  if (vehicle.fipe_price && vehicle.price && vehicle.price < vehicle.fipe_price) {
    const diffPercent = (((vehicle.fipe_price - vehicle.price) / vehicle.fipe_price) * 100).toFixed(1)
    fipeText = ` — ${diffPercent}% abaixo da Tabela FIPE (${formatCurrency(vehicle.fipe_price)})`
  }

  const kmText = vehicle.mileage ? `, ${vehicle.mileage.toLocaleString('pt-BR')} km rodados` : ''
  const cityText = store?.address_city && store?.address_state ? ` em ${store.address_city} - ${store.address_state}` : ''

  return `Compre seu ${title} ${price}${fipeText}${kmText}${cityText} na ${store?.name || SITE_NAME}. Confira fotos em alta resolução, laudo e garantia!`
}

/**
 * Gera o JSON-LD Schema.org/Car e Schema.org/Offer oficial reconhecido pelo Google
 * Permite exibição de Rich Snippets com preço, estoque e fotos na busca orgânica.
 */
export function generateVehicleSchemaJsonLd(
  vehicle: Vehicle,
  store?: Store,
  pageUrl?: string
): Record<string, unknown> {
  const url = pageUrl || `${DEFAULT_SITE_URL}/carros/${generateVehicleSlug(vehicle, store)}`
  const photoList = vehicle.photos && vehicle.photos.length > 0
    ? vehicle.photos
    : [`${DEFAULT_SITE_URL}/placeholder-car.jpg`]

  return {
    '@context': 'https://schema.org',
    '@type': ['Car', 'Product'],
    '@id': url,
    url: url,
    name: vehicle.title,
    description: vehicle.description || generateVehicleMetaDescription(vehicle, store),
    image: photoList,
    brand: {
      '@type': 'Brand',
      name: vehicle.brand,
    },
    model: vehicle.model,
    vehicleModelDate: vehicle.model_year,
    productionDate: vehicle.manufacturing_year || vehicle.model_year,
    vehicleTransmission: vehicle.transmission || 'Manual',
    fuelType: vehicle.fuel_type || 'Flex',
    color: vehicle.color || 'Prata',
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: vehicle.mileage,
      unitCode: 'KMT',
    },
    // Proteção LGPD: exibe apenas a placa mascarada para rastreabilidade pública
    vehicleIdentificationNumber: vehicle.plate_masked || maskPlate(vehicle.plate),
    itemCondition: 'https://schema.org/UsedCondition',
    offers: {
      '@type': 'Offer',
      price: vehicle.price,
      priceCurrency: 'BRL',
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/UsedCondition',
      availability: vehicle.status === 'published' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: url,
      seller: store
        ? {
            '@type': 'AutoDealer',
            name: store.name,
            telephone: store.phone,
            email: store.email,
            address: {
              '@type': 'PostalAddress',
              streetAddress: `${store.address_street || ''}, ${store.address_number || ''}`,
              addressLocality: store.address_city,
              addressRegion: store.address_state,
              postalCode: store.cep,
              addressCountry: 'BR',
            },
          }
        : {
            '@type': 'AutoDealer',
            name: SITE_NAME,
          },
    },
  }
}

/**
 * Gera o JSON-LD BreadcrumbList para navegação hierárquica no Google
 */
export function generateBreadcrumbSchemaJsonLd(vehicle: Vehicle, store?: Store): Record<string, unknown> {
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Início',
      item: DEFAULT_SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: store?.address_state ? `Carros em ${store.address_state}` : 'Carros',
      item: `${DEFAULT_SITE_URL}/carros/${store?.address_state ? slugify(store.address_state) : ''}`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: vehicle.brand,
      item: `${DEFAULT_SITE_URL}/carros/${slugify(vehicle.brand)}`,
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: vehicle.title,
      item: `${DEFAULT_SITE_URL}/carros/${generateVehicleSlug(vehicle, store)}`,
    },
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  }
}

/**
 * Gera o JSON-LD WebSite com Sitelinks Searchbox
 */
export function generateWebsiteSchemaJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: DEFAULT_SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${DEFAULT_SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}
