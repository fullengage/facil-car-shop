import Image from "@/components/site/Image";
import { Eye, BadgeDollarSign, Users } from "lucide-react";
import { SectionTitle } from "@/components/site/ui/SectionTitle";
import { Button } from "@/components/site/ui/Button";

const ITENS = [
  { icon: Users, titulo: "Alcance quem está comprando", texto: "Seu estoque aparece para quem já pesquisa carros na sua cidade e região." },
  { icon: BadgeDollarSign, titulo: "Preço comparado à FIPE", texto: "Cada anúncio mostra a referência da Tabela FIPE, o que transmite confiança ao comprador." },
  { icon: Eye, titulo: "Painel simples", texto: "Cadastre, edite e pause anúncios em poucos cliques, sem depender de terceiros." },
];

/** Bloco laranja com padrão de linhas e card escuro sobreposto: "Como funciona para o lojista". */
export function LojistaBloco() {
  return (
    <section className="relative overflow-hidden bg-primary py-[100px]">
      {/* Padrão de linhas geométricas sutis */}
      <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.12]" preserveAspectRatio="none" viewBox="0 0 1440 600">
        <g stroke="#171717" strokeWidth="1" fill="none">
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={i} x1={i * 120} y1="0" x2={i * 90 + 300} y2="600" />
          ))}
          <polyline points="0,420 320,180 700,360 1040,120 1440,300" />
        </g>
      </svg>

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-5 lg:grid-cols-12">
        <div className="reveal hidden lg:col-span-5 lg:block">
          <Image
            src="https://placehold.co/900x1000/171717/eb3300/png?text=Foto+da+loja"
            alt="Exemplo de loja parceira"
            width={900}
            height={1000}
            className="h-[480px] w-full rounded-brand object-cover"
          />
        </div>

        <div className="reveal rounded-brand bg-dark p-8 text-white md:p-14 lg:col-span-7 lg:-ml-16">
          <SectionTitle eyebrow="Para lojistas" tone="light" title={<span className="text-white">Venda mais com um anúncio que o comprador confia</span>} />
          <ul className="mt-10 space-y-7">
            {ITENS.map(({ icon: Icon, titulo, texto }) => (
              <li key={titulo} className="flex gap-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-brand bg-primary">
                  <Icon className="h-6 w-6 text-white" aria-hidden />
                </span>
                <div className="space-y-1">
                  <h3 className="text-[20px] font-bold text-white">{titulo}</h3>
                  <p className="text-[16px] leading-[26px] text-white/70">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Button href="/#anuncie" variant="light">Quero anunciar</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
