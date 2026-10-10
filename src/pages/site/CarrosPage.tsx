import { useMemo } from "react";
import { Listagem } from "@/components/site/vehicles/Listagem";
import { Seo } from "@/components/site/Seo";
import { getVeiculos } from "@/lib/site/data";
import { useSearchParamsObject } from "@/pages/site/params";

export default function CarrosPage() {
  const searchParams = useSearchParamsObject();
  const veiculos = useMemo(() => getVeiculos(), []);
  return (
    <>
      <Seo
        title="Carros seminovos e usados à venda"
        description="Veja todos os carros seminovos e usados anunciados por lojas e revendas. Filtre por marca, preço, ano, cidade e carroceria."
        canonical="/carros"
      />
      <Listagem
        veiculos={veiculos}
        base="/carros"
        searchParams={searchParams}
        h1="Carros seminovos e usados"
        intro="Todos os veículos anunciados pelas lojas parceiras. Use os filtros para encontrar o carro certo e compare com a Tabela FIPE em cada anúncio."
        crumbs={[]}
      />
    </>
  );
}
