"use client";

import { useState } from "react";
import { VehicleCard } from "@/components/site/vehicles/VehicleCard";
import type { Veiculo } from "@/lib/site/types";

const ABAS = [
  { label: "Todos", value: "" },
  { label: "SUV", value: "SUV" },
  { label: "Hatch", value: "Hatch" },
  { label: "Sedan", value: "Sedan" },
  { label: "Picape", value: "Picape" },
];

/** Abas de carroceria + grade de cards. Os cards já chegam renderizados; a aba só filtra. */
export function Destaques({ veiculos }: { veiculos: Veiculo[] }) {
  const [aba, setAba] = useState("");
  const lista = veiculos.filter((v) => !aba || v.carroceria === aba).slice(0, 6);

  return (
    <div className="space-y-12">
      <div role="tablist" aria-label="Filtrar por carroceria" className="flex flex-wrap justify-center gap-3">
        {ABAS.map((a) => (
          <button
            key={a.label}
            role="tab"
            aria-selected={aba === a.value}
            type="button"
            onClick={() => setAba(a.value)}
            className={`rounded-brand px-6 py-3 text-[16px] font-medium uppercase tracking-wide transition-colors ${
              aba === a.value ? "bg-primary text-white" : "border border-border bg-white text-dark hover:border-primary"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {lista.length > 0 ? (
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((v) => (
            <div key={v.id} className="reveal">
              <VehicleCard v={v} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-[16px]">Nenhum veículo nesta categoria no momento.</p>
      )}
    </div>
  );
}
