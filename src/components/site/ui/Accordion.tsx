"use client";

import { Plus, Minus } from "lucide-react";
import { useState } from "react";

export interface AccordionItem {
  pergunta: string;
  resposta: string;
}

/** Accordion com um item aberto por vez. Item ativo em laranja. */
export function Accordion({ itens, tone = "light" }: { itens: AccordionItem[]; tone?: "light" | "dark" }) {
  const [aberto, setAberto] = useState<number | null>(0);
  const dark = tone === "dark";

  return (
    <div className="divide-y divide-border">
      {itens.map((item, i) => {
        const ativo = aberto === i;
        return (
          <div key={item.pergunta} className={dark ? "divide-white/10 border-white/10" : ""}>
            <h3>
              <button
                type="button"
                aria-expanded={ativo}
                onClick={() => setAberto(ativo ? null : i)}
                className={`flex w-full items-center justify-between gap-4 py-5 text-left text-[18px] font-bold transition-colors ${
                  ativo ? "text-primary" : dark ? "text-white" : "text-dark"
                }`}
              >
                {item.pergunta}
                {ativo ? <Minus className="h-5 w-5 shrink-0" aria-hidden /> : <Plus className="h-5 w-5 shrink-0" aria-hidden />}
              </button>
            </h3>
            {ativo && <p className={`pb-6 leading-[28px] ${dark ? "text-white/70" : ""}`}>{item.resposta}</p>}
          </div>
        );
      })}
    </div>
  );
}
