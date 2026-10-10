import Link from "@/components/site/Link";
import { MapPin, Star, Car } from "lucide-react";
import { getVeiculosDaLoja } from "@/lib/site/data";
import type { Loja } from "@/lib/site/types";

/** Card de loja: monograma no lugar de logo, cidade, avaliação e nº de veículos. */
export function LojaCard({ loja }: { loja: Loja }) {
  const total = getVeiculosDaLoja(loja.id).length;
  return (
    <article className="flex h-full flex-col gap-5 rounded-brand border border-border bg-white p-7 transition-colors hover:border-primary">
      <div className="flex items-center justify-between">
        <span className="flex h-14 w-14 items-center justify-center rounded-brand bg-dark text-[22px] font-black text-white">
          {loja.nome.charAt(0)}
        </span>
        <span className="flex items-center gap-1.5 text-[15px] font-bold text-dark">
          <Star className="h-4 w-4 fill-accent text-accent" aria-hidden /> {loja.avaliacao.toLocaleString("pt-BR")}
        </span>
      </div>
      <div className="space-y-2">
        <h3 className="text-[22px] font-bold leading-[28px] text-dark">{loja.nome}</h3>
        <p className="flex items-center gap-2 text-[15px]"><MapPin className="h-4 w-4 text-primary" aria-hidden /> {loja.cidade}, {loja.uf}</p>
        <p className="flex items-center gap-2 text-[15px]"><Car className="h-4 w-4 text-primary" aria-hidden /> {total} {total === 1 ? "veículo" : "veículos"} anunciados</p>
      </div>
      <Link href={`/lojas/${loja.slug}`} className="mt-auto text-[15px] font-medium uppercase tracking-wide text-primary hover:text-dark">
        Ver estoque da loja →
      </Link>
    </article>
  );
}
