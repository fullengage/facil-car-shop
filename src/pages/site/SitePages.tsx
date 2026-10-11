// Páginas com parâmetros de rota (marca, modelo, cidade, veículo e loja) do portal.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumbs } from "@/components/site/ui/Breadcrumbs";
import { Button } from "@/components/site/ui/Button";
import { Galeria } from "@/components/site/vehicles/Galeria";
import { PropostaForm } from "@/components/site/vehicles/PropostaForm";
import { VehicleCard } from "@/components/site/vehicles/VehicleCard";
import { Listagem } from "@/components/site/vehicles/Listagem";
import { Seo } from "@/components/site/Seo";
import { getCidadeBySlug, getLojaById, getLojaBySlug, getMarcaBySlug, getSemelhantes, getVeiculoBySlug, getVeiculos, getVeiculosDaLoja } from "@/lib/site/data";
import { formatBRL, formatKm } from "@/lib/site/format";
import { slugify } from "@/lib/site/slug";
import { veiculoLd, lojaLd } from "@/lib/site/seo";
import { useSearchParamsObject } from "@/pages/site/params";
import { NotFoundInline } from "@/pages/site/NotFoundInline";
import { Car, Check, MapPin, MessageCircle, Store, Clock, Mail, Phone, Star } from "lucide-react";
import { supabase } from "@/services/supabaseClient";

function modeloDaMarca(marca: string, modelo: string) {
  const veiculos = getVeiculos().filter((v) => v.marca === marca && slugify(v.modelo) === modelo);
  return veiculos.length ? { veiculos, nome: veiculos[0].modelo } : null;
}

export function MarcaPage() {
  const { marca: slug = "" } = useParams();
  const marca = getMarcaBySlug(slug);
  const searchParams = useSearchParamsObject();
  if (!marca) return <NotFoundInline />;
  return (
    <>
      <Seo
        title={`Carros ${marca.nome} seminovos e usados`}
        description={`Encontre carros ${marca.nome} seminovos e usados à venda. Compare preços com a Tabela FIPE e fale com a loja pelo WhatsApp.`}
        canonical={`/carros/${marca.slug}`}
      />
      <Listagem
        veiculos={getVeiculos().filter((v) => v.marca === marca.slug)}
        base={`/carros/${marca.slug}`}
        searchParams={searchParams}
        marcaFixa={marca.slug}
        h1={`Carros ${marca.nome} seminovos e usados`}
        intro={`Veja os ${marca.nome} à venda nas lojas parceiras. Filtre por modelo, ano, câmbio e cidade, e compare cada preço com a Tabela FIPE.`}
        crumbs={[{ nome: marca.nome, path: `/carros/${marca.slug}` }]}
      />
    </>
  );
}

export function ModeloPage() {
  const { marca = "", modelo = "" } = useParams();
  const m = getMarcaBySlug(marca);
  const achado = modeloDaMarca(marca, modelo);
  const searchParams = useSearchParamsObject();
  if (!m || !achado) return <NotFoundInline />;
  return (
    <>
      <Seo
        title={`${m.nome} ${achado.nome} seminovo e usado`}
        description={`${achado.veiculos.length} ${m.nome} ${achado.nome} à venda de lojas parceiras. Compare preços com a Tabela FIPE e fale com o vendedor.`}
        canonical={`/carros/${marca}/${modelo}`}
      />
      <Listagem
        veiculos={achado.veiculos}
        base={`/carros/${m.slug}/${modelo}`}
        searchParams={searchParams}
        marcaFixa={m.slug}
        h1={`${m.nome} ${achado.nome} seminovo e usado`}
        intro={`Anúncios de ${m.nome} ${achado.nome} de lojas parceiras. Compare os anos, a quilometragem e o preço de cada unidade com a Tabela FIPE.`}
        crumbs={[{ nome: m.nome, path: `/carros/${m.slug}` }, { nome: achado.nome }]}
      />
    </>
  );
}

