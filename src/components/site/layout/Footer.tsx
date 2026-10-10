import Link from "@/components/site/Link";
import { getCidades, getMarcas } from "@/lib/site/data";
import { SITE_NAME } from "@/lib/site/seo";

const LINKS_RAPIDOS = [
  { label: "Comprar carros", href: "/carros" },
  { label: "Lojas parceiras", href: "/lojas" },
  { label: "Anuncie sua loja", href: "/#anuncie" },
  { label: "Blog", href: "/#blog" },
];

/** Rodapé escuro em 4 colunas, com links internos de SEO por cidade e por marca. */
export function Footer() {
  const cidades = getCidades();
  const marcas = getMarcas();

  return (
    <footer className="bg-dark text-white/70">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-20 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-5">
          <div className="inline-block rounded-brand bg-white px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-facil-car-shop.png" alt="Fácil Car Shop" className="h-10 w-auto" />
          </div>
          <p className="text-[15px] leading-[26px]">
            Carros seminovos e usados de lojas e revendas da sua cidade, com preço comparado à Tabela FIPE.
          </p>
        </div>

        <div>
          <h3 className="mb-5 text-[16px] font-bold uppercase tracking-wide text-white">Links rápidos</h3>
          <ul className="space-y-3 text-[15px]">
            {LINKS_RAPIDOS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="hover:text-primary">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-[16px] font-bold uppercase tracking-wide text-white">Carros por cidade</h3>
          <ul className="space-y-3 text-[15px]">
            {cidades.map((c) => (
              <li key={c.slug}>
                <Link href={`/carros-em/${c.slug}`} className="hover:text-primary">Carros em {c.nome}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-[16px] font-bold uppercase tracking-wide text-white">Carros por marca</h3>
          <ul className="grid grid-cols-2 gap-3 text-[15px]">
            {marcas.map((m) => (
              <li key={m.slug}>
                <Link href={`/carros/${m.slug}`} className="hover:text-primary">{m.nome}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-5 py-6 text-[14px] sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE_NAME}. Todos os direitos reservados.</p>
          <p>Dados de exemplo. Placas completas nunca são exibidas.</p>
        </div>
      </div>
    </footer>
  );
}
