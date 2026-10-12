import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Seo } from "@/components/site/Seo";
import { Breadcrumbs } from "@/components/site/ui/Breadcrumbs";
import { supabase } from "@/services/supabaseClient";
import { Car, Search } from "lucide-react";

type PublicCar = {
  id: string;
  store_id: string;
  store_name: string;
  store_city: string;
  store_state: string;
  title: string;
  brand: string;
  model: string;
  version: string | null;
  model_year: number;
  price: number;
  mileage: number | null;
  photos: unknown;
  created_at: string;
};

const formatMoney = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const firstPhoto = (photos: unknown): string | null => {
  if (!Array.isArray(photos)) return null;
  const first = photos[0];
  if (typeof first === "string" && /^https?:\/\//.test(first)) return first;
  if (
    first &&
    typeof first === "object" &&
    "url" in first &&
    typeof first.url === "string" &&
    /^https?:\/\//.test(first.url)
  )
    return first.url;
  return null;
};

export default function LiveCarrosPage() {
  const [cars, setCars] = useState<PublicCar[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [params, setParams] = useSearchParams();
  const search = params.get("busca") || "";
  const cidade = params.get("cidade") || "";
  const lojaId = params.get("loja") || "";

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) {
        if (active) {
          setError("Catálogo temporariamente indisponível.");
          setBusy(false);
        }
        return;
      }
      const { data, error: e } = await supabase
        .from("fcs_public_vehicle_listings")
        .select(
          "id,store_id,store_name,store_city,store_state,title,brand,model,version,model_year,price,mileage,photos,created_at"
        )
        .order("created_at", { ascending: false })
        .limit(300);

      if (active) {
        if (e) setError("Não foi possível carregar o catálogo no momento.");
        else setCars((data ?? []) as PublicCar[]);
        setBusy(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      cars.filter(
        (c) =>
          (!search ||
            [c.title, c.brand, c.model, c.store_name].some((v) =>
              v?.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))
            )) &&
          (!cidade ||
            c.store_city?.toLocaleLowerCase("pt-BR").includes(cidade.toLocaleLowerCase("pt-BR"))) &&
          (!lojaId || c.store_id === lojaId)
      ),
    [cars, search, cidade, lojaId]
  );

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12">
      <Seo
        title="Carros seminovos e usados à venda"
        description="Anúncios publicados por revendas aprovadas no Fácil Car Shop."
        canonical="/carros"
      />
      <Breadcrumbs itens={[{ nome: "Carros" }]} />
      <header className="mb-8 mt-6 max-w-[760px] space-y-4">
        <h1 className="text-4xl font-black text-dark">Carros à venda</h1>
        <p className="text-[18px] leading-[30px] text-muted">
          Veículos publicados por lojas e revendas devidamente cadastradas e aprovadas no portal.
        </p>
      </header>

      <div className="mb-8 flex flex-wrap gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" aria-hidden />
          <input
            aria-label="Buscar veículo ou loja"
            className="w-full rounded-brand border border-border bg-white py-3 pl-10 pr-4 text-sm text-dark placeholder:text-muted focus:border-primary focus:outline-none"
            placeholder="Marca, modelo ou loja..."
            value={search}
            onChange={(e) => {
              const x = new URLSearchParams(params);
              e.target.value ? x.set("busca", e.target.value) : x.delete("busca");
              setParams(x);
            }}
          />
        </div>
        <input
          aria-label="Filtrar cidade"
          className="rounded-brand border border-border bg-white px-4 py-3 text-sm text-dark placeholder:text-muted focus:border-primary focus:outline-none"
          placeholder="Filtrar por cidade..."
          value={cidade}
          onChange={(e) => {
            const x = new URLSearchParams(params);
            e.target.value ? x.set("cidade", e.target.value) : x.delete("cidade");
            setParams(x);
          }}
        />
        {lojaId && (
          <button
            type="button"
            onClick={() => {
              const x = new URLSearchParams(params);
              x.delete("loja");
              setParams(x);
            }}
            className="rounded-brand border border-border bg-surface px-4 py-3 text-sm font-semibold text-dark hover:bg-border/60"
          >
            Limpar filtro de loja ✕
          </button>
        )}
      </div>

      {busy ? (
        <div className="flex items-center justify-center py-20" role="status">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="ml-3 text-[16px] text-muted">Carregando anúncios publicados...</span>
        </div>
      ) : error ? (
        <div className="rounded-brand border border-red-200 bg-red-50 p-6 text-center text-red-800" role="alert">
          <p className="font-semibold">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-brand border border-border bg-surface p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Car className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-dark">Nenhum veículo publicado encontrado no momento</h2>
          <p className="mx-auto mt-2 max-w-[580px] text-[16px] text-muted">
            Somente veículos de revendas parceiras verificadas e aprovadas são listados no catálogo. Não exibimos anúncios de demonstração como ofertas reais.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/#anuncie"
              className="inline-flex items-center gap-2 rounded-brand bg-primary px-6 py-3.5 font-bold text-white shadow-soft transition-colors hover:bg-primary-hover"
            >
              Anunciar minha revenda
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-brand border border-border bg-white px-6 py-3.5 font-bold text-dark transition-colors hover:bg-surface"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <article
              key={c.id}
              className="overflow-hidden rounded-brand border border-border bg-white shadow-soft transition-all hover:border-primary"
            >
              <Link to={`/veiculo/${encodeURIComponent(c.id)}`} className="block overflow-hidden bg-surface">
                {firstPhoto(c.photos) ? (
                  <img
                    src={firstPhoto(c.photos)!}
                    alt={c.title}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted">
                    Foto não disponível
                  </div>
                )}
              </Link>
              <div className="p-5">
                <Link to={`/veiculo/${encodeURIComponent(c.id)}`}>
                  <h2 className="text-xl font-bold text-dark transition-colors hover:text-primary">
                    {c.title}
                  </h2>
                </Link>
                <p className="mt-2 text-2xl font-black text-primary">{formatMoney(Number(c.price))}</p>
                <p className="mt-2 text-sm text-muted">
                  {c.model_year} ·{" "}
                  {c.mileage == null ? "Quilometragem não informada" : `${c.mileage.toLocaleString("pt-BR")} km`}
                </p>
                <p className="mt-2 text-sm font-medium text-dark">
                  {c.store_name} · {c.store_city}/{c.store_state}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <Link
                    to={`/veiculo/${encodeURIComponent(c.id)}`}
                    className="text-sm font-bold text-primary hover:text-dark"
                  >
                    Ver detalhes →
                  </Link>
                  <Link
                    to={`/lojas?loja=${encodeURIComponent(c.store_id)}`}
                    className="text-xs font-semibold text-muted hover:text-primary"
                  >
                    Ver loja
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
