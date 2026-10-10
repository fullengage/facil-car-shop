import { Accordion } from "@/components/site/ui/Accordion";
import { SectionTitle } from "@/components/site/ui/SectionTitle";

export const FAQ = [
  { pergunta: "O anúncio é gratuito para o comprador?", resposta: "Sim. Para quem busca carro, pesquisar, comparar e falar com a loja é totalmente gratuito." },
  { pergunta: "Como sei se o preço é bom?", resposta: "Cada anúncio mostra a referência da Tabela FIPE do modelo e a diferença, em reais e em percentual, em relação ao preço pedido." },
  { pergunta: "A placa do carro fica visível?", resposta: "Não. Exibimos apenas a placa mascarada. A placa completa é tratada conforme a LGPD." },
  { pergunta: "Como uma loja anuncia aqui?", resposta: "Preencha o formulário nesta página. Nossa equipe entra em contato para cadastrar a loja e publicar o estoque." },
  { pergunta: "Posso financiar pelo site?", resposta: "O financiamento é negociado diretamente com a loja anunciante, que informa as condições disponíveis." },
];

export function FaqSection() {
  return (
    <section className="bg-dark py-[100px] text-white">
      <div className="mx-auto grid max-w-[1200px] gap-14 px-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionTitle eyebrow="Perguntas frequentes" tone="light" title={<span className="text-white">Tire suas dúvidas</span>} />
          <p className="mt-6 text-[17px] leading-[28px] text-white/70">
            Não encontrou o que procura? Fale com a nossa equipe pelo formulário de contato.
          </p>
        </div>
        <div className="lg:col-span-7">
          <Accordion itens={FAQ} tone="dark" />
        </div>
      </div>
    </section>
  );
}