export function CidadePage() {
  const { cidade: slug = "" } = useParams();
  const cidade = getCidadeBySlug(slug);
  const searchParams = useSearchParamsObject();
  if (!cidade) return <NotFoundInline />;
  return (
    <>
      <Seo
        title={`Carros seminovos e usados em ${cidade.nome}`}
        description={`Carros seminovos e usados à venda em ${cidade.nome}, ${cidade.uf}. Lojas parceiras, preço comparado à Tabela FIPE e contato pelo WhatsApp.`}
        canonical={`/carros-em/${cidade.slug}`}
      />
      <Listagem
        veiculos={getVeiculos().filter((v) => v.cidade === cidade.slug)}
        base={`/carros-em/${cidade.slug}`}
        searchParams={searchParams}
        h1={`Carros seminovos e usados em ${cidade.nome}`}
        intro={`Carros de lojas e revendas de ${cidade.nome}, ${cidade.uf}. Veja a ficha de cada veículo, compare com a Tabela FIPE e agende a visita.`}
        crumbs={[{ nome: `Carros em ${cidade.nome}`, path: `/carros-em/${cidade.slug}` }]}
      />
    </>
  );
}

export function VeiculoPage() {
  const { slug = "" } = useParams();
  const v = getVeiculoBySlug(slug);
  if (!v) return <NotFoundInline />;
  const loja = getLojaById(v.lojaId);
  const semelhantes = getSemelhantes(v);
  const whatsapp = loja ? `https://wa.me/${loja.whatsapp}?text=${encodeURIComponent(`Olá! Vi o ${v.titulo} por ${formatBRL(v.preco)} no portal e tenho interesse.`)}` : null;
  const ficha: [string, string][] = [
    ["Marca", v.marca], ["Modelo", v.modelo], ["Versão", v.versao], ["Ano", String(v.ano)],
    ["Quilometragem", formatKm(v.km)], ["Câmbio", v.cambio], ["Combustível", v.combustivel],
    ["Carroceria", v.carroceria], ["Motor", v.motor], ["Potência", v.potencia],
    ["Portas", v.portas ? String(v.portas) : "—"], ["Cor", v.cor],
  ];
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12">
      <Seo
        title={`${v.titulo} à venda em ${v.cidadeNome}`}
        description={`${v.titulo}, ${formatKm(v.km)}, ${v.cambio.toLowerCase()}, ${v.combustivel.toLowerCase()}. ${formatBRL(v.preco)} em ${v.cidadeNome}.`}
        canonical={`/veiculo/${v.slug}`}
        jsonLd={loja ? [veiculoLd(v, loja)] : [veiculoLd(v, undefined)]}
      />
      <Breadcrumbs itens={[{ nome: v.marca, path: `/carros/${v.marca}` }, { nome: v.modelo, path: `/carros/${v.marca}/${slugify(v.modelo)}` }, { nome: v.titulo }]} />
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-12">
          <Galeria fotos={v.fotos} alt={v.titulo} />
          <header className="space-y-3">
            <p className="text-[14px] font-medium uppercase tracking-wide text-primary">{v.marca}</p>
            <h1 className="text-[32px] leading-[38px] md:text-[40px] md:leading-[48px]">{v.titulo}</h1>
            <p className="flex items-center gap-2 text-[16px]"><MapPin className="h-4 w-4 text-primary" aria-hidden /> {v.cidadeNome}</p>
          </header>
          <section className="space-y-5">
            <h2 className="text-[26px] leading-[32px] md:text-[30px] md:leading-[38px]">Ficha técnica</h2>
            <dl className="grid gap-x-10 sm:grid-cols-2">
              {ficha.map(([label, valor]) => (
                <div key={label} className="flex justify-between border-b border-border py-3">
                  <dt>{label}</dt>
                  <dd className="font-bold text-dark">{valor}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="space-y-5">
            <h2 className="text-[26px] leading-[32px] md:text-[30px] md:leading-[38px]">Opcionais</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {v.opcionais.map((o) => (
                <li key={o} className="flex items-center gap-3"><Check className="h-4 w-4 text-primary" aria-hidden /> {o}</li>
              ))}
            </ul>
          </section>
          <section className="space-y-5">
            <h2 className="text-[26px] leading-[32px] md:text-[30px] md:leading-[38px]">Descrição</h2>
            <p className="leading-[28px]">{v.descricao}</p>
          </section>
        </div>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="space-y-7 rounded-brand bg-dark p-8 text-white shadow-soft">
            <div>
              <p className="text-[14px] uppercase tracking-wide text-white/60">Preço</p>
              <p className="text-[40px] font-black leading-none text-primary">{formatBRL(v.preco)}</p>
            </div>
            {loja && (
              <div className="space-y-2 border-t border-white/10 pt-6">
                <p className="flex items-center gap-2 text-[17px] font-bold"><Store className="h-4 w-4 text-primary" aria-hidden /> {loja.nome}</p>
                <p className="text-[14px] text-white/70">{loja.horario}</p>
                <Button href={`/lojas/${loja.slug}`} variant="light" size="sm" arrow={false}>Ver estoque da loja</Button>
              </div>
            )}
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-brand bg-emerald-600 py-4 font-medium uppercase tracking-wide text-white hover:bg-emerald-500">
                <MessageCircle className="h-5 w-5" aria-hidden /> Chamar no WhatsApp
              </a>
            )}
            <div className="space-y-3 border-t border-white/10 pt-6">
              <p className="text-[16px] font-bold">Faça uma proposta</p>
              <div className="text-dark">
                <PropostaForm titulo={v.titulo} loja={loja?.nome ?? "loja"} veiculoId={v.id} lojaId={v.lojaId} />
              </div>
            </div>
          </div>
        </aside>
      </div>
      {semelhantes.length > 0 && (
        <section className="mt-24 space-y-10">
          <h2 className="text-[30px] leading-[36px] md:text-[40px] md:leading-[48px]">Veículos semelhantes</h2>
          <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
            {semelhantes.map((s) => <VehicleCard key={s.id} v={s} />)}
          </div>
        </section>
      )}
    </div>
  );
}

