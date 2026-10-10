import { SectionTitle } from "@/components/site/ui/SectionTitle";
import { Carousel } from "@/components/site/ui/Carousel";
import { LojaCard } from "@/components/site/stores/LojaCard";
import { getLojas } from "@/lib/site/data";

/** Carrossel de lojas em destaque (cards renderizados no servidor). */
export function LojasDestaque() {
  const cards = getLojas().map((loja) => <LojaCard key={loja.id} loja={loja} />);
  return (
    <section className="bg-white py-[100px]">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionTitle eyebrow="Lojas parceiras" title="Lojas em destaque" />
        </div>
        <Carousel ariaLabel="Lojas em destaque">{cards}</Carousel>
      </div>
    </section>
  );
}
