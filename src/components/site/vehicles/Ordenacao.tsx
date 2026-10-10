"use client";

import { usePathname, useRouter, useSearchParams } from "@/components/site/nav";

const OPCOES = [
  { value: "recentes", label: "Mais recentes" },
  { value: "preco-asc", label: "Menor preço" },
  { value: "preco-desc", label: "Maior preço" },
  { value: "km-asc", label: "Menor km" },
  { value: "ano-desc", label: "Ano mais novo" },
];

/** Troca a ordenação mantendo os filtros atuais na URL. */
export function Ordenacao({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function mudar(valor: string) {
    const params = new URLSearchParams(sp.toString());
    if (valor === "recentes") params.delete("ordenar");
    else params.set("ordenar", valor);
    params.delete("page");
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-[16px] text-dark">
        <strong className="font-black">{total}</strong> {total === 1 ? "veículo encontrado" : "veículos encontrados"}
      </p>
      <label className="flex items-center gap-3 text-[15px]">
        <span>Ordenar por</span>
        <select
          value={sp.get("ordenar") ?? "recentes"}
          onChange={(e) => mudar(e.target.value)}
          className="h-11 rounded-brand border border-border bg-white px-3 text-dark outline-none focus:border-primary"
        >
          {OPCOES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    </div>
  );
}
