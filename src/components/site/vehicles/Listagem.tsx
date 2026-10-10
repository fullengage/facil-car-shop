import { Suspense } from "react";
import { Breadcrumbs, type Crumb } from "@/components/site/ui/Breadcrumbs";
import { FiltrosSidebar } from "@/components/site/vehicles/FiltrosSidebar";
import { Ordenacao } from "@/components/site/vehicles/Ordenacao";
import { Paginacao } from "@/components/site/vehicles/Paginacao";
import { VehicleCard } from "@/components/site/vehicles/VehicleCard";
import { getCidades, getMarcas } from "@/lib/site/data";
import { filtrarVeiculos, lerFiltros, paginar } from "@/lib/site/filters";
import type { Veiculo } from "@/lib/site/types";
import { itemListLd, jsonLdProps } from "@/lib/site/seo";

type SearchParams = Record<string, string | string[] | undefined>;

interface Props {
  /** Conjunto base (todos os veículos, ou só os de uma marca/cidade/modelo) */
  veiculos: Veiculo[];
  /** Caminho da página, sem query. Usado na paginação e no JSON-LD. */
  base: string;
  searchParams: SearchParams;
  h1: string;
  intro: string;
  crumbs: Crumb[];
  /** Quando já estamos numa página de marca, esconde o filtro de marca */
  marcaFixa?: string;
}

/**
 * Layout de listagem: breadcrumbs, H1 e texto próprio, filtros laterais, ordenação e grade.
 * Usado por /carros, /carros/[marca], /carros/[marca]/[modelo] e /carros-em/[cidade].
 */
export function Listagem({ veiculos, base, searchParams, h1, intro, crumbs, marcaFixa }: Props) {
  const filtros = lerFiltros(searchParams);
  const filtrados = filtrarVeiculos(veiculos, filtros);
  const { itens, pagina, paginas } = paginar(filtrados, filtros.pagina);

  // Query sem "page", para a paginação preservar filtros e ordenação
  const query: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (k !== "page") query[k] = Array.isArray(v) ? v[0] : v;
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12">
      <script {...jsonLdProps(itemListLd(h1, filtrados))} />
      <Breadcrumbs itens={[{ nome: "Carros", path: "/carros" }, ...crumbs]} />

      <header className="mb-10 mt-6 max-w-[760px] space-y-4">
        <h1>{h1}</h1>
        <p className="text-[18px] leading-[30px]">{intro}</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <Suspense fallback={null}>
          <FiltrosSidebar marcas={getMarcas()} cidades={getCidades()} marcaFixa={marcaFixa} />
        </Suspense>

        <div className="min-w-0 space-y-8">
          <Suspense fallback={null}>
            <Ordenacao total={filtrados.length} />
          </Suspense>

          {itens.length > 0 ? (
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3">
              {itens.map((v) => (
                <VehicleCard key={v.id} v={v} />
              ))}
            </div>
          ) : (
            <div className="rounded-brand bg-surface p-12 text-center">
              <p className="text-[18px] text-dark">Nenhum veículo com esses filtros.</p>
              <p className="mt-2">Ajuste os filtros ou veja todos os carros disponíveis.</p>
            </div>
          )}

          <Paginacao pagina={pagina} paginas={paginas} base={base} query={query} />
        </div>
      </div>
    </div>
  );
}
