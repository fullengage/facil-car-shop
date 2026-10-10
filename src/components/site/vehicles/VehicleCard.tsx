import Image from "@/components/site/Image";
import Link from "@/components/site/Link";
import { Calendar, Fuel, Gauge, Settings2, ArrowRight } from "lucide-react";
import type { Veiculo } from "@/lib/site/types";
import { formatBRL, formatKm } from "@/lib/site/format";

/** Card de veículo: foto 4:3 com selo, marca/modelo, preço em destaque e ficha rápida. */
export function VehicleCard({ v }: { v: Veiculo }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-brand bg-white shadow-soft transition-transform duration-300 hover:-translate-y-1">
      <Link href={`/veiculo/${v.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-surface">
        <Image
          src={v.fotos[0]}
          alt={`${v.titulo} à venda em ${v.cidadeNome}`}
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {(v.destaque || v.novo) && (
          <span className={`absolute left-4 top-4 rounded-brand px-3 py-1 text-[13px] font-bold uppercase tracking-wide text-white ${v.destaque ? "bg-primary" : "bg-dark"}`}>
            {v.destaque ? "Destaque" : "Novo"}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-1">
          <p className="text-[13px] font-medium uppercase tracking-wide text-primary">{v.marca}</p>
          <h3 className="text-[20px] font-bold leading-[26px] text-dark">
            <Link href={`/veiculo/${v.slug}`} className="hover:text-primary">{v.modelo}</Link>
          </h3>
          <p className="text-[15px] leading-[22px]">{v.versao}</p>
        </div>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-[15px]">
          <li className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" aria-hidden />{v.ano}</li>
          <li className="flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" aria-hidden />{formatKm(v.km)}</li>
          <li className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" aria-hidden />{v.cambio}</li>
          <li className="flex items-center gap-2"><Fuel className="h-4 w-4 text-primary" aria-hidden />{v.combustivel}</li>
        </ul>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-5">
          <div>
            <p className="text-[14px] text-text">{v.cidadeNome}</p>
            <p className="text-[24px] font-black leading-none text-primary">{formatBRL(v.preco)}</p>
          </div>
          <Link
            href={`/veiculo/${v.slug}`}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium uppercase tracking-wide text-dark transition-colors hover:text-primary"
          >
            Ver detalhes <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <p className="text-[13px] text-text">{v.lojaNome}</p>
      </div>
    </article>
  );
}
