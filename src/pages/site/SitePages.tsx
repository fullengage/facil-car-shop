// Páginas com parâmetros de rota (marca, modelo, cidade, veículo e loja) do portal.
import { useParams } from "react-router-dom";
import { Breadcrumbs } from "@/components/site/ui/Breadcrumbs";
import { Button } from "@/components/site/ui/Button";
import { Galeria } from "@/components/site/vehicles/Galeria";
import { PropostaForm } from "@/components/site/vehicles/PropostaForm";
import { VehicleCard } from "@/components/site/vehicles/VehicleCard";
import { Listagem } from "@/components/site/vehicles/Listagem";
import { LojaCard } from "@/components/site/stores/LojaCard";
import { Seo } from "@/components/site/Seo";
import { getCidadeBySlug, getLojaById, getLojaBySlug, getLojas, getMarcaBySlug, getSemelhantes, getVeiculoBySlug, getVeiculos, getVeiculosDaLoja } from "@/lib/site/data";
import { formatBRL, formatKm } from "@/lib/site/format";
import { slugify } from "@/lib/site/slug";
import { veiculoLd, lojaLd } from "@/lib/site/seo";
import { useSearchParamsObject } from "@/pages/site/params";
import { NotFoundInline } from "@/pages/site/NotFoundInline";
import { Check, MapPin, MessageCircle, Store, Clock, Mail, Phone, Star } from "lucide-react";

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

export function LojasListPage() {
  return (
    <>
      <Seo title="Lojas parceiras" description="Conheça as lojas e revendas parceiras, com estoque de carros seminovos e usados em cada cidade." canonical="/lojas" />
      <div className="mx-auto max-w-[1200px] px-5 py-12">
        <Breadcrumbs itens={[{ nome: "Lojas" }]} />
        <header className="mb-12 mt-6 max-w-[760px] space-y-4">
          <h1>Lojas parceiras</h1>
          <p className="text-[18px] leading-[30px]">Revendas verificadas com estoque de seminovos e usados. Escolha uma loja para ver todos os carros dela.</p>
        </header>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {getLojas().map((loja) => <LojaCard key={loja.id} loja={loja} />)}
        </div>
      </div>
    </>
  );
}
