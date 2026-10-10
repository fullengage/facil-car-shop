import { Button } from "@/components/site/ui/Button";

/** Faixa CTA de largura total em laranja, com botão escuro. */
export function CtaBand() {
  return (
    <section className="bg-primary py-16">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-8 px-5 text-center md:flex-row md:text-left">
        <div className="space-y-3">
          <h2 className="text-[30px] leading-[36px] text-white md:text-[40px] md:leading-[48px]">Seu próximo carro está a uma busca de distância</h2>
          <p className="text-[18px] text-white/90">Compare, escolha e fale com a loja em minutos.</p>
        </div>
        <Button href="/carros" variant="dark" className="shrink-0">Ver todos os carros</Button>
      </div>
    </section>
  );
}
