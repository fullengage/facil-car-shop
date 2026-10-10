import type { ReactNode } from "react";

/**
 * Faixa de texto em loop. O conteúdo é duplicado para o loop ser contínuo;
 * a cópia é aria-hidden para leitores de tela não repetirem.
 * variant "outline" = texto só com contorno (estilo gigante do template de referência).
 */
export function Marquee({ items, variant = "solid" }: { items: ReactNode[]; variant?: "solid" | "outline" }) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-12 pr-12" aria-hidden={hidden}>
      {items.map((item, i) => (
        <li
          key={i}
          className={`whitespace-nowrap text-[72px] font-black leading-none ${
            variant === "outline" && i % 2 === 0 ? "text-transparent [-webkit-text-stroke:1.5px_#171717]" : "text-dark"
          }`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden py-8" aria-label="Marcas atendidas">
      <div className="marquee-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
