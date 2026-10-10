// ==============================================================================
// AUDITORIA E LOG DE CONSULTAS EXTERNAS (EXTERNAL_API_QUERIES)
// Conforme Item 6: "Não registrar placas completas em logs genéricos de auditoria."
// ==============================================================================

import type { ExternalApiQueryLog } from '@/types'

// Armazenamento em memória para dashboard e inspeção em tempo real
const inMemoryLogs: ExternalApiQueryLog[] = []
const MAX_LOGS = 100

type LogListener = (logs: ExternalApiQueryLog[]) => void
const listeners = new Set<LogListener>()

export function subscribeToApiLogs(listener: LogListener): () => void {
  listeners.add(listener)
  listener([...inMemoryLogs])
  return () => {
    listeners.delete(listener)
  }
}

export interface LogApiQueryParams {
  provider: string
  query_type: string
  status: 'success' | 'error' | 'cached' | 'timeout'
  response_time_ms: number
  endpoint?: string
  userId?: string
  storeId?: string
  metadata?: Record<string, unknown>
}

/**
 * Higieniza metadados para garantir que informações sensíveis (como placa completa)
 * não sejam salvas em logs de auditoria.
 */
function sanitizeMetadata(raw?: Record<string, unknown>): Record<string, unknown> {
  if (!raw) return {}
  const sanitized: Record<string, unknown> = { ...raw }

  // Se houver placa nos metadados, manter apenas a versão mascarada
  if (typeof sanitized.plate === 'string') {
    const p = sanitized.plate.replace(/[^A-Z0-9]/gi, '')
    sanitized.plate_masked = p.length >= 5 ? `${p.slice(0, 3)}***${p.slice(-1)}` : '***'
    delete sanitized.plate
  }

  return sanitized
}

/**
 * Registra a execução de uma consulta externa
 */
export function recordExternalQuery(params: LogApiQueryParams): ExternalApiQueryLog {
  const entry: ExternalApiQueryLog = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}-${Math.random()}`,
    user_id: params.userId,
    store_id: params.storeId,
    provider: params.provider,
    query_type: params.query_type,
    status: params.status,
    requested_at: new Date().toISOString(),
    response_time_ms: Math.round(params.response_time_ms),
    endpoint: params.endpoint,
    metadata: sanitizeMetadata(params.metadata),
  }

  inMemoryLogs.unshift(entry)
  if (inMemoryLogs.length > MAX_LOGS) {
    inMemoryLogs.pop()
  }

  // Notifica ouvintes da UI
  listeners.forEach((listener) => listener([...inMemoryLogs]))

  return entry
}

export function getRecentApiLogs(): ExternalApiQueryLog[] {
  return [...inMemoryLogs]
}

export function clearApiLogs(): void {
  inMemoryLogs.length = 0
  listeners.forEach((listener) => listener([]))
}