export function LojaPage() {
  const { slug = "" } = useParams();
  const loja = getLojaBySlug(slug);
  if (!loja) return <NotFoundInline />;
  const estoque = getVeiculosDaLoja(loja.id);
  const endereco = `${loja.endereco}, ${loja.cidade} - ${loja.uf}`;
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12">
      <Seo
        title={`${loja.nome}, estoque de seminovos em ${loja.cidade}`}
        description={`Veja o estoque da ${loja.nome} em ${loja.cidade}, ${loja.uf}. ${loja.descricao}`}
        canonical={`/lojas/${loja.slug}`}
        jsonLd={[lojaLd(loja)]}
      />
      <Breadcrumbs itens={[{ nome: "Lojas", path: "/lojas" }, { nome: loja.nome }]} />
      <header className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <div className="flex items-center gap-5">
            <span className="flex h-20 w-20 items-center justify-center rounded-brand bg-dark text-[32px] font-black text-white">{loja.nome.charAt(0)}</span>
            <div>
              <h1 className="text-[32px] leading-[38px] md:text-[40px] md:leading-[48px]">{loja.nome}</h1>
              <p className="flex items-center gap-2 text-[16px]"><Star className="h-4 w-4 fill-accent text-accent" aria-hidden /> {loja.avaliacao.toLocaleString("pt-BR")} · {loja.cidade}, {loja.uf}</p>
            </div>
          </div>
          <p className="max-w-[640px] text-[18px] leading-[30px]">{loja.descricao}</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            <li className="flex items-start gap-3"><MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden /> {endereco}</li>
            <li className="flex items-start gap-3"><Clock className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden /> {loja.horario}</li>
            <li className="flex items-start gap-3"><Phone className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden /> {loja.telefone}</li>
            <li className="flex items-start gap-3"><Mail className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden /> {loja.email}</li>
          </ul>
          <a href={`https://wa.me/${loja.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-brand bg-emerald-600 px-6 py-4 font-medium uppercase tracking-wide text-white hover:bg-emerald-500">
            <MessageCircle className="h-5 w-5" aria-hidden /> Falar com a loja
          </a>
        </div>
        <div className="relative min-h-[320px] overflow-hidden rounded-brand bg-surface">
          <iframe title={`Mapa: ${loja.nome}`} src={`https://www.google.com/maps?q=${encodeURIComponent(endereco)}&output=embed`} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </header>
      <section className="mt-24 space-y-10">
        <h2 className="text-[30px] leading-[36px] md:text-[40px] md:leading-[48px]">Estoque da {loja.nome}</h2>
        {estoque.length > 0 ? (
          <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
            {estoque.map((v) => <VehicleCard key={v.id} v={v} />)}
          </div>
        ) : (
          <p>Esta loja não tem veículos anunciados no momento.</p>
        )}
      </section>
    </div>
  );
}

