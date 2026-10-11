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
          <div className="flex items-center gap-3 pt-1">
            <a
              href="https://www.facilcarshop.com.br/#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-primary hover:text-white"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://www.facilcarshop.com.br/#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Facebook"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-primary hover:text-white"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a
              href="https://www.facilcarshop.com.br/#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              title="YouTube"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-primary hover:text-white"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM9.75 15.02V8.5l5.75 3.26z" />
              </svg>
            </a>
          </div>
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
