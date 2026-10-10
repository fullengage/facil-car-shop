// ==============================================================================
// SISTEMA DE CACHE COM TTL PARA APIS EXTERNAS
// Evita requisições redundantes e respeita termos de uso das APIs
// ==============================================================================

interface CacheItem<T> {
  data: T
  expiresAt: number
}

class ApiCache {
  private memoryCache = new Map<string, CacheItem<unknown>>()

  /**
   * Obtém item do cache caso ainda esteja dentro do TTL
   */
  get<T>(key: string): T | null {
    const item = this.memoryCache.get(key)
    if (!item) return null

    if (Date.now() > item.expiresAt) {
      this.memoryCache.delete(key)
      return null
    }

    return item.data as T
  }

  /**
   * Grava item no cache com TTL em milissegundos
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.memoryCache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    })
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.memoryCache.clear()
  }

  /**
   * Remove chaves específicas ou por prefixo
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key)
      }
    }
  }
}

export const apiCache = new ApiCache()