type RealStore = {
  id: string;
  name: string;
  slug: string | null;
  address_city: string | null;
  address_state: string | null;
  count: number;
};

export function LojasListPage() {
  const [stores, setStores] = useState<RealStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadStores() {
      if (!supabase) {
        if (active) setLoading(false);
        return;
      }
      try {
        const [storesRes, listingsRes] = await Promise.all([
          supabase
            .from("fcs_stores")
            .select("id, name, slug, address_city, address_state, status")
            .eq("status", "approved")
            .order("name")
            .limit(100),
          supabase
            .from("fcs_public_vehicle_listings")
            .select("store_id")
            .limit(1000)
        ]);

        if (!active) return;

        if (storesRes.error) {
          setError("Não foi possível carregar as lojas no momento.");
        } else {
          const counts: Record<string, number> = {};
          if (listingsRes.data) {
            for (const item of listingsRes.data) {
              if (item.store_id) {
                counts[item.store_id] = (counts[item.store_id] || 0) + 1;
              }
            }
          }
          const loaded = (storesRes.data || []).map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            address_city: s.address_city,
            address_state: s.address_state,
            count: counts[s.id] || 0,
          }));
          setStores(loaded);
        }
      } catch {
        if (active) setError("Falha ao carregar catálogo de lojas parceiras.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadStores();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Seo
        title="Lojas parceiras"
        description="Conheça as lojas e revendas parceiras credenciadas no Fácil Car Shop."
        canonical="/lojas"
      />
      <div className="mx-auto max-w-[1200px] px-5 py-12">
        <Breadcrumbs itens={[{ nome: "Lojas" }]} />
        <header className="mb-12 mt-6 max-w-[760px] space-y-4">
          <h1>Lojas parceiras</h1>
          <p className="text-[18px] leading-[30px]">
            Revendas credenciadas com procedência garantida. Somente estabelecimentos aprovados e auditados são exibidos.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-16" role="status">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span className="ml-3 text-[16px] text-muted">Carregando lojas parceiras...</span>
          </div>
        ) : error ? (
          <div className="rounded-brand border border-red-200 bg-red-50 p-6 text-center text-red-800" role="alert">
            <p className="font-semibold">{error}</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="rounded-brand border border-border bg-surface p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Store className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-dark">Nenhuma loja parceira aprovada no momento</h2>
            <p className="mx-auto mt-2 max-w-[580px] text-[16px] text-muted">
              Todas as revendas cadastradas passam por análise documental e validação de procedência antes de serem publicadas no catálogo. Não exibimos lojas demonstrativas ou fictícias.
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
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((loja) => (
              <article key={loja.id} className="flex h-full flex-col gap-5 rounded-brand border border-border bg-white p-7 transition-colors hover:border-primary">
                <div className="flex items-center justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-brand bg-dark text-[22px] font-black text-white">
                    {loja.name.charAt(0)}
                  </span>
                  <span className="rounded bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Aprovada
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[22px] font-bold leading-[28px] text-dark">{loja.name}</h3>
                  <p className="flex items-center gap-2 text-[15px] text-muted">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden /> {loja.address_city || "Cidade não informada"}, {loja.address_state || "UF"}
                  </p>
                  <p className="flex items-center gap-2 text-[15px] text-muted">
                    <Car className="h-4 w-4 text-primary" aria-hidden /> {loja.count} {loja.count === 1 ? "veículo publicado" : "veículos publicados"}
                  </p>
                </div>
                <Link
                  to={loja.slug ? `/lojas/${loja.slug}` : `/carros?loja=${encodeURIComponent(loja.id)}`}
                  className="mt-auto text-[15px] font-medium uppercase tracking-wide text-primary hover:text-dark"
                >
                  Ver veículos da loja →
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
