import { Star } from "lucide-react";
import { SectionTitle } from "@/components/site/ui/SectionTitle";
import { Carousel } from "@/components/site/ui/Carousel";

// Depoimentos de exemplo: substituir por avaliações reais
const DEPOIMENTOS = [
  { nome: "Mariana Costa", cidade: "Campinas, SP", texto: "Encontrei um SUV dentro do meu orçamento e a loja respondeu no WhatsApp em minutos. Comprei sem dor de cabeça." },
  { nome: "Rafael Almeida", cidade: "Curitiba, PR", texto: "A comparação com a FIPE me ajudou a negociar. Paguei abaixo do valor de referência e recebi o carro revisado." },
  { nome: "Juliana Ferreira", cidade: "Belo Horizonte, MG", texto: "Pesquisei por cidade e por carroceria, achei três opções e fechei em uma semana. Muito prático." },
  { nome: "Carlos Mendes", cidade: "Rio de Janeiro, RJ", texto: "Anunciei minha picape e recebi contatos qualificados logo na primeira semana. Plataforma simples de usar." },
];

export function Depoimentos() {
  const cards = DEPOIMENTOS.map((d) => (
    <figure key={d.nome} className="flex h-full flex-col gap-6 rounded-brand bg-surface p-9">
      <div className="flex gap-1" aria-label="Avaliação 5 de 5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-accent text-accent" aria-hidden />
        ))}
      </div>
      <blockquote className="text-[17px] leading-[28px] text-dark">“{d.texto}”</blockquote>
      <figcaption className="mt-auto">
        <p className="font-bold text-dark">{d.nome}</p>
        <p className="text-[14px]">{d.cidade}</p>
      </figcaption>
    </figure>
  ));

  return (
    <section className="bg-white py-[100px]">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="mb-14">
          <SectionTitle eyebrow="Depoimentos" title="O que dizem quem já comprou" />
        </div>
        <Carousel ariaLabel="Depoimentos de clientes">{cards}</Carousel>
      </div>
    </section>
  );
}
