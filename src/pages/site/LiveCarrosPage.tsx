import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Seo } from "@/components/site/Seo";
import { supabase } from "@/services/supabaseClient";

type PublicCar = {
 id: string; store_id: string; store_name: string; store_city: string; store_state: string;
 title: string; brand: string; model: string; version: string | null; model_year: number;
 price: number; mileage: number | null; photos: unknown; created_at: string;
};
const formatMoney = (n: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);
const firstPhoto = (photos: unknown): string | null => {
 if (!Array.isArray(photos)) return null;
 const first = photos[0];
 if (typeof first === "string" && /^https:\/\//.test(first)) return first;
 if (first && typeof first === "object" && "url" in first && typeof first.url === "string" && /^https:\/\//.test(first.url)) return first.url;
 return null;
};
export default function LiveCarrosPage() {
 const [cars,setCars]=useState<PublicCar[]>([]);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState("");
 const [params,setParams]=useSearchParams();
 const search=params.get("busca")||"";
 const cidade=params.get("cidade")||"";
 const lojaId=params.get("loja")||"";
 useEffect(()=>{
  let active=true;
  async function load() {
   if (!supabase) {if(active){setError("Catálogo temporariamente indisponível.");setBusy(false)}return}
   const {data,error:e}=await supabase.from("fcs_public_vehicle_listings")
      .select("id,store_id,store_name,store_city,store_state,title,brand,model,version,model_year,price,mileage,photos,created_at")
      .order("created_at",{ascending:false}).limit(300);
   if(active){if(e) setError("Não foi possível carregar o catálogo agora.");else setCars((data??[]) as PublicCar[]);setBusy(false)}
  }
  void load();
  return ()=>{active=false};
 },[]);
 const filtered=useMemo(()=>cars.filter(c=>
  (!search||[c.title,c.brand,c.model,c.store_name].some(v=>v?.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")))) &&
  (!cidade||c.store_city?.toLocaleLowerCase("pt-BR").includes(cidade.toLocaleLowerCase("pt-BR"))) &&
  (!lojaId||c.store_id===lojaId)
 ),[cars,search,cidade,lojaId]);
 return <div className="mx-auto max-w-[1200px] px-5 py-12">
  <Seo title="Carros seminovos e usados à venda" description="Anúncios publicados por revendas aprovadas no Fácil Car Shop." canonical="/carros"/>
  <h1 className="text-4xl font-black text-dark">Carros à venda</h1>
  <p className="mt-3">Veículos publicados por lojas cadastradas e aprovadas no portal.</p>
  <div className="mt-6 flex flex-wrap gap-3">
   <input aria-label="Buscar veículo ou loja" className="rounded-brand border border-border p-3" placeholder="Marca, modelo ou loja" value={search} onChange={e=>{const x=new URLSearchParams(params);e.target.value?x.set("busca",e.target.value):x.delete("busca");setParams(x)}}/>
   <input aria-label="Filtrar cidade" className="rounded-brand border border-border p-3" placeholder="Cidade" value={cidade} onChange={e=>{const x=new URLSearchParams(params);e.target.value?x.set("cidade",e.target.value):x.delete("cidade");setParams(x)}}/>
  </div>
  {busy?<p className="mt-12" role="status">Carregando anúncios...</p>:error?<p className="mt-12" role="alert">{error}</p>:filtered.length===0?<p className="mt-12 rounded-brand bg-surface p-8">Nenhum veículo publicado encontrado no momento. Não exibimos anúncios de demonstração como ofertas reais.</p>:
  <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
   {filtered.map(c=><article key={c.id} className="overflow-hidden rounded-brand border border-border">
     {firstPhoto(c.photos)?<img src={firstPhoto(c.photos)!} alt={c.title} loading="lazy" className="aspect-[4/3] w-full object-cover" referrerPolicy="no-referrer"/>:<div className="flex aspect-[4/3] items-center justify-center bg-surface text-muted">Foto não disponível</div>}
     <div className="p-5"><h2 className="text-xl font-bold text-dark">{c.title}</h2><p className="mt-2 text-2xl font-black text-primary">{formatMoney(Number(c.price))}</p>
      <p className="mt-2 text-sm">{c.model_year} · {c.mileage==null?"Quilometragem não informada":c.mileage.toLocaleString("pt-BR")+" km"}</p>
      <p className="mt-2 text-sm font-medium">{c.store_name} · {c.store_city}/{c.store_state}</p>
      <Link to={`/lojas?loja=${encodeURIComponent(c.store_id)}`} className="mt-4 inline-block text-sm font-bold text-primary">Ver loja</Link>
     </div>
   </article>)}
  </div>}
 </div>;
}
