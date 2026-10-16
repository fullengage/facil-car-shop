import { Check, X } from "lucide-react";
import { SectionTitle } from "@/components/site/ui/SectionTitle";
import { Button } from "@/components/site/ui/Button";

const PLANOS = [
  {
    nome: "Básico",
    checkoutUrl: "https://mpago.la/1DvVg8W",
    preco: "59,90",
    porCarro: "R$ 5,99 / carro",
    destaque: false,
    itens: [
      { t: "Até 10 carros ativos", ok: true },
      { t: "Contato direto por WhatsApp", ok: true },
      { t: "CRM de leads e propostas", ok: true },
      { t: "1 usuário vendedor", ok: true },
    ],
  },
  {
    nome: "Profissional",
    checkoutUrl: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2b784b1240414e7e8308c04f56b75420",
    preco: "119,90",
    porCarro: "R$ 4,80 / carro",
    destaque: true,
    itens: [
      { t: "Até 25 carros ativos", ok: true },
      { t: "Contato por WhatsApp e e-mail", ok: true },
      { t: "Showroom exclusivo da loja", ok: true },
      { t: "Até 3 vendedores na equipe", ok: true },
    ],
  },
  {
    nome: "Premium",
    checkoutUrl: "https://mpago.la/1wfRP3R",
    preco: "195,90",
    porCarro: "R$ 3,92 / carro",
    destaque: false,
    itens: [
      { t: "Até 50 carros ativos", ok: true },
      { t: "Até 2 filiais / lojas", ok: true },
      { t: "Destaque e relatórios de visitas", ok: true },
      { t: "Até 6 vendedores na equipe", ok: true },
    ],
  },
  {
    nome: "Enterprise",
    checkoutUrl: "https://mpago.la/1ZMTy7b",
    preco: "290,00",
    porCarro: "R$ 2,90 / carro",
    destaque: false,
    itens: [
      { t: "Até 100 carros ativos", ok: true },
      { t: "Rede multiloja (até 5 lojas)", ok: true },
      { t: "Destaques contínuos no portal", ok: true },
      { t: "Até 12 vendedores e suporte VIP", ok: true },
    ],
  },
];

/** Quatro cards de planos para lojistas + faixa especial para redes e frotistas. */
export function Planos() {
  return (
    <section className="bg-white py-[100px]">
      <div className="mx-auto max-w-[1240px] px-5">
        <SectionTitle eyebrow="Planos para lojistas" align="center" title="Escolha o plano da sua loja" />
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANOS.map((p) => (
            <article
              key={p.nome}
              className={`reveal flex flex-col rounded-brand p-8 sm:p-9 ${p.destaque ? "bg-dark text-white shadow-soft lg:-my-3 ring-2 ring-primary" : "bg-surface text-dark"}`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-[20px] font-bold ${p.destaque ? "text-white" : ""}`}>{p.nome}</h3>
                {p.destaque && (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                    Popular
                  </span>
                )}
              </div>
              <p className="mt-5 flex items-end gap-1.5">
                <span className="text-[16px] font-bold">R$</span>
                <span className="text-[46px] font-black leading-none">{p.preco}</span>
                <span className={`pb-1 text-[14px] ${p.destaque ? "text-white/70" : "text-text"}`}>/mês</span>
              </p>
              <span className={`mt-1 text-[13px] font-medium ${p.destaque ? "text-primary" : "text-primary"}`}>
                {p.porCarro}
              </span>
              <ul className={`mt-6 space-y-3.5 border-t pt-6 text-[15px] ${p.destaque ? "border-white/10" : "border-border"}`}>
                {p.itens.map((i) => (
                  <li key={i.t} className="flex items-center gap-2.5">
                    {i.ok ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : <X className="h-4 w-4 shrink-0 opacity-40" aria-hidden />}
                    <span className={i.ok ? "" : "opacity-40"}>{i.t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                <Button href={p.checkoutUrl} variant={p.destaque ? "primary" : "dark"} className="w-full text-[14px]">
                  Começar agora
                </Button>
              </div>
            </article>
          ))}
        </div>

        {/* Faixa especial: Rede de lojas e frotistas */}
        <div className="mt-10 rounded-brand border border-border bg-gradient-to-r from-slate-900 via-dark to-slate-900 p-7 text-white sm:p-9">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-accent">
                Grandes Operações
              </span>
              <h4 className="mt-2 text-[22px] font-black text-white sm:text-[24px]">
                Rede de lojas e frotistas (Plano Especial)
              </h4>
              <p className="mt-1 max-w-[680px] text-[15px] text-white/80">
                Condições sob medida e valor por carro diferenciado para grupos de concessionárias, frotistas e operações com múltiplos CNPJs.
              </p>
            </div>
            <Button
              href="/#anuncie"
              variant="outline"
              className="shrink-0 border-white text-white hover:bg-white hover:text-dark uppercase font-bold"
            >
              Falar com consultor
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
