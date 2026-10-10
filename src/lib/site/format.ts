const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR");

/** 144900 -> "R$ 144.900,00" */
export function formatBRL(valor: number): string {
  return brl.format(valor);
}

/** 24500 -> "24.500 km" */
export function formatKm(km: number): string {
  return `${numero.format(km)} km`;
}

/** Preço curto para cards de cidade/marca: 144900 -> "R$ 144,9 mil" */
export function formatBRLCurto(valor: number): string {
  return valor >= 1_000_000
    ? `R$ ${(valor / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`
    : `R$ ${(valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
}
