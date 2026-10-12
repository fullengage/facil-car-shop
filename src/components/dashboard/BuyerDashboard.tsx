import * as React from 'react'
import { Heart, Bell, FileText } from 'lucide-react'
import type { Vehicle } from '@/types'

interface BuyerDashboardProps {
  vehicles: Vehicle[]
  onSelectVehicle?: (vehicle: Vehicle) => void
}

/** Não inferir favoritos a partir do estoque da loja: somente dados persistidos do próprio usuário podem aparecer aqui. */
export function BuyerDashboard(_props: BuyerDashboardProps) {
  const [tab, setTab] = React.useState<'favorites'|'alerts'|'proposals'>('favorites')
  const tabs = [
    { id: 'favorites' as const, label: 'Favoritos', icon: Heart },
    { id: 'alerts' as const, label: 'Alertas', icon: Bell },
    { id: 'proposals' as const, label: 'Propostas', icon: FileText },
  ]
  const content = {
    favorites: { title: 'Seus veículos favoritos', detail: 'Nenhum favorito foi carregado para sua conta. Explore o catálogo e salve carros quando a função estiver disponível.' },
    alerts: { title: 'Seus alertas', detail: 'Ainda não há alertas vinculados à sua conta. A configuração de alertas está em preparação.' },
    proposals: { title: 'Suas propostas', detail: 'Nenhuma proposta foi carregada. O histórico autenticado de propostas será disponibilizado aqui.' },
  }
  return <div className="space-y-6">
    <header>
      <p className="text-sm font-bold uppercase text-primary">Minha área</p>
      <h2 className="mt-2 text-3xl font-black text-dark">Encontre seu próximo carro</h2>
      <p className="mt-2 text-text">Uma área pessoal para acompanhar veículos, alertas e propostas.</p>
    </header>
    <nav aria-label="Área do comprador" className="flex flex-wrap gap-2">
      {tabs.map(t=>{const Icon=t.icon;return <button key={t.id} type="button" aria-current={tab===t.id?'page':undefined}
        onClick={()=>setTab(t.id)} className={`inline-flex items-center gap-2 rounded-brand px-4 py-3 text-sm font-bold ${tab===t.id?'bg-primary text-white':'bg-white text-dark border border-border'}`}>
        <Icon className="h-4 w-4"/>{t.label}</button>})}
    </nav>
    <section className="rounded-brand border border-border bg-white p-8" role="status">
      <h3 className="text-xl font-bold text-dark">{content[tab].title}</h3>
      <p className="mt-2 text-text">{content[tab].detail}</p>
      <a href="/carros" className="mt-5 inline-block rounded-brand bg-primary px-5 py-3 font-bold text-white">Explorar veículos</a>
    </section>
  </div>
}
