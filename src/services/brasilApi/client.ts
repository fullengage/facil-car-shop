// ==============================================================================
// CLIENTE BASE BRASILAPI (CACHE, TIMEOUT & LOGS DE AUDITORIA)
// ==============================================================================

import { recordExternalQuery } from '@/services/apiLogger'
import { apiCache } from './cache'

export const BRASIL_API_BASE_URL = 'https://brasilapi.com.br/api'
const DEFAULT_TIMEOUT_MS = 10000 // 10 segundos

export interface RequestOptions {
  timeoutMs?: number
  ttlMs?: number // Se definido, utiliza cache
  queryType?: string
  metadata?: Record<string, unknown>
}

export class BrasilApiError extends Error {
  statusCode?: number
  originalError?: unknown

  constructor(
    message: string,
    statusCode?: number,
    originalError?: unknown
  ) {
    super(message)
    this.name = 'BrasilApiError'
    this.statusCode = statusCode
    this.originalError = originalError
  }
}

/**
 * Executa requisição HTTP segura contra a BrasilAPI
 */
export async function fetchBrasilApi<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ttlMs = 0,
    queryType = 'generic',
    metadata = {},
  } = options

  const cacheKey = `brasilapi:${endpoint}`

  // 1. Verificação de Cache
  if (ttlMs > 0) {
    const cached = apiCache.get<T>(cacheKey)
    if (cached !== null) {
      recordExternalQuery({
        provider: 'brasilapi',
        query_type: queryType,
        status: 'cached',
        response_time_ms: 1,
        endpoint,
        metadata: { ...metadata, cached: true },
      })
      return cached
    }
  }

  const startTime = performance.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const url = `${BRASIL_API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    clearTimeout(timeoutId)
    const duration = performance.now() - startTime

    if (!response.ok) {
      let errorMessage = `Erro ${response.status} na BrasilAPI`
      try {
        const errorBody = await response.json()
        if (errorBody && typeof errorBody.message === 'string') {
          errorMessage = errorBody.message
        }
      } catch {
        // Se a resposta de erro não for JSON
      }

      recordExternalQuery({
        provider: 'brasilapi',
        query_type: queryType,
        status: 'error',
        response_time_ms: duration,
        endpoint,
        metadata: { ...metadata, statusCode: response.status, error: errorMessage },
      })

      throw new BrasilApiError(errorMessage, response.status)
    }

    const data = (await response.json()) as T

    recordExternalQuery({
      provider: 'brasilapi',
      query_type: queryType,
      status: 'success',
      response_time_ms: duration,
      endpoint,
      metadata,
    })

    // Salva no cache
    if (ttlMs > 0) {
      apiCache.set(cacheKey, data, ttlMs)
    }

    return data
  } catch (error: unknown) {
    clearTimeout(timeoutId)
    const duration = performance.now() - startTime

    if (error instanceof BrasilApiError) {
      throw error
    }

    const isTimeout =
      error instanceof DOMException && error.name === 'AbortError'

    const errorStatus = isTimeout ? 'timeout' : 'error'
    const errorMsg = isTimeout
      ? 'Tempo limite de resposta excedido (Timeout)'
      : error instanceof Error
        ? error.message
        : 'Erro desconhecido de conexão com a BrasilAPI'

    recordExternalQuery({
      provider: 'brasilapi',
      query_type: queryType,
      status: errorStatus,
      response_time_ms: duration,
      endpoint,
      metadata: { ...metadata, error: errorMsg },
    })

    throw new BrasilApiError(errorMsg, isTimeout ? 408 : 500, error)
  }
}
