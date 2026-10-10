"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "@/components/site/nav";
import { useState } from "react";
import type { Cidade, Marca } from "@/lib/site/types";

interface Props {
  marcas: Marca[];
  cidades: Cidade[];
  /** Quando a página já é de uma marca (/carros/[marca]), o campo marca some. */
  marcaFixa?: string;
}

const CARROCERIAS = ["Hatch", "Sedan", "SUV", "Picape", "Moto"];
const CAMBIOS = ["Manual", "Automático"];
const COMBUSTIVEIS = ["Flex", "Diesel", "Gasolina"];
const PRECOS = [
  { label: "Qualquer", min: "", max: "" },
  { label: "Até R$ 50 mil", min: "", max: "50000" },
  { label: "R$ 50 mil a R$ 100 mil", min: "50000", max: "100000" },
  { label: "R$ 100 mil a R$ 150 mil", min: "100000", max: "150000" },
  { label: "Acima de R$ 150 mil", min: "150000", max: "" },
];
const ANOS = ["2015", "2018", "2020", "2022", "2023"];

const campo = "h-11 w-full rounded-brand border border-border bg-white px-3 text-[15px] text-dark outline-none focus:border-primary";

/**
 * Filtros via query string. Cada mudança navega para a URL nova (SSR da listagem).
 * No mobile, abre como drawer.
 */
export function FiltrosSidebar({ marcas, cidades, marcaFixa }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [aberto, setAberto] = useState(false);

  function atualizar(chave: string, valor: string) {
    const params = new URLSearchParams(sp.toString());
    if (valor) params.set(chave, valor);
    else params.delete(chave);
    params.delete("page");
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`, { scroll: false });
  }

  function limpar() {
    router.push(pathname, { scroll: false });
  }

  const precoAtual = PRECOS.findIndex((p) => p.min === (sp.get("precoMin") ?? "") && p.max === (sp.get("precoMax") ?? ""));
  const temFiltro = Array.from(sp.keys()).some((k) => k !== "ordenar");

  const conteudo = (
    <div className="space-y-6">
      {!marcaFixa && (
        <Campo label="Marca">
          <select value={sp.get("marca") ?? ""} onChange={(e) => atualizar("marca", e.target.value)} className={campo}>
            <option value="">Todas</option>
            {marcas.map((m) => <option key={m.slug} value={m.slug}>{m.nome}</option>)}
          </select>
        </Campo>
      )}
      <Campo label="Cidade">
        <select value={sp.get("cidade") ?? ""} onChange={(e) => atualizar("cidade", e.target.value)} className={campo}>
          <option value="">Todas</option>
          {cidades.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
        </select>
      </Campo>
      <Campo label="Faixa de preço">
        <select
          value={precoAtual >= 0 ? precoAtual : 0}
          onChange={(e) => {
            const p = PRECOS[Number(e.target.value)];
            const params = new URLSearchParams(sp.toString());
            if (p.min) params.set("precoMin", p.min);
            else params.delete("precoMin");
            if (p.max) params.set("precoMax", p.max);
            else params.delete("precoMax");
            params.delete("page");
            router.push(`${pathname}${params.toString() ? `?${params}` : ""}`, { scroll: false });
          }}
          className={campo}
        >
          {PRECOS.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
        </select>
      </Campo>
      <Campo label="Ano a partir de">
        <select value={sp.get("anoMin") ?? ""} onChange={(e) => atualizar("anoMin", e.target.value)} className={campo}>
          <option value="">Qualquer</option>
          {ANOS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </Campo>
      <Campo label="Carroceria">
        <Chips chave="carroceria" opcoes={CARROCERIAS} atual={sp.get("carroceria")} onChange={atualizar} />
      </Campo>
      <Campo label="Câmbio">
        <Chips chave="cambio" opcoes={CAMBIOS} atual={sp.get("cambio")} onChange={atualizar} />
      </Campo>
      <Campo label="Combustível">
        <Chips chave="combustivel" opcoes={COMBUSTIVEIS} atual={sp.get("combustivel")} onChange={atualizar} />
      </Campo>
      {temFiltro && (
        <button type="button" onClick={limpar} className="text-[14px] font-medium uppercase tracking-wide text-primary hover:text-dark">
          Limpar filtros
        </button>
      )}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-brand border border-dark px-5 py-3.5 font-medium uppercase tracking-wide text-dark lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filtrar resultados
      </button>

      {/* Desktop: coluna fixa */}
      <aside aria-label="Filtros" className="hidden lg:block">
        <div className="sticky top-28 rounded-brand bg-surface p-6">
          <h2 className="mb-6 text-[22px] font-black">Filtros</h2>
          {conteudo}
        </div>
      </aside>

      {/* Mobile: drawer */}
      {aberto && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <button type="button" aria-label="Fechar filtros" className="absolute inset-0 bg-dark/60" onClick={() => setAberto(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[12px] bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-[22px] font-black">Filtros</h2>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" className="flex h-10 w-10 items-center justify-center rounded-brand border border-border">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {conteudo}
            <button type="button" onClick={() => setAberto(false)} className="mt-8 w-full rounded-brand bg-primary py-4 font-medium uppercase text-white">
              Ver resultados
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <span className="block text-[14px] font-bold uppercase tracking-wide text-dark">{label}</span>
      {children}
    </div>
  );
}

function Chips({ chave, opcoes, atual, onChange }: { chave: string; opcoes: string[]; atual: string | null; onChange: (k: string, v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => {
        const ativo = atual === o;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(chave, ativo ? "" : o)}
            className={`rounded-brand border px-3 py-2 text-[14px] transition-colors ${ativo ? "border-primary bg-primary text-white" : "border-border bg-white text-dark hover:border-primary"}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
