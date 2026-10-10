// ==============================================================================
// ROTEAMENTO DE VITRINES — DOMÍNIO PRÓPRIO OU /loja/<slug>
// Visitante em minhaloja.com.br (domínio verificado) ou em <plataforma>/loja/<slug>
// vê a vitrine da loja; qualquer outro acesso vai para o painel da plataforma.
// ==============================================================================

import type { Store } from '@/types'
import { getStoreByDomain, getStoreBySlug } from './storeService'

export type Tenant = { kind: 'platform' } | { kind: 'store'; store: Store }

// Host da plataforma (ex: facilcarshop.com.br). Vazio em desenvolvimento local.
const PLATFORM_HOST = (import.meta.env.VITE_PLATFORM_HOST as string | undefined) ?? ''
const SLUG_PATH = /^\/loja\/([a-z0-9-]+)\/?$/

export async function resolveTenant(): Promise<Tenant> {
  const { hostname, pathname } = window.location
  const isPlatformHost =
    !PLATFORM_HOST || hostname === PLATFORM_HOST || hostname === 'localhost' || hostname === '127.0.0.1'

  if (!isPlatformHost) {
    const store = await getStoreByDomain(hostname)
    if (store) return { kind: 'store', store }
    return { kind: 'platform' }
  }

  const slug = SLUG_PATH.exec(pathname)?.[1]
  if (slug) {
    const store = await getStoreBySlug(slug)
    if (store) return { kind: 'store', store }
  }

  return { kind: 'platform' }
}
