import Image from "@/components/site/Image";
import { getCidades, getMarcas, getVeiculos } from "@/lib/site/data";
import { SearchBox } from "@/components/site/vehicles/SearchBox";
import { Button } from "@/components/site/ui/Button";
import { Car, Store, MapPin, Star } from "lucide-react";

/** Hero escuro com foto de fundo, título, busca e painel vertical laranja com números. */
export function Hero() {
  const veiculos = getVeiculos().length;
  const cidades = getCidades().length;

  const numeros = [
    { icon: Car, valor: `${veiculos}+`, label: "Veículos anunciados" },
    { icon: Store, valor: "100%", label: "Lojas verificadas" },
    { icon: MapPin, valor: `${cidades}`, label: "Cidades atendidas" },
    { icon: Star, valor: "FIPE", label: "Preço de referência" },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-dark text-white">
      <Image
        src="https://placehold.co/1920x1080/171717/333f4d/png?text=Foto+de+fundo"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover opacity-40"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-dark via-dark/85 to-dark/40" />

      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 pb-16 pt-20 lg:grid-cols-[1fr_340px] lg:pb-24 lg:pt-28">
        <div className="space-y-8">
          <div className="space-y-5">
            <p className="flex items-center gap-3 text-[14px] font-medium uppercase tracking-[0.8px] text-primary">
              <span className="h-px w-10 bg-primary" aria-hidden /> Classificados de veículos
            </p>
            <h1 className="max-w-[640px] text-white">Encontre seu próximo carro seminovo ou usado</h1>
            <p className="max-w-[560px] text-[18px] leading-[30px] text-white/75">
              Lojas e revendas da sua cidade em um só lugar, com preço comparado à Tabela FIPE e contato direto com o vendedor.
            </p>
          </div>

          <SearchBox marcas={getMarcas()} cidades={getCidades()} />

          <div className="flex flex-wrap gap-4 pt-2">
            <Button href="/carros" variant="light">Ver todos os carros</Button>
            <Button href="/lojas" variant="outline" className="border-white text-white hover:border-primary">Lojas parceiras</Button>
          </div>
        </div>

        {/* Painel vertical laranja (vira grade 2x2 no mobile) */}
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-brand bg-primary lg:grid-cols-1">
          {numeros.map(({ icon: Icon, valor, label }) => (
            <li key={label} className="flex items-center justify-between gap-4 bg-primary p-6 lg:p-7">
              <div>
                <p className="text-[40px] font-black leading-none text-white lg:text-[48px]">{valor}</p>
                <p className="mt-2 text-[15px] text-white/90">{label}</p>
              </div>
              <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black/15 sm:flex">
                <Icon className="h-6 w-6 text-white" aria-hidden />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
