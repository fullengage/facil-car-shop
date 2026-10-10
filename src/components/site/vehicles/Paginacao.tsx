import Link from "@/components/site/Link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  pagina: number;
  paginas: number;
  /** Caminho base da listagem, ex.: /carros/chevrolet */
  base: string;
  /** Query atual (sem page) para manter filtros e ordenação */
  query: Record<string, string | undefined>;
}

/** Paginação server-side: cada página é um link com a query preservada. */
export function Paginacao({ pagina, paginas, base, query }: Props) {
  if (paginas <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) params.set(k, v);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `${base}?${s}` : base;
  };

  const numeros = Array.from({ length: paginas }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === paginas || Math.abs(n - pagina) <= 1,
  );

  return (
    <nav aria-label="Paginação" className="mt-14 flex items-center justify-center gap-2">
      {pagina > 1 ? (
        <Link href={href(pagina - 1)} rel="prev" className="flex h-11 w-11 items-center justify-center rounded-brand border border-border hover:border-primary" aria-label="Página anterior">
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-brand border border-border opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden /></span>
      )}
      {numeros.map((n, i) => {
        const anterior = numeros[i - 1];
        return (
          <span key={n} className="flex items-center gap-2">
            {anterior && n - anterior > 1 && <span className="px-1">…</span>}
            <Link
              href={href(n)}
              aria-current={n === pagina ? "page" : undefined}
              className={`flex h-11 min-w-11 items-center justify-center rounded-brand px-3 text-[15px] font-medium ${n === pagina ? "bg-primary text-white" : "border border-border text-dark hover:border-primary"}`}
            >
              {n}
            </Link>
          </span>
        );
      })}
      {pagina < paginas ? (
        <Link href={href(pagina + 1)} rel="next" className="flex h-11 w-11 items-center justify-center rounded-brand border border-border hover:border-primary" aria-label="Próxima página">
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-brand border border-border opacity-40"><ChevronRight className="h-4 w-4" aria-hidden /></span>
      )}
    </nav>
  );
}
