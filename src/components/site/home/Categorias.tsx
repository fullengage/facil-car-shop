import Link from "@/components/site/Link";
import { Car, Truck, Bike, Hammer, Settings, CarFront } from "lucide-react";
import { SectionTitle } from "@/components/site/ui/SectionTitle";
import { TireWatermark } from "@/components/site/ui/TireWatermark";
import { getVeiculos } from "@/lib/site/data";

const CATEGORIAS = [
  { nome: "Hatch", slug: "Hatch", icon: Car },
  { nome: "Sedan", slug: "Sedan", icon: CarFront },
  { nome: "SUV", slug: "SUV", icon: Settings },
  { nome: "Picape", slug: "Picape", icon: Truck },
  { nome: "Utilitário", slug: "Utilitario", icon: Hammer },
  { nome: "Moto", slug: "Moto", icon: Bike },
];

/** Cards por carroceria, com contagem real e marca de pneu decorativa. */
export function Categorias() {
  const veiculos = getVeiculos();
  return (
    <section className="relative overflow-hidden bg-white py-[100px]">
      <TireWatermark side="left" />
      <div className="relative mx-auto max-w-[1200px] px-5">
        <SectionTitle eyebrow="Categorias" align="center" title="Escolha pelo tipo de carro" />
        <ul className="mt-14 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIAS.map(({ nome, slug, icon: Icon }) => {
            const total = veiculos.filter((v) => v.carroceria === slug).length;
            return (
              <li key={nome} className="reveal">
                <Link
                  href={`/carros?carroceria=${slug}`}
                  className="group flex h-full flex-col items-center gap-4 rounded-brand bg-surface px-4 py-9 text-center transition-colors hover:bg-dark hover:text-white"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-7 w-7" aria-hidden />
                  </span>
                  <span className="text-[18px] font-bold text-dark group-hover:text-white">{nome}</span>
                  <span className="text-[14px]">{total} {total === 1 ? "anúncio" : "anúncios"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
