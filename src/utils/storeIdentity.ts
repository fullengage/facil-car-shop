// ==============================================================================
// IDENTIDADE DA LOJA — SLUG DA VITRINE E DOMÍNIO PRÓPRIO
// ==============================================================================

/** "Auto Fácil Premium" -> "auto-facil-premium" */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const DOMAIN_REGEX = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

/**
 * Aceita "https://www.Minha-Loja.com.br/" e devolve "www.minha-loja.com.br".
 * Retorna null se não for um domínio válido.
 */
export function normalizeDomain(input: string): string | null {
  const host = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
  return DOMAIN_REGEX.test(host) ? host : null
}
