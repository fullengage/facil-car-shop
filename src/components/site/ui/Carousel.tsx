"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Carrossel com embla. Os slides ficam no HTML (SSR); o JS só adiciona arrastar e setas.
 * Sem JS, a lista aparece empilhada/rolável pelo overflow nativo.
 */
export function Carousel({ children, ariaLabel }: { children: ReactNode[]; ariaLabel: string }) {
  const [ref, api] = useEmblaCarousel({ align: "start", loop: true });

  return (
    <div className="relative" role="region" aria-roledescription="carrossel" aria-label={ariaLabel}>
      <div ref={ref} className="overflow-hidden">
        <div className="-ml-6 flex">
          {children.map((child, i) => (
            <div key={i} className="min-w-0 flex-[0_0_100%] pl-6 md:flex-[0_0_50%] lg:flex-[0_0_33.333%]">
              {child}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          aria-label="Anterior"
          onClick={() => api?.scrollPrev()}
          className="flex h-12 w-12 items-center justify-center rounded-brand border border-border text-dark transition-colors hover:border-primary hover:text-primary"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Próximo"
          onClick={() => api?.scrollNext()}
          className="flex h-12 w-12 items-center justify-center rounded-brand bg-primary text-white transition-colors hover:bg-dark"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
