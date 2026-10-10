"use client";

import { Search } from "lucide-react";
import { useRouter } from "@/components/site/nav";
import { useState, type FormEvent } from "react";
import { montarQuery } from "@/lib/site/filters";
import type { Cidade, Marca } from "@/lib/site/types";

const FAIXAS = [
  { label: "Qualquer preço", min: 0, max: 0 },
  { label: "Até R$ 50 mil", min: 0, max: 50000 },
  { label: "R$ 50 mil a R$ 100 mil", min: 50000, max: 100000 },
  { label: "R$ 100 mil a R$ 150 mil", min: 100000, max: 150000 },
  { label: "Acima de R$ 150 mil", min: 150000, max: 0 },
];

const campo = "h-[56px] w-full rounded-brand border border-border bg-white px-4 text-[16px] text-dark outline-none focus:border-primary";

/** Busca da home. Ao enviar, navega para /carros com os filtros na query string. */
export function SearchBox({ marcas, cidades }: { marcas: Marca[]; cidades: Cidade[] }) {
  const router = useRouter();
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [faixa, setFaixa] = useState(0);
  const [cidade, setCidade] = useState("");

  function buscar(e: FormEvent) {
    e.preventDefault();
    const f = FAIXAS[faixa];
    router.push(`/carros${montarQuery({ marca, modelo, precoMin: f.min, precoMax: f.max, cidade })}`);
  }

  return (
    <form onSubmit={buscar} className="grid gap-3 rounded-brand bg-white p-4 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.4)] md:grid-cols-12" role="search" aria-label="Buscar carros">
      <label className="md:col-span-2">
        <span className="sr-only">Marca</span>
        <select value={marca} onChange={(e) => setMarca(e.target.value)} className={campo}>
          <option value="">Marca</option>
          {marcas.map((m) => <option key={m.slug} value={m.slug}>{m.nome}</option>)}
        </select>
      </label>
      <label className="md:col-span-3">
        <span className="sr-only">Modelo</span>
        <input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Modelo" className={campo} />
      </label>
      <label className="md:col-span-3">
        <span className="sr-only">Faixa de preço</span>
        <select value={faixa} onChange={(e) => setFaixa(Number(e.target.value))} className={campo}>
          {FAIXAS.map((f, i) => <option key={f.label} value={i}>{f.label}</option>)}
        </select>
      </label>
      <label className="md:col-span-2">
        <span className="sr-only">Cidade</span>
        <select value={cidade} onChange={(e) => setCidade(e.target.value)} className={campo}>
          <option value="">Cidade</option>
          {cidades.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
        </select>
      </label>
      <button type="submit" className="flex h-[56px] items-center justify-center gap-2 rounded-brand bg-primary text-[16px] font-medium uppercase tracking-[0.6px] text-white transition-colors hover:bg-dark md:col-span-2">
        <Search className="h-4 w-4" aria-hidden /> Buscar
      </button>
    </form>
  );
}
