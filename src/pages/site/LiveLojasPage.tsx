import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Seo } from "@/components/site/Seo";
import { Breadcrumbs } from "@/components/site/ui/Breadcrumbs";
import { supabase } from "@/services/supabaseClient";
import { Car, MapPin, Store } from "lucide-react";

type PublicStore = {
  id: string;
  name: string;
  slug: string | null;
  address_city: string | null;
  address_state: string | null;
  status: string;
};

type Item = { store_id: string; id: string };

export default function LiveLojasPage() {
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [params] = useSearchParams();
  const selected = params.get("loja");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) {
        if (active) {
          setError("Lojas temporariamente indisponíveis.");
          setBusy(false);
        }
        return;
      }
      const [s, v] = await Promise.all([
        supabase
          .from("fcs_stores")
          .select("id,name,slug,address_city,address_state,status")
          .eq("status", "approved")
          .order("name")
          .limit(300),
        supabase.from("fcs_public_vehicle_listings").select("id,store_id").limit(1000),
      ]);
      if (!active) return;
      if (s.error || v.error) {
        setError("Não foi possível carregar as lojas agora.");
      } else {
        setStores((s.data ?? []) as PublicStore[]);
        const result: Record<string, number> = {};
        for (const item of (v.data ?? []) as Item[]) {
          result[item.store_id] = (result[item.store_id] || 0) + 1;
        }
        setCounts(result);
      }
      setBusy(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(
    () => (selected ? stores.filter((x) => x.id === selected) : stores),
    [stores, selected]
  );

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12">
      <Seo
        title="Lojas e revendas de veículos parceiras"
        description="Conheça as lojas aprovadas no Fácil Car Shop e seus anúncios reais."
        canonical="/lojas"
      />
      <Breadcrumbs itens={[{ nome: "Lojas" }]} />
      <header className="mb-10 mt-6 max-w-[760px] space-y-4">
        <h1 className="text-4xl font-black text-dark">Lojas parceiras</h1>
        <p className="text-[18px] leading-[30px] text-muted">
          Revendas credenciadas com procedência garantida. Somente estabelecimentos devidamente auditados e aprovados são exibidos.
        </p>
      </header>

      {selected && (
        <div className="mb-6">
          <Link
            to="/lojas"
            className="inline-flex items-center gap-2 rounded-brand border border-border bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-surface"
          >
            ← Ver todas as lojas
          </Link>
        </div>
      )}

      {busy ? (
        <div className="flex items-center justify-center py-20" role="status">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="ml-3 text-[16px] text-muted">Carregando lojas credenciadas...</span>
        </div>
      ) : error ? (
        <div className="rounded-brand border border-red-200 bg-red-50 p-6 text-center text-red-800" role="alert">
          <p className="font-semibold">{error}</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-brand border border-border bg-surface p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Store className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-dark">Nenhuma loja parceira aprovada no momento</h2>
          <p className="mx-auto mt-2 max-w-[580px] text-[16px] text-muted">
            Todas as lojas e revendas cadastradas passam por rigorosa validação cadastral e de procedência antes de serem publicadas na plataforma. Não exibimos lojas demonstrativas ou fictícias.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/#anuncie"
              className="inline-flex items-center gap-2 rounded-brand bg-primary px-6 py-3.5 font-bold text-white shadow-soft transition-colors hover:bg-primary-hover"
            >
              Cadastrar minha loja
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
          {visible.map((x) => (
            <article
              key={x.id}
              className="flex h-full flex-col gap-5 rounded-brand border border-border bg-white p-7 shadow-soft transition-colors hover:border-primary"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-brand bg-dark text-[22px] font-black text-white">
                  {x.name.charAt(0)}
                </span>
                <span className="rounded bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Aprovada
                </span>
              </div>
              <div className="space-y-2">
                <h2 className="text-[22px] font-bold leading-[28px] text-dark">{x.name}</h2>
                <p className="flex items-center gap-2 text-[15px] text-muted">
                  <MapPin className="h-4 w-4 text-primary" aria-hidden />{" "}
                  {x.address_city || "Cidade não informada"} / {x.address_state || "UF"}
                </p>
                <p className="flex items-center gap-2 text-[15px] text-muted">
                  <Car className="h-4 w-4 text-primary" aria-hidden />{" "}
                  {counts[x.id] || 0} {counts[x.id] === 1 ? "anúncio publicado" : "anúncios publicados"}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                <Link
                  to={`/carros?loja=${encodeURIComponent(x.id)}`}
                  className="text-sm font-bold text-primary hover:text-dark"
                >
                  Ver veículos da loja →
                </Link>
                {x.slug && (
                  <Link
                    to={`/lojas/${encodeURIComponent(x.slug)}`}
                    className="text-xs font-semibold text-muted hover:text-primary"
                  >
                    Página da loja
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}