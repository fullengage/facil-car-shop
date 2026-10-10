import { Check, X } from "lucide-react";
import { SectionTitle } from "@/components/site/ui/SectionTitle";
import { Button } from "@/components/site/ui/Button";

// Valores de exemplo: ajustar antes de publicar
const PLANOS = [
  {
    nome: "Básico",
    preco: "29",
    destaque: false,
    itens: [
      { t: "Até 10 anúncios ativos", ok: true },
      { t: "Contato por WhatsApp", ok: true },
      { t: "Anúncio em destaque", ok: false },
      { t: "Relatório de visitas", ok: false },
    ],
  },
  {
    nome: "Pro",
    preco: "149",
    destaque: true,
    itens: [
      { t: "Até 50 anúncios ativos", ok: true },
      { t: "Contato por WhatsApp e e-mail", ok: true },
      { t: "2 anúncios em destaque por mês", ok: true },
      { t: "Relatório de visitas", ok: false },
    ],
  },
  {
    nome: "Premium",
    preco: "299",
    destaque: false,
    itens: [
      { t: "Anúncios ilimitados", ok: true },
      { t: "Contato por WhatsApp e e-mail", ok: true },
      { t: "Destaques ilimitados", ok: true },
      { t: "Relatório de visitas", ok: true },
    ],
  },
];

/** Três cards de plano por mês; o do meio fica destacado. */
export function Planos() {
  return (
    <section className="bg-white py-[100px]">
      <div className="mx-auto max-w-[1200px] px-5">
        <SectionTitle eyebrow="Planos para lojistas" align="center" title="Escolha o plano da sua loja" />
        <div className="mt-16 grid gap-7 lg:grid-cols-3">
          {PLANOS.map((p) => (
            <article
              key={p.nome}
              className={`reveal flex flex-col rounded-brand p-10 ${p.destaque ? "bg-dark text-white shadow-soft lg:-my-4" : "bg-surface text-dark"}`}
            >
              <h3 className={`text-[22px] font-bold ${p.destaque ? "text-white" : ""}`}>{p.nome}</h3>
              <p className="mt-6 flex items-end gap-2">
                <span className="text-[16px] font-bold">R$</span>
                <span className="text-[56px] font-black leading-none">{p.preco}</span>
                <span className={`pb-2 text-[16px] ${p.destaque ? "text-white/70" : "text-text"}`}>/mês</span>
              </p>
              <ul className={`mt-8 space-y-4 border-t pt-8 text-[16px] ${p.destaque ? "border-white/10" : "border-border"}`}>
                {p.itens.map((i) => (
                  <li key={i.t} className="flex items-center gap-3">
                    {i.ok ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : <X className="h-4 w-4 shrink-0 opacity-40" aria-hidden />}
                    <span className={i.ok ? "" : "opacity-40"}>{i.t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-10">
                <Button href="/#anuncie" variant={p.destaque ? "primary" : "dark"} className="w-full">
                  Começar agora
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
