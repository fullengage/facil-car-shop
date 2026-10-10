import Link from "@/components/site/Link";
import { ChevronRight } from "lucide-react";
import { breadcrumbLd, jsonLdProps } from "@/lib/site/seo";

export interface Crumb {
  nome: string;
  path?: string; // último item fica sem link
}

export function Breadcrumbs({ itens }: { itens: Crumb[] }) {
  const ld = breadcrumbLd(
    [{ nome: "Início", path: "/" }, ...itens.filter((i) => i.path).map((i) => ({ nome: i.nome, path: i.path! }))],
  );
  return (
    <nav aria-label="Caminho" className="text-sm text-text">
      <script {...jsonLdProps(ld)} />
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-primary">Início</Link>
        </li>
        {itens.map((item) => (
          <li key={item.nome} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            {item.path ? (
              <Link href={item.path} className="hover:text-primary">{item.nome}</Link>
            ) : (
              <span aria-current="page" className="text-dark">{item.nome}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
