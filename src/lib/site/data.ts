// ==============================================================================
// CAMADA DE DADOS — hoje lê /data/*.json; trocar por Supabase aqui, sem mexer nos componentes
// ==============================================================================

import cidadesJson from "@/data/cidades.json";
import lojasJson from "@/data/lojas.json";
import marcasJson from "@/data/marcas.json";
import postsJson from "@/data/posts.json";
import veiculosJson from "@/data/veiculos.json";
import type { Cidade, Loja, Marca, Post, Veiculo } from "@/lib/site/types";

const veiculos = veiculosJson as Veiculo[];
const lojas = lojasJson as Loja[];
const marcas = marcasJson as Marca[];
const cidades = cidadesJson as Cidade[];
const posts = postsJson as Post[];

export function getVeiculos(): Veiculo[] {
  return veiculos;
}

export function getVeiculoBySlug(slug: string): Veiculo | undefined {
  return veiculos.find((v) => v.slug === slug);
}

export function getLojas(): Loja[] {
  return lojas;
}

export function getLojaBySlug(slug: string): Loja | undefined {
  return lojas.find((l) => l.slug === slug);
}

export function getLojaById(id: string): Loja | undefined {
  return lojas.find((l) => l.id === id);
}

export function getMarcas(): Marca[] {
  return marcas;
}

export function getMarcaBySlug(slug: string): Marca | undefined {
  return marcas.find((m) => m.slug === slug);
}

export function getCidades(): Cidade[] {
  return cidades;
}

export function getCidadeBySlug(slug: string): Cidade | undefined {
  return cidades.find((c) => c.slug === slug);
}

export function getPosts(): Post[] {
  return posts;
}

/** Veículos de uma loja, mais recentes primeiro. */
export function getVeiculosDaLoja(lojaId: string): Veiculo[] {
  return veiculos.filter((v) => v.lojaId === lojaId);
}

/** Veículos "semelhantes": mesma carroceria ou marca, excluindo o próprio. */
export function getSemelhantes(veiculo: Veiculo, limite = 3): Veiculo[] {
  return veiculos
    .filter((v) => v.id !== veiculo.id && (v.carroceria === veiculo.carroceria || v.marca === veiculo.marca))
    .slice(0, limite);
}
