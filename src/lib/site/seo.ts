// ==============================================================================
// SEO — URL base, metadados padrão e JSON-LD
// ==============================================================================

import type { Loja, Veiculo } from "@/lib/site/types";
import { formatBRL } from "@/lib/site/format";

export const SITE_NAME = "Fácil Car Shop";
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function breadcrumbLd(itens: { nome: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.nome,
      item: absoluteUrl(item.path),
    })),
  };
}

export function veiculoLd(v: Veiculo, loja: Loja | undefined) {
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: v.titulo,
    brand: { "@type": "Brand", name: v.marca },
    model: v.modelo,
    vehicleModelDate: String(v.ano),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: v.km, unitCode: "KMT" },
    color: v.cor,
    fuelType: v.combustivel,
    vehicleTransmission: v.cambio,
    image: v.fotos,
    description: v.descricao,
    offers: {
      "@type": "Offer",
      price: v.preco,
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      seller: loja ? { "@type": "AutoDealer", name: loja.nome } : undefined,
    },
  };
}

export function lojaLd(loja: Loja) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: loja.nome,
    description: loja.descricao,
    telephone: loja.telefone,
    email: loja.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: loja.endereco,
      addressLocality: loja.cidade,
      addressRegion: loja.uf,
      addressCountry: "BR",
    },
    openingHours: loja.horario,
    aggregateRating: { "@type": "AggregateRating", ratingValue: loja.avaliacao, bestRating: 5, ratingCount: 10 },
  };
}

export function itemListLd(nome: string, veiculos: Veiculo[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: nome,
    itemListElement: veiculos.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/veiculo/${v.slug}`),
      name: `${v.titulo} - ${formatBRL(v.preco)}`,
    })),
  };
}

export function faqLd(itens: { pergunta: string; resposta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: itens.map((i) => ({
      "@type": "Question",
      name: i.pergunta,
      acceptedAnswer: { "@type": "Answer", text: i.resposta },
    })),
  };
}

/** Componente de script JSON-LD: <JsonLd data={...} /> */
export function jsonLdProps(data: object) {
  return { type: "application/ld+json", dangerouslySetInnerHTML: { __html: JSON.stringify(data) } };
}
