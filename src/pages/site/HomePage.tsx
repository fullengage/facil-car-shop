import { Seo } from "@/components/site/Seo";
import { Hero } from "@/components/site/home/Hero";
import { Categorias } from "@/components/site/home/Categorias";
import { Destaques } from "@/components/site/home/Destaques";
import { LojistaBloco } from "@/components/site/home/LojistaBloco";
import { ComoComprar } from "@/components/site/home/ComoComprar";
import { LojasDestaque } from "@/components/site/home/LojasDestaque";
import { Planos } from "@/components/site/home/Planos";
import { Depoimentos } from "@/components/site/home/Depoimentos";
import { FaqSection, FAQ } from "@/components/site/home/FaqSection";
import { AnuncieForm } from "@/components/site/home/AnuncieForm";
import { CtaBand } from "@/components/site/home/CtaBand";
import { BlogTeaser } from "@/components/site/home/BlogTeaser";
import { Marquee } from "@/components/site/ui/Marquee";
import { SectionTitle } from "@/components/site/ui/SectionTitle";
import { getMarcas, getVeiculos } from "@/lib/site/data";
import { faqLd, jsonLdProps } from "@/lib/site/seo";


export default function HomePage() {
  const marcas = getMarcas();
  const veiculos = getVeiculos();
  // Destaques primeiro; depois os mais recentes
  const destaques = [...veiculos].sort((a, b) => Number(b.destaque) - Number(a.destaque) || b.publicadoEm.localeCompare(a.publicadoEm));

  return (
    <>
      <Seo title="Carros seminovos e usados perto de você" description="Compare carros seminovos e usados de lojas da sua cidade, com preço comparado à Tabela FIPE e contato direto pelo WhatsApp." canonical="/" />
      <script {...jsonLdProps(faqLd(FAQ))} />
      <Hero />
      <Categorias />

      <div id="marcas" className="scroll-mt-28 border-y border-border bg-white">
        <Marquee
          variant="outline"
          items={marcas.map((m) => <span key={m.slug}>{m.nome}</span>)}
        />
      </div>

      <section className="bg-white py-[100px]">
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="mb-14">
            <SectionTitle eyebrow="Destaques" title="Carros em destaque" />
          </div>
          <Destaques veiculos={destaques} />
        </div>
      </section>

      <LojistaBloco />
      <ComoComprar />
      <LojasDestaque />
      <Planos />
      <Depoimentos />
      <FaqSection />
      <AnuncieForm />
      <CtaBand />
      <BlogTeaser />
    </>
  );
}
