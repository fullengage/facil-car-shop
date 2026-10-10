// ==============================================================================
// FILTROS, ORDENAÇÃO E PAGINAÇÃO DA LISTAGEM — tudo via query string (?marca=...&page=2)
// ==============================================================================

import type { Veiculo } from "@/lib/site/types";

export const POR_PAGINA = 12;

export type Ordenacao = "recentes" | "preco-asc" | "preco-desc" | "km-asc" | "ano-desc";

export interface FiltrosVeiculo {
  marca?: string;
  modelo?: string;
  carroceria?: string;
  cambio?: string;
  combustivel?: string;
  cidade?: string;
  precoMin?: number;
  precoMax?: number;
  anoMin?: number;
  kmMax?: number;
  ordenar: Ordenacao;
  pagina: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

function texto(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() || undefined;
}

function numero(v: string | string[] | undefined): number | undefined {
  const n = Number(texto(v));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function lerFiltros(sp: SearchParams): FiltrosVeiculo {
  const ordenar = (texto(sp.ordenar) as Ordenacao) ?? "recentes";
  return {
    marca: texto(sp.marca),
    modelo: texto(sp.modelo),
    carroceria: texto(sp.carroceria),
    cambio: texto(sp.cambio),
    combustivel: texto(sp.combustivel),
    cidade: texto(sp.cidade),
    precoMin: numero(sp.precoMin),
    precoMax: numero(sp.precoMax),
    anoMin: numero(sp.anoMin),
    kmMax: numero(sp.kmMax),
    ordenar: ["recentes", "preco-asc", "preco-desc", "km-asc", "ano-desc"].includes(ordenar) ? ordenar : "recentes",
    pagina: Math.max(1, Math.floor(numero(sp.page) ?? 1)),
  };
}

export function filtrarVeiculos(lista: Veiculo[], f: FiltrosVeiculo): Veiculo[] {
  const filtrados = lista.filter((v) => {
    if (f.marca && v.marca !== f.marca) return false;
    if (f.modelo && v.modelo.toLowerCase() !== f.modelo.toLowerCase()) return false;
    if (f.carroceria && v.carroceria !== f.carroceria) return false;
    if (f.cambio && v.cambio !== f.cambio) return false;
    if (f.combustivel && v.combustivel !== f.combustivel) return false;
    if (f.cidade && v.cidade !== f.cidade) return false;
    if (f.precoMin && v.preco < f.precoMin) return false;
    if (f.precoMax && v.preco > f.precoMax) return false;
    if (f.anoMin && v.ano < f.anoMin) return false;
    if (f.kmMax && v.km > f.kmMax) return false;
    return true;
  });

  const ordem: Record<Ordenacao, (a: Veiculo, b: Veiculo) => number> = {
    recentes: (a, b) => b.publicadoEm.localeCompare(a.publicadoEm),
    "preco-asc": (a, b) => a.preco - b.preco,
    "preco-desc": (a, b) => b.preco - a.preco,
    "km-asc": (a, b) => a.km - b.km,
    "ano-desc": (a, b) => b.ano - a.ano,
  };
  return [...filtrados].sort(ordem[f.ordenar]);
}

export function paginar<T>(lista: T[], pagina: number): { itens: T[]; total: number; paginas: number; pagina: number } {
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const atual = Math.min(pagina, paginas);
  const inicio = (atual - 1) * POR_PAGINA;
  return { itens: lista.slice(inicio, inicio + POR_PAGINA), total: lista.length, paginas, pagina: atual };
}

/** Monta a URL mantendo os demais filtros: montarQuery(f, { page: 2 }) */
export function montarQuery(f: Partial<Record<string, string | number | undefined>>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v !== undefined && v !== "" && v !== 0) params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}
