"use client";

import Image from "@/components/site/Image";
import { useState } from "react";

/** Galeria da página do veículo: foto principal + miniaturas. Troca ao clicar. */
export function Galeria({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [ativa, setAtiva] = useState(0);

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-brand bg-surface">
        <Image src={fotos[ativa]} alt={`${alt}, foto ${ativa + 1}`} fill priority={ativa === 0} sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {fotos.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setAtiva(i)}
            aria-label={`Ver foto ${i + 1}`}
            aria-pressed={i === ativa}
            className={`relative aspect-[4/3] overflow-hidden rounded-brand border-2 ${i === ativa ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
          >
            <Image src={src} alt="" fill sizes="25vw" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
