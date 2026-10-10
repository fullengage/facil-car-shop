import { Check, X } from "lucide-react";
import { SectionTitle } from "@/components/site/ui/SectionTitle";
import { Button } from "@/components/site/ui/Button";

const PLANOS = [
  {
    nome: "Básico",
    preco: "69,90",
    destaque: false,
    itens: [
      { t: "Até 10 carros ativos", ok: true },
      { t: "Contato por WhatsApp", ok: true },
      { t: "CRM de leads básico", ok: true },
      { t: "Anúncios em destaque", ok: false },
    ],
  },
  {
    nome: "Profissional",
    preco: "119,90",
    destaque: true,
    itens: [
      { t: "Até 25 carros ativos", ok: true },
      { t: "Contato por WhatsApp e e-mail", ok: true },
      { t: "Showroom exclusivo da loja", ok: true },
      { t: "2 destaques por mês", ok: true },
    ],
  },
  {
    nome: "Premium",
    preco: "199,90",
    destaque: false,
    itens: [
      { t: "Até 60 carros ativos", ok: true },
      { t: "Até 2 lojas / filiais", ok: true },
      { t: "Destaque e relatórios de visitas", ok: true },
      { t: "Equipe multi-vendedores", ok: true },
    ],
  },
  {
    nome: "Enterprise",
    preco: "299,90",
    destaque: false,
    itens: [
      { t: "Até 100 carros ativos", ok: true },
      { t: "Rede multiloja (até 5 lojas)", ok: true },
      { t: "Destaques contínuos no portal", ok: true },
      { t: "CRM avançado e suporte VIP", ok: true },
    ],
  },
];

/** Quatro cards de planos para lojistas; Profissional com destaque visual. */
export function Planos() {
  return (
    <section className="bg-white py-[100px]">
      <div className="mx-auto max-w-[1240px] px-5">
        <SectionTitle eyebrow="Planos para lojistas" align="center" title="Escolha o plano da sua loja" />
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
