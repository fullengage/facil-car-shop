import { SectionTitle } from "@/components/site/ui/SectionTitle";

const PASSOS = [
  { n: 1, titulo: "Pesquise", texto: "Filtre por marca, preço, ano e cidade para ver só o que faz sentido para você." },
  { n: 2, titulo: "Compare", texto: "Confira a ficha técnica, as fotos e a diferença em relação à Tabela FIPE." },
  { n: 3, titulo: "Converse com a loja", texto: "Fale direto com o vendedor pelo WhatsApp, agende o test drive e feche o negócio." },
];

/** Três passos numerados ligados por linha. */
export function ComoComprar() {
  return (
    <section className="bg-surface py-[100px]">
      <div className="mx-auto max-w-[1200px] px-5">
        <SectionTitle eyebrow="Como comprar" align="center" title="Três passos até o seu carro" />
        <ol className="relative mt-16 grid gap-10 md:grid-cols-3">
          <span aria-hidden className="absolute left-[10%] right-[10%] top-8 hidden h-px bg-primary/40 md:block" />
          {PASSOS.map((p) => (
            <li key={p.n} className="reveal relative flex flex-col items-center gap-5 text-center">
              <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-[24px] font-black text-white shadow-soft">
                {p.n}
              </span>
              <h3 className="text-[22px] font-bold text-dark">{p.titulo}</h3>
              <p className="max-w-[320px] text-[16px] leading-[26px]">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
