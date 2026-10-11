import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Seo } from "@/components/site/Seo";
import { supabase } from "@/services/supabaseClient";

type PublicStore={id:string;name:string;slug:string|null;address_city:string|null;address_state:string|null;status:string};
type Item={store_id:string;id:string};
export default function LiveLojasPage(){
 const [stores,setStores]=useState<PublicStore[]>([]);
 const [counts,setCounts]=useState<Record<string,number>>({});
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState("");
 const [params]=useSearchParams();
 const selected=params.get("loja");
 useEffect(()=>{let active=true;async function load(){
  if(!supabase){if(active){setError("Lojas temporariamente indisponíveis.");setBusy(false)}return}
  const [s,v]=await Promise.all([
    supabase.from("fcs_stores").select("id,name,slug,address_city,address_state,status").eq("status","approved").order("name").limit(300),
    supabase.from("fcs_public_vehicle_listings").select("id,store_id").limit(1000)
  ]);
  if(!active)return;
  if(s.error || v.error)setError("Não foi possível carregar as lojas agora.");
  else{
   setStores((s.data??[]) as PublicStore[]);
   const result:Record<string,number>={};
   for(const item of (v.data??[]) as Item[])result[item.store_id]=(result[item.store_id]||0)+1;
   setCounts(result);
  }
  setBusy(false);
 }void load();return()=>{active=false}},[]);
 const visible=useMemo(()=>selected?stores.filter(x=>x.id===selected):stores,[stores,selected]);
 return <div className="mx-auto max-w-[1200px] px-5 py-12">
  <Seo title="Lojas e revendas de veículos" description="Conheça as lojas aprovadas no Fácil Car Shop e seus anúncios reais." canonical="/lojas"/>
  <h1 className="text-4xl font-black text-dark">Lojas e revendas</h1>
  <p className="mt-3">Somente estabelecimentos aprovados e cadastrados no portal.</p>
  {selected&&<Link to="/lojas" className="mt-4 inline-block text-primary font-bold">Ver todas as lojas</Link>}
  {busy?<p className="mt-10" role="status">Carregando lojas...</p>:error?<p className="mt-10" role="alert">{error}</p>:visible.length===0?<p className="mt-10 rounded-brand bg-surface p-8">Nenhuma loja aprovada encontrada. Lojas demonstrativas não são apresentadas como parceiras.</p>:
   <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{visible.map(x=><article key={x.id} className="rounded-brand border border-border p-6">
    <h2 className="text-2xl font-bold text-dark">{x.name}</h2><p className="mt-2">{x.address_city||"Cidade não informada"} / {x.address_state||"UF não informada"}</p>
    <p className="mt-2">{counts[x.id]||0} anúncios publicados</p>
    <Link to={`/carros?loja=${encodeURIComponent(x.id)}`} className="mt-4 inline-block font-bold text-primary">Ver veículos da loja</Link>
   </article>)}</div>}
 </div>
}