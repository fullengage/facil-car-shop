// ==============================================================================
// VALIDAÇÃO E FORMATAÇÃO DE PLACAS BRASILEIRAS (PADRÃO ANTIGO & MERCOSUL)
// ==============================================================================

/**
 * Higieniza o texto da placa removendo caracteres especiais e espaços
 */
export function cleanPlate(input: string): string {
  if (!input) return '';
  return input.toUpperCase().replace(/[^A-Z0-9]/gi, '').trim();
}

/**
 * Regex para placa do modelo tradicional brasileiro (ex: ABC1234 ou ABC-1234)
 */
export const OLD_PLATE_REGEX = /^[A-Z]{3}[0-9]{4}$/;

/**
 * Regex para placa do modelo Mercosul (ex: ABC1D23 ou ABC-1D23)
 */
export const MERCOSUL_PLATE_REGEX = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

/**
 * Verifica se a placa informada é válida em qualquer formato brasileiro aceito
 */
export function isValidBrazilianPlate(plate: string): boolean {
  const cleaned = cleanPlate(plate);
  return OLD_PLATE_REGEX.test(cleaned) || MERCOSUL_PLATE_REGEX.test(cleaned);
}

/**
 * Verifica se a placa segue estritamente o padrão Mercosul
 */
export function isMercosulPlate(plate: string): boolean {
  const cleaned = cleanPlate(plate);
  return MERCOSUL_PLATE_REGEX.test(cleaned);
}

/**
 * Formata a placa com hífen legível quando aplicável
 */
export function formatPlate(plate: string): string {
  const cleaned = cleanPlate(plate);
  if (cleaned.length !== 7) return plate.toUpperCase().trim();

  // Padrão antigo: ABC-1234
  if (OLD_PLATE_REGEX.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }

  // Padrão Mercosul: BRA2E19
  return cleaned;
}

/**
 * Mascara a placa para proteger a privacidade pública do veículo
 * Conforme item 6: "A placa completa não deverá aparecer nas páginas públicas dos anúncios."
 * Exemplo: BRA2E19 -> BRA***9
 * Exemplo: ABC1234 -> ABC***4
 */
export function maskPlate(plate?: string): string {
  if (!plate) return '***-****';
  const cleaned = cleanPlate(plate);
  if (cleaned.length < 5) return '***-****';

  const prefix = cleaned.slice(0, 3);
  const suffix = cleaned.slice(-1);
  return `${prefix}***${suffix}`;
}

/**
 * Formata valores numéricos para moeda Real (BRL)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Converte strings de valor FIPE (ex: "R$ 84.500,00" ou "84500") para número
 */
export function parseFipePrice(priceString?: string | number): number {
  if (typeof priceString === 'number') return priceString;
  if (!priceString) return 0;

  // Remove "R$", pontos e troca vírgula por ponto
  const cleaned = priceString
    .replace(/[^\d,]/g, '')
    .replace(',', '.');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
