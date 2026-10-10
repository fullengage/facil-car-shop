"use client";

import Link from "@/components/site/Link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { label: "Comprar", href: "/carros" },
  { label: "Lojas", href: "/lojas" },
  { label: "Marcas", href: "/#marcas" },
  { label: "Blog", href: "/#blog" },
  { label: "Contato", href: "/#anuncie" },
  { label: "Painel / CRM", href: "/painel" },
];

/** Header branco fixo com sombra leve. No mobile vira drawer. */
export function Header() {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_20px_rgb(0_0_0/0.06)]">
      <div className="mx-auto flex h-[88px] max-w-[1200px] items-center justify-between gap-6 px-5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Fácil Car Shop, início">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-facil-car-shop.png" alt="Fácil Car Shop" className="h-11 w-auto" />
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {NAV.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="text-[18px] font-medium text-dark transition-colors hover:text-primary">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/painel"
            className="hidden rounded-brand border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 md:inline-flex"
          >
            Cockpit CRM
          </Link>
          <Link
            href="/#anuncie"
            className="hidden rounded-brand bg-primary px-6 py-3.5 text-[15px] font-medium uppercase tracking-[0.6px] text-white transition-colors hover:bg-dark sm:inline-flex"
          >
            Anunciar
          </Link>
          <button
            type="button"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={aberto}
            onClick={() => setAberto(!aberto)}
            className="flex h-11 w-11 items-center justify-center rounded-brand border border-border text-dark lg:hidden"
          >
            {aberto ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Drawer mobile */}
      {aberto && (
        <nav aria-label="Principal mobile" className="border-t border-border bg-white px-5 py-4 lg:hidden">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.label} className="border-b border-border last:border-0">
                <Link href={item.href} onClick={() => setAberto(false)} className="block py-4 text-[18px] font-medium text-dark hover:text-primary">
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-4 sm:hidden">
              <Link href="/#anuncie" className="block rounded-brand bg-primary px-6 py-3.5 text-center font-medium uppercase text-white">
                Anunciar
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
